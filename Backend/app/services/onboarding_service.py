"""
Onboarding service – processes onboarding quiz and assigns initial learning path.
"""

from uuid import UUID
from datetime import datetime, timezone
from fastapi import HTTPException, status

from app.core.database import get_supabase
from app.core.constants import ONBOARDING_WEIGHTS
from app.schemas.onboarding import (
    OnboardingSubmitRequest,
    OnboardingSubmitResponse,
)


class OnboardingService:
    """Processes onboarding quiz responses and assigns initial track + scores."""

    def __init__(self):
        self.db = get_supabase()

    async def process_onboarding(
        self, user_profile_id: UUID, auth_uid: str, request: OnboardingSubmitRequest
    ) -> OnboardingSubmitResponse:
        """
        Process the onboarding quiz:
        1. Compute adaptive scores from answers
        2. Determine best-fit track
        3. Assign track and initial difficulty
        4. Create/update user profile
        5. Store onboarding responses
        """
        # Check if already onboarded
        profile = (
            self.db.table("user_profiles")
            .select("id, onboarding_completed")
            .eq("id", str(user_profile_id))
            .execute()
        )

        if profile.data and len(profile.data) > 0:
            if profile.data[0].get("onboarding_completed"):
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Onboarding already completed",
                )

        # Convert answers to a dict for scoring
        answer_dict = {a.question_id: a.answer for a in request.answers}

        # Compute adaptive scores from onboarding answers
        computed_scores = self._compute_initial_scores(answer_dict)

        # Determine best-fit track
        track = await self._determine_track(computed_scores)

        if not track:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="No tracks available for assignment",
            )

        # Determine starting difficulty based on knowledge score
        starting_difficulty = self._determine_starting_difficulty(computed_scores)

        now = datetime.now(timezone.utc).isoformat()

        # Update or create user profile
        if profile.data and len(profile.data) > 0:
            self.db.table("user_profiles").update(
                {
                    "onboarding_completed": True,
                    "assigned_track_id": track["id"],
                    "current_difficulty_level": starting_difficulty,
                    "risk_score": computed_scores["risk_score"],
                    "discipline_score": computed_scores["discipline_score"],
                    "knowledge_score": computed_scores["knowledge_score"],
                    "stability_score": computed_scores["stability_score"],
                    "updated_at": now,
                }
            ).eq("id", str(user_profile_id)).execute()
        else:
            self.db.table("user_profiles").insert(
                {
                    "auth_uid": auth_uid,
                    "onboarding_completed": True,
                    "assigned_track_id": track["id"],
                    "current_difficulty_level": starting_difficulty,
                    "risk_score": computed_scores["risk_score"],
                    "discipline_score": computed_scores["discipline_score"],
                    "knowledge_score": computed_scores["knowledge_score"],
                    "stability_score": computed_scores["stability_score"],
                }
            ).execute()

        # Store onboarding responses
        self.db.table("onboarding_responses").upsert(
            {
                "user_id": str(user_profile_id),
                "responses": answer_dict,
                "assigned_track_id": track["id"],
                "computed_scores": computed_scores,
                "created_at": now,
            },
            on_conflict="user_id",
        ).execute()

        return OnboardingSubmitResponse(
            assigned_track_id=UUID(track["id"]),
            assigned_track_title=track["title"],
            computed_scores=computed_scores,
            starting_difficulty=starting_difficulty,
            message=f"Welcome! You've been assigned to the '{track['title']}' track.",
        )

    def _compute_initial_scores(self, answers: dict) -> dict:
        """
        Compute initial adaptive scores from onboarding answers.

        This is a flexible scoring engine that maps answer patterns
        to risk/discipline/knowledge/stability scores.

        In production, this would use a more sophisticated model.
        For now, we use a heuristic approach based on answer patterns.
        """
        # Default mid-range scores
        scores = {
            "risk_score": 50.0,
            "discipline_score": 50.0,
            "knowledge_score": 50.0,
            "stability_score": 50.0,
        }

        # Score modifiers based on common onboarding question patterns
        # These would be customized based on actual quiz questions

        # Example: financial experience level
        experience = answers.get("experience_level", "beginner")
        if experience == "beginner":
            scores["knowledge_score"] = 30.0
            scores["risk_score"] = 40.0
        elif experience == "intermediate":
            scores["knowledge_score"] = 55.0
            scores["risk_score"] = 55.0
        elif experience == "advanced":
            scores["knowledge_score"] = 75.0
            scores["risk_score"] = 65.0

        # Example: risk tolerance
        risk_tolerance = answers.get("risk_tolerance", "moderate")
        if risk_tolerance == "conservative":
            scores["risk_score"] = max(scores["risk_score"] - 15, 0)
            scores["stability_score"] += 10
        elif risk_tolerance == "aggressive":
            scores["risk_score"] = min(scores["risk_score"] + 15, 100)
            scores["stability_score"] -= 5

        # Example: savings habit
        savings_habit = answers.get("savings_habit", "sometimes")
        if savings_habit == "always":
            scores["discipline_score"] = 75.0
        elif savings_habit == "never":
            scores["discipline_score"] = 25.0

        # Example: financial goal
        goal = answers.get("financial_goal", "general")
        if goal == "investing":
            scores["risk_score"] += 10
            scores["knowledge_score"] += 5
        elif goal == "budgeting":
            scores["discipline_score"] += 10
        elif goal == "saving":
            scores["stability_score"] += 10

        # Clamp all scores
        for key in scores:
            scores[key] = max(0.0, min(100.0, scores[key]))

        return scores

    async def _determine_track(self, scores: dict) -> dict | None:
        """
        Determine the best-fit track based on computed scores.

        Logic:
        - High knowledge + risk → Investing track
        - High discipline → Budgeting track
        - Low knowledge → Personal Finance Basics track
        - Default → most basic track
        """
        result = (
            self.db.table("tracks")
            .select("*")
            .eq("is_active", True)
            .order("order_index")
            .execute()
        )

        if not result.data or len(result.data) == 0:
            return None

        tracks = result.data

        # Try to match by category based on scores
        knowledge = scores.get("knowledge_score", 50)
        risk = scores.get("risk_score", 50)
        discipline = scores.get("discipline_score", 50)

        # Find category matches
        for track in tracks:
            category = track.get("category", "").lower()

            if knowledge >= 60 and risk >= 60 and category in ("investing", "crypto"):
                return track
            if discipline >= 65 and category in ("budgeting", "saving"):
                return track
            if knowledge < 40 and category in ("basics", "personal_finance"):
                return track

        # Default: return the first (most basic) track
        return tracks[0]

    def _determine_starting_difficulty(self, scores: dict) -> int:
        """
        Determine starting difficulty level (1-5) based on composite score.
        """
        composite = sum(
            scores[key] * weight
            for key, weight in ONBOARDING_WEIGHTS.items()
            if key in scores
        )

        if composite >= 70:
            return 3
        elif composite >= 50:
            return 2
        else:
            return 1
