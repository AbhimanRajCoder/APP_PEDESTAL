"""
Request/response schemas for progress endpoints.
"""

from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional


class ProgressItem(BaseModel):
    """Single lesson progress item."""
    lesson_id: str
    lesson_title: str
    is_completed: bool
    quiz_score: Optional[float] = None
    best_score: Optional[float] = None
    attempts: int
    xp_earned: int
    completed_at: Optional[datetime] = None


class ProgressResponse(BaseModel):
    """Response schema for user progress overview."""
    total_lessons: int
    completed_lessons: int
    completion_percentage: float
    total_xp: int
    current_level: int
    current_streak: int
    progress: list[ProgressItem]


class ProgressUpdate(BaseModel):
    """Request schema for updating lesson progress."""
    lesson_id: str
    is_completed: bool = True
    quiz_score: Optional[float] = None
    xp_earned: int = 0
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
