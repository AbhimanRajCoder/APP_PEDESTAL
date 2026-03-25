"""
Lesson service – content delivery and completion logic.
"""

from uuid import UUID
from datetime import datetime, timezone
from fastapi import HTTPException, status

from app.core.database import get_supabase
from app.core.constants import XP_PER_LEVEL, XP_MULTIPLIER_ADVANCED
from app.schemas.lesson import (
    LessonResponse,
    LessonBlockResponse,
    LessonCompleteRequest,
    LessonCompleteResponse,
    NextLessonResponse,
)


class LessonService:
    """Handles lesson content delivery, completion, and next-lesson logic."""

    def __init__(self):
        self.db = get_supabase()

    async def get_lesson(self, lesson_id: UUID) -> LessonResponse:
        """
        Fetch a lesson with all its content blocks.
        If video exists → include video_url.
        Always return blocks ordered by order_index.
        """
        # Fetch lesson
        lesson_result = (
            self.db.table("lessons")
            .select("*")
            .eq("id", str(lesson_id))
            .eq("is_active", True)
            .single()
            .execute()
        )

        if not lesson_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Lesson not found",
            )

        lesson = lesson_result.data

        # Fetch blocks
        blocks_result = (
            self.db.table("lesson_blocks")
            .select("*")
            .eq("lesson_id", str(lesson_id))
            .eq("is_active", True)
            .order("order_index")
            .execute()
        )

        blocks = [
            LessonBlockResponse(
                id=b["id"],
                block_type=b["block_type"],
                order_index=b["order_index"],
                content=b["content"],
            )
            for b in (blocks_result.data or [])
        ]

        return LessonResponse(
            id=lesson["id"],
            track_id=lesson["track_id"],
            title=lesson["title"],
            description=lesson.get("description"),
            difficulty_level=lesson["difficulty_level"],
            energy_cost=lesson["energy_cost"],
            xp_reward=lesson["xp_reward"],
            order_index=lesson["order_index"],
            has_video=lesson["has_video"],
            video_url=lesson.get("video_url") if lesson["has_video"] else None,
            estimated_duration_seconds=lesson.get("estimated_duration_seconds"),
            is_remedial=lesson["is_remedial"],
            blocks=blocks,
        )

    async def complete_lesson(
        self, lesson_id: UUID, user_profile_id: UUID, request: LessonCompleteRequest
    ) -> LessonCompleteResponse:
        """
        Idempotent lesson completion.
        - Records/updates progress
        - Awards XP (only once per completion)
        - Checks for level up
        - Determines next lesson
        """
        lesson = await self.get_lesson(lesson_id)

        # Check for existing progress (idempotent)
        existing = (
            self.db.table("user_progress")
            .select("*")
            .eq("user_id", str(user_profile_id))
            .eq("lesson_id", str(lesson_id))
            .execute()
        )

        now = datetime.now(timezone.utc).isoformat()
        xp_earned = 0
        already_completed = False

        if existing.data and len(existing.data) > 0:
            record = existing.data[0]
            if record["is_completed"]:
                already_completed = True
            else:
                # First completion
                xp_earned = self._calculate_xp(lesson)
                update_data = {
                    "is_completed": True,
                    "quiz_score": request.quiz_score,
                    "attempts": record["attempts"] + 1,
                    "best_score": max(
                        request.quiz_score or 0,
                        record.get("best_score") or 0,
                    ),
                    "xp_earned": xp_earned,
                    "completed_at": now,
                }
                self.db.table("user_progress").update(update_data).eq(
                    "id", record["id"]
                ).execute()
        else:
            # New progress record
            xp_earned = self._calculate_xp(lesson)
            self.db.table("user_progress").insert(
                {
                    "user_id": str(user_profile_id),
                    "lesson_id": str(lesson_id),
                    "is_completed": True,
                    "quiz_score": request.quiz_score,
                    "attempts": 1,
                    "best_score": request.quiz_score,
                    "xp_earned": xp_earned,
                    "started_at": now,
                    "completed_at": now,
                }
            ).execute()

        # Update user XP and check level up
        level_up = False
        new_level = 1
        new_xp_total = 0

        if not already_completed and xp_earned > 0:
            profile = (
                self.db.table("user_profiles")
                .select("xp_total, level")
                .eq("id", str(user_profile_id))
                .single()
                .execute()
            )

            if profile.data:
                new_xp_total = profile.data["xp_total"] + xp_earned
                new_level = profile.data["level"]

                # Level up check
                while new_xp_total >= new_level * XP_PER_LEVEL:
                    new_level += 1
                    level_up = True

                self.db.table("user_profiles").update(
                    {"xp_total": new_xp_total, "level": new_level}
                ).eq("id", str(user_profile_id)).execute()

        # Find next lesson
        next_lesson_id = await self._find_next_lesson(lesson)

        return LessonCompleteResponse(
            lesson_id=lesson_id,
            xp_earned=xp_earned if not already_completed else 0,
            new_xp_total=new_xp_total,
            level_up=level_up,
            new_level=new_level,
            next_lesson_id=next_lesson_id,
            difficulty_adjusted=False,
            reinforcement_queued=False,
            message="Already completed" if already_completed else "Lesson completed!",
        )

    async def get_next_lesson(
        self, user_profile_id: UUID
    ) -> NextLessonResponse:
        """
        Determine the next lesson for a user:
        1. Check reinforcement queue first
        2. Otherwise find next uncompleted lesson in assigned track
        """
        # Check reinforcement queue
        reinforcement = (
            self.db.table("reinforcement_queue")
            .select("*, lessons(*)")
            .eq("user_id", str(user_profile_id))
            .eq("is_completed", False)
            .order("priority", desc=True)
            .limit(1)
            .execute()
        )

        if reinforcement.data and len(reinforcement.data) > 0:
            item = reinforcement.data[0]
            lesson = await self.get_lesson(UUID(item["lesson_id"]))
            return NextLessonResponse(
                lesson=lesson,
                reason="reinforcement",
                has_reinforcement_pending=True,
            )

        # Get user's assigned track
        profile = (
            self.db.table("user_profiles")
            .select("assigned_track_id, current_difficulty_level")
            .eq("id", str(user_profile_id))
            .single()
            .execute()
        )

        if not profile.data or not profile.data.get("assigned_track_id"):
            return NextLessonResponse(
                lesson=None,
                reason="no_track_assigned",
                has_reinforcement_pending=False,
            )

        track_id = profile.data["assigned_track_id"]

        # Get completed lesson IDs for this user
        completed = (
            self.db.table("user_progress")
            .select("lesson_id")
            .eq("user_id", str(user_profile_id))
            .eq("is_completed", True)
            .execute()
        )
        completed_ids = {r["lesson_id"] for r in (completed.data or [])}

        # Find next uncompleted lesson in track
        lessons = (
            self.db.table("lessons")
            .select("*")
            .eq("track_id", track_id)
            .eq("is_active", True)
            .order("order_index")
            .execute()
        )

        for l in (lessons.data or []):
            if l["id"] not in completed_ids:
                lesson = await self.get_lesson(UUID(l["id"]))
                return NextLessonResponse(
                    lesson=lesson,
                    reason="next_in_track",
                    has_reinforcement_pending=False,
                )

        # All lessons completed
        return NextLessonResponse(
            lesson=None,
            reason="track_completed",
            has_reinforcement_pending=False,
        )

    def _calculate_xp(self, lesson: LessonResponse) -> int:
        """Calculate XP reward for a lesson, with difficulty bonus."""
        xp = lesson.xp_reward
        if lesson.difficulty_level >= 3:
            xp = int(xp * XP_MULTIPLIER_ADVANCED)
        return xp

    async def _find_next_lesson(self, current_lesson: LessonResponse) -> UUID | None:
        """Find the next lesson after the current one in the same track."""
        result = (
            self.db.table("lessons")
            .select("id")
            .eq("track_id", str(current_lesson.track_id))
            .eq("is_active", True)
            .gt("order_index", current_lesson.order_index)
            .order("order_index")
            .limit(1)
            .execute()
        )

        if result.data and len(result.data) > 0:
            return UUID(result.data[0]["id"])
        return None
