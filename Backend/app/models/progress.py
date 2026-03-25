"""
Pydantic models for UserProgress database entity.
"""

from pydantic import BaseModel
from datetime import datetime
from uuid import UUID
from typing import Optional


class UserProgress(BaseModel):
    """Represents a row in the user_progress table."""
    id: UUID
    user_id: UUID
    lesson_id: UUID
    is_completed: bool = False
    quiz_score: Optional[float] = None
    attempts: int = 0
    best_score: Optional[float] = None
    xp_earned: int = 0
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
