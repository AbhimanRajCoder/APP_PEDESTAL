"""
Request/response schemas for adaptive learning endpoints.
"""

from pydantic import BaseModel
from uuid import UUID
from typing import Optional


class AdaptiveScores(BaseModel):
    """User's adaptive learning scores."""
    risk_score: float
    discipline_score: float
    knowledge_score: float
    stability_score: float


class AdaptivePathResponse(BaseModel):
    """Response schema for the adaptive next-path recommendation."""
    recommended_lesson_id: Optional[UUID] = None
    recommended_lesson_title: Optional[str] = None
    current_difficulty: int
    recommended_difficulty: int
    scores: AdaptiveScores
    reasoning: str  # human-readable explanation
    has_reinforcement_pending: bool = False
    reinforcement_count: int = 0
