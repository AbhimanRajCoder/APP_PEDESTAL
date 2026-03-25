"""
Adaptive learning service – Reinforced Learning Stack engine.

Evaluates quiz performance and dynamically adjusts:
- Difficulty level
- Adaptive scores (risk, discipline, knowledge, stability)
- Reinforcement queue (remedial lessons, flashcards)
- Next lesson path
"""

from uuid import UUID
from datetime import datetime, timezone
from fastapi import HTTPException, status

from app.core.database import get_supabase
from app.core.constants import (
    QUIZ_ADVANCE_THRESHOLD,
    QUIZ_REMEDIAL_THRESHOLD,
    SCORE_INCREMENT,
    SCORE_DECREMENT,
    SCORE_MIN,
    SCORE_MAX,
    MIN_DIFFICULTY,
    MAX_DIFFICULTY,
    DIFFICULTY_STEP_UP,
    DIFFICULTY_STEP_DOWN,
    REMEDIAL_PRIORITY,
    FLASHCARD_PRIORITY,
)
from app.schemas.adaptive import AdaptivePathResponse, AdaptiveScores


class AdaptiveService:
    """
    Core adaptive evaluation engine.

    Behavior rules:
    - quiz_score >= 80%: advance difficulty, increase scores, reward XP
    - quiz_score <= 50%: assign remedial, queue flashcards, decrease scores
    - 50% < quiz_score < 80%: maintain current path, slight score adjustment
    """

    def __init__(self):
        self.db = get_supabase()

    async def evaluate_performance(
        self,
        user_profile_id: UUID,
        lesson_id: UUID,
        quiz_score: float,
        quiz_attempt_id: UUID | None = None,
    ) -> dict:
        """
        Evaluate quiz performance and adjust the learning path.

        Returns a dict containing:
        - difficulty_change: int (+1, 0, -1)
        - remedial_assigned: bool
        - flashcards_queued: bool
        - next_lesson_id: UUID | None
        - scores_updated: dict
        """
        # Get current user profile
        profile = (
            self.db.table("user_profiles")
            .select("*")
            .eq("id", str(user_profile_id))
            .single()
            .execute()
        )

        if not profile.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User profile not found",
            )

        user = profile.data
        current_difficulty = user["current_difficulty_level"]

        result = {
            "difficulty_change": 0,
            "remedial_assigned": False,
            "flashcards_queued": False,
            "next_lesson_id": None,
            "scores_updated": {},
        }

        if quiz_score >= QUIZ_ADVANCE_THRESHOLD:
            # ✅ Strong performance – advance
            result = await self._handle_advance(
                user, lesson_id, quiz_score, quiz_attempt_id
            )

        elif quiz_score <= QUIZ_REMEDIAL_THRESHOLD:
            # ❌ Weak performance – remediate
            result = await self._handle_remedial(
                user, lesson_id, quiz_score, quiz_attempt_id
            )

        else:
            # ⚠️ Middle ground – maintain
            result = await self._handle_maintain(
                user, lesson_id, quiz_score
            )

        return result

    async def get_next_path(
        self, user_profile_id: UUID
    ) -> AdaptivePathResponse:
        """
        Get the adaptive recommendation for the user's next learning step.
        """
        profile = (
            self.db.table("user_profiles")
            .select("*")
            .eq("id", str(user_profile_id))
            .single()
            .execute()
        )

        if not profile.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User profile not found",
            )

        user = profile.data

        # Check reinforcement queue
        reinforcement = (
            self.db.table("reinforcement_queue")
            .select("*, lessons(id, title)")
            .eq("user_id", str(user_profile_id))
            .eq("is_completed", False)
            .order("priority", desc=True)
            .execute()
        )

        has_reinforcement = bool(reinforcement.data and len(reinforcement.data) > 0)
        recommended_lesson_id = None
        recommended_lesson_title = None
        reasoning = ""

        if has_reinforcement:
            # Prioritize reinforcement
            item = reinforcement.data[0]
            recommended_lesson_id = UUID(item["lesson_id"])
            if item.get("lessons"):
                recommended_lesson_title = item["lessons"].get("title")
            reasoning = (
                f"Reinforcement recommended: {item.get('reason', 'review needed')}. "
                f"{len(reinforcement.data)} item(s) in queue."
            )
        else:
            # Find next lesson by difficulty
            next_lesson = await self._find_lesson_by_difficulty(
                user.get("assigned_track_id"),
                user["current_difficulty_level"],
                user_profile_id,
            )
            if next_lesson:
                recommended_lesson_id = UUID(next_lesson["id"])
                recommended_lesson_title = next_lesson["title"]
                reasoning = (
                    f"Progressing at difficulty level {user['current_difficulty_level']}."
                )
            else:
                reasoning = "All available lessons completed at current difficulty."

        return AdaptivePathResponse(
            recommended_lesson_id=recommended_lesson_id,
            recommended_lesson_title=recommended_lesson_title,
            current_difficulty=user["current_difficulty_level"],
            recommended_difficulty=user["current_difficulty_level"],
            scores=AdaptiveScores(
                risk_score=user["risk_score"],
                discipline_score=user["discipline_score"],
                knowledge_score=user["knowledge_score"],
                stability_score=user["stability_score"],
            ),
            reasoning=reasoning,
            has_reinforcement_pending=has_reinforcement,
            reinforcement_count=len(reinforcement.data) if reinforcement.data else 0,
        )

    # ------------------------------------------------------------------
    # Private evaluation handlers
    # ------------------------------------------------------------------

    async def _handle_advance(
        self,
        user: dict,
        lesson_id: UUID,
        quiz_score: float,
        quiz_attempt_id: UUID | None,
    ) -> dict:
        """Handle strong performance: advance difficulty, boost scores."""
        new_difficulty = min(
            user["current_difficulty_level"] + DIFFICULTY_STEP_UP,
            MAX_DIFFICULTY,
        )

        # Adjust scores upward
        new_scores = {
            "risk_score": self._clamp(user["risk_score"] + SCORE_INCREMENT),
            "discipline_score": self._clamp(user["discipline_score"] + SCORE_INCREMENT),
            "knowledge_score": self._clamp(user["knowledge_score"] + SCORE_INCREMENT * 1.5),
            "stability_score": self._clamp(user["stability_score"] + SCORE_INCREMENT),
        }

        # Update profile
        self.db.table("user_profiles").update(
            {
                "current_difficulty_level": new_difficulty,
                **new_scores,
            }
        ).eq("id", user["id"]).execute()

        # Find next advanced lesson
        next_lesson = await self._find_lesson_by_difficulty(
            user.get("assigned_track_id"),
            new_difficulty,
            UUID(user["id"]),
        )

        return {
            "difficulty_change": DIFFICULTY_STEP_UP,
            "remedial_assigned": False,
            "flashcards_queued": False,
            "next_lesson_id": UUID(next_lesson["id"]) if next_lesson else None,
            "scores_updated": new_scores,
        }

    async def _handle_remedial(
        self,
        user: dict,
        lesson_id: UUID,
        quiz_score: float,
        quiz_attempt_id: UUID | None,
    ) -> dict:
        """Handle weak performance: assign remedial, queue flashcards."""
        new_difficulty = max(
            user["current_difficulty_level"] - DIFFICULTY_STEP_DOWN,
            MIN_DIFFICULTY,
        )

        # Adjust scores downward
        new_scores = {
            "risk_score": self._clamp(user["risk_score"] - SCORE_DECREMENT),
            "discipline_score": self._clamp(user["discipline_score"] - SCORE_DECREMENT),
            "knowledge_score": self._clamp(user["knowledge_score"] - SCORE_DECREMENT * 1.5),
            "stability_score": self._clamp(user["stability_score"] - SCORE_DECREMENT),
        }

        # Update profile – do NOT increase difficulty
        self.db.table("user_profiles").update(
            {
                "current_difficulty_level": new_difficulty,
                **new_scores,
            }
        ).eq("id", user["id"]).execute()

        now = datetime.now(timezone.utc).isoformat()

        # Queue remedial lesson
        remedial_lesson = await self._find_remedial_lesson(
            user.get("assigned_track_id"), lesson_id
        )

        remedial_lesson_id = str(remedial_lesson["id"]) if remedial_lesson else str(lesson_id)

        self.db.table("reinforcement_queue").insert(
            {
                "user_id": user["id"],
                "lesson_id": remedial_lesson_id,
                "queue_type": "lesson",
                "priority": REMEDIAL_PRIORITY,
                "reason": "low_quiz_score",
                "source_quiz_attempt_id": str(quiz_attempt_id) if quiz_attempt_id else None,
                "scheduled_at": now,
            }
        ).execute()

        # Queue flashcards for the failed lesson
        self.db.table("reinforcement_queue").insert(
            {
                "user_id": user["id"],
                "lesson_id": str(lesson_id),
                "queue_type": "flashcard",
                "priority": FLASHCARD_PRIORITY,
                "reason": "low_quiz_score",
                "source_quiz_attempt_id": str(quiz_attempt_id) if quiz_attempt_id else None,
                "scheduled_at": now,
            }
        ).execute()

        return {
            "difficulty_change": -DIFFICULTY_STEP_DOWN if new_difficulty != user["current_difficulty_level"] else 0,
            "remedial_assigned": True,
            "flashcards_queued": True,
            "next_lesson_id": UUID(remedial_lesson_id),
            "scores_updated": new_scores,
        }

    async def _handle_maintain(
        self,
        user: dict,
        lesson_id: UUID,
        quiz_score: float,
    ) -> dict:
        """Handle middle-ground performance: maintain difficulty, slight adjustment."""
        # Slight score increase for effort
        new_scores = {
            "knowledge_score": self._clamp(
                user["knowledge_score"] + SCORE_INCREMENT * 0.5
            ),
        }

        self.db.table("user_profiles").update(new_scores).eq(
            "id", user["id"]
        ).execute()

        next_lesson = await self._find_lesson_by_difficulty(
            user.get("assigned_track_id"),
            user["current_difficulty_level"],
            UUID(user["id"]),
        )

        return {
            "difficulty_change": 0,
            "remedial_assigned": False,
            "flashcards_queued": False,
            "next_lesson_id": UUID(next_lesson["id"]) if next_lesson else None,
            "scores_updated": new_scores,
        }

    # ------------------------------------------------------------------
    # Helper methods
    # ------------------------------------------------------------------

    async def _find_lesson_by_difficulty(
        self,
        track_id: str | None,
        difficulty: int,
        user_profile_id: UUID,
    ) -> dict | None:
        """Find the next uncompleted lesson at a given difficulty."""
        if not track_id:
            return None

        # Get completed lessons
        completed = (
            self.db.table("user_progress")
            .select("lesson_id")
            .eq("user_id", str(user_profile_id))
            .eq("is_completed", True)
            .execute()
        )
        completed_ids = {r["lesson_id"] for r in (completed.data or [])}

        # Find lessons at difficulty
        lessons = (
            self.db.table("lessons")
            .select("*")
            .eq("track_id", track_id)
            .eq("is_active", True)
            .lte("difficulty_level", difficulty)
            .order("order_index")
            .execute()
        )

        for l in (lessons.data or []):
            if l["id"] not in completed_ids:
                return l

        return None

    async def _find_remedial_lesson(
        self, track_id: str | None, original_lesson_id: UUID
    ) -> dict | None:
        """Find a remedial lesson related to the failed lesson."""
        if not track_id:
            return None

        # Look for a remedial lesson in the same track
        result = (
            self.db.table("lessons")
            .select("*")
            .eq("track_id", track_id)
            .eq("is_remedial", True)
            .eq("is_active", True)
            .order("order_index")
            .limit(1)
            .execute()
        )

        if result.data and len(result.data) > 0:
            return result.data[0]

        return None

    def _clamp(self, value: float) -> float:
        """Clamp a score between SCORE_MIN and SCORE_MAX."""
        return max(SCORE_MIN, min(SCORE_MAX, value))
