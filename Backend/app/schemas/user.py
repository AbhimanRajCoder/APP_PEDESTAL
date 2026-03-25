"""
Request/response schemas for user-related endpoints.
"""

from pydantic import BaseModel
from uuid import UUID
from typing import Optional


class UserProfileResponse(BaseModel):
    """Response schema for user profile data."""
    id: UUID
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    email: Optional[str] = None
    xp_total: int = 0
    level: int = 1
    streak_days: int = 0
    risk_score: float = 50.0
    discipline_score: float = 50.0
    knowledge_score: float = 50.0
    stability_score: float = 50.0
    onboarding_completed: bool = False
    current_difficulty_level: int = 1


class UserProfileUpdate(BaseModel):
    """Request schema for updating user profile."""
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
