"""
Pydantic models for ReinforcementQueue database entity.
"""

from pydantic import BaseModel
from datetime import datetime
from uuid import UUID
from typing import Optional


class ReinforcementQueueItem(BaseModel):
    """Represents a row in the reinforcement_queue table."""
    id: UUID
    user_id: UUID
    lesson_id: UUID
    queue_type: str = "lesson"  # 'lesson' or 'flashcard'
    priority: int = 0
    reason: Optional[str] = None
    is_completed: bool = False
    source_quiz_attempt_id: Optional[UUID] = None
    scheduled_at: datetime
    completed_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True
