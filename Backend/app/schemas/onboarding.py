"""
Request/response schemas for onboarding endpoints.
"""

from pydantic import BaseModel
from uuid import UUID
from typing import Any, Optional


class OnboardingAnswer(BaseModel):
    """A single onboarding question answer."""
    question_id: str
    answer: Any  # flexible – could be string, int, list


class OnboardingSubmitRequest(BaseModel):
    """Request schema for submitting onboarding quiz."""
    answers: list[OnboardingAnswer]


class OnboardingSubmitResponse(BaseModel):
    """Response schema after processing onboarding."""
    assigned_track_id: UUID
    assigned_track_title: str
    computed_scores: dict[str, float]
    starting_difficulty: int
    message: str
