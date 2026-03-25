"""
Pydantic models for QuizAttempt database entity.
"""

from pydantic import BaseModel
from datetime import datetime
from uuid import UUID
from typing import Any


class QuizAttempt(BaseModel):
    """Represents a row in the quiz_attempts table."""
    id: UUID
    user_id: UUID
    lesson_id: UUID
    answers: list[dict[str, Any]] = []
    score: float = 0.0
    total_questions: int = 0
    passed: bool = False
    created_at: datetime

    class Config:
        from_attributes = True
