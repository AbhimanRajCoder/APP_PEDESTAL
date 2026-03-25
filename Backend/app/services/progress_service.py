"""
Progress service – user progress tracking and reporting.
"""

from uuid import UUID

from app.core.database import get_supabase_admin
from app.schemas.progress import ProgressItem, ProgressResponse, ProgressUpdate
from datetime import datetime
from app.data.lessons import get_uuid, get_title, get_slug, LESSON_MAP


class ProgressService:
    """Handles user progress queries and reporting."""

    def __init__(self):
        self.db = get_supabase_admin()

    def _first(self, result) -> dict | None:
        """Safely return the first row from a postgrest result, or None."""
        if result and result.data:
            return result.data[0]
        return None

    async def update_user_progress(self, user_profile_id: UUID, update: ProgressUpdate) -> dict:
        """
        Upsert a progress record for a user and lesson.
        Also updates the user profile's total XP if new XP is earned.
        """
        lesson_uuid = get_uuid(update.lesson_id)
        
        # 1. Fetch existing record to check best score and if already completed
        existing_result = (
            self.db.table("user_progress")
            .select("*")
            .eq("user_id", str(user_profile_id))
            .eq("lesson_id", lesson_uuid)
            .limit(1)
            .execute()
        )
        existing_data = self._first(existing_result)

        attempts = 1
        best_score = update.quiz_score

        if existing_data:
            attempts = existing_data.get("attempts", 0) + 1
            old_best = existing_data.get("best_score")
            if old_best is not None and update.quiz_score is not None:
                best_score = max(old_best, update.quiz_score)
            elif old_best is not None:
                best_score = old_best

        # 2. Upsert progress record
        progress_data = {
            "user_id": str(user_profile_id),
            "lesson_id": lesson_uuid,
            "is_completed": update.is_completed,
            "quiz_score": update.quiz_score,
            "attempts": attempts,
            "best_score": best_score,
            "xp_earned": update.xp_earned,
            "updated_at": datetime.now().isoformat()
        }

        if update.started_at:
            progress_data["started_at"] = update.started_at.isoformat()
        if update.completed_at:
            progress_data["completed_at"] = update.completed_at.isoformat()
        elif update.is_completed:
            progress_data["completed_at"] = datetime.now().isoformat()

        result = (
            self.db.table("user_progress")
            .upsert(progress_data, on_conflict="user_id,lesson_id")
            .execute()
        )

        # 3. Update User Profile XP and Streak
        old_xp = (existing_data.get("xp_earned", 0) if existing_data else 0)
        new_xp_to_add = max(0, update.xp_earned - old_xp)

        # Get current profile row for XP and streak
        profile_result = (
            self.db.table("user_profiles")
            .select("id, xp_total, streak_days, updated_at")
            .eq("id", str(user_profile_id))
            .limit(1)
            .execute()
        )
        profile_row = self._first(profile_result)

        if profile_row:
            update_data = {}
            
            # Update XP
            if new_xp_to_add > 0:
                update_data["xp_total"] = profile_row["xp_total"] + new_xp_to_add
                
            # Update Streak if it's a new day
            last_update = profile_row.get("updated_at")
            current_streak = profile_row.get("streak_days", 0)
            
            # Simple streak logic: if updated_at is more than 24h ago but less than 48h, increment.
            # If it's more than 48h ago, reset to 1. 
            # If it's today (same date), stay same.
            if last_update:
                last_update_dt = datetime.fromisoformat(last_update.replace('Z', '+00:00'))
                now_dt = datetime.now().astimezone()
                
                diff_days = (now_dt.date() - last_update_dt.date()).days
                
                if diff_days == 1:
                    update_data["streak_days"] = current_streak + 1
                elif diff_days > 1:
                    update_data["streak_days"] = 1
                elif current_streak == 0:
                    update_data["streak_days"] = 1
            else:
                update_data["streak_days"] = 1
                
            if update_data:
                self.db.table("user_profiles").update(update_data).eq("id", str(user_profile_id)).execute()

        return result.data[0] if result.data else {}

    async def get_user_progress(self, user_profile_id: UUID) -> ProgressResponse:
        """
        Get comprehensive progress overview for a user:
        - All lesson progress records with lesson titles
        - Completion statistics
        - Current XP and level
        """
        # Get user profile for XP and level
        profile_result = (
            self.db.table("user_profiles")
            .select("xp_total, level, streak_days, assigned_track_id")
            .eq("id", str(user_profile_id))
            .limit(1)
            .execute()
        )
        profile_row = self._first(profile_result)

        profile_data = profile_row or {
            "xp_total": 0,
            "level": 1,
            "streak_days": 0,
            "assigned_track_id": None,
        }

        # We now use the hardcoded LESSON_MAP for total lessons count, since the old DB lessons table is obsolete/mismatched.
        total_lessons = len(LESSON_MAP) if LESSON_MAP else 0

        # Get progress records for this user
        progress_result = (
            self.db.table("user_progress")
            .select("*")
            .eq("user_id", str(user_profile_id))
            .order("created_at", desc=True)
            .execute()
        )

        progress_items = []
        completed_count = 0

        for record in (progress_result.data or []):
            is_completed = record.get("is_completed", False)
            if is_completed:
                completed_count += 1
            
            db_uuid = record["lesson_id"]
            slug = get_slug(db_uuid)
            title = get_title(db_uuid)

            progress_items.append(
                ProgressItem(
                    lesson_id=slug,
                    lesson_title=title,
                    is_completed=is_completed,
                    quiz_score=record.get("quiz_score"),
                    best_score=record.get("best_score"),
                    attempts=record.get("attempts", 0),
                    xp_earned=record.get("xp_earned", 0),
                    completed_at=record.get("completed_at"),
                )
            )

        completion_pct = (
            (completed_count / total_lessons * 100) if total_lessons > 0 else 0
        )

        return ProgressResponse(
            total_lessons=total_lessons,
            completed_lessons=completed_count,
            completion_percentage=round(completion_pct, 1),
            total_xp=profile_data["xp_total"],
            current_level=profile_data["level"],
            current_streak=profile_data["streak_days"],
            progress=progress_items,
        )
