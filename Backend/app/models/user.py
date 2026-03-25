"""
Pydantic models for User-related database entities.
"""

from pydantic import BaseModel, Field
from datetime import datetime
from uuid import UUID
from typing import Optional


class UserProfile(BaseModel):
    """Represents a row in the user_profiles table."""
    id: UUID
    auth_uid: UUID
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    email: Optional[str] = None

    # Gamification
    xp_total: int = 0
    level: int = 1
    streak_days: int = 0

    # Adaptive scores
    risk_score: float = 50.0
    discipline_score: float = 50.0
    knowledge_score: float = 50.0
    stability_score: float = 50.0

    # Onboarding
    onboarding_completed: bool = False
    assigned_track_id: Optional[UUID] = None
    current_difficulty_level: int = 1

    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserEnergy(BaseModel):
    """Represents a row in the user_energy table."""
    id: UUID
    user_id: UUID
    current_energy: int = 100
    max_energy: int = 100
    regen_rate: int = 5
    regen_interval_seconds: int = 1800
    last_updated: datetime
    created_at: datetime

    class Config:
        from_attributes = True
