"""
Pydantic models for Lesson and LessonBlock database entities.
"""

from pydantic import BaseModel
from datetime import datetime
from uuid import UUID
from typing import Any, Optional


class LessonBlock(BaseModel):
    """Represents a row in the lesson_blocks table."""
    id: UUID
    lesson_id: UUID
    block_type: str  # 'video', 'audio', 'text', 'quiz', 'flashcard', 'live_data'
    order_index: int = 0
    content: dict[str, Any] = {}
    is_active: bool = True
    created_at: datetime

    class Config:
        from_attributes = True


class Lesson(BaseModel):
    """Represents a row in the lessons table."""
    id: UUID
    track_id: UUID
    title: str
    description: Optional[str] = None
    difficulty_level: int = 1
    energy_cost: int = 10
    xp_reward: int = 25
    order_index: int = 0
    has_video: bool = False
    video_url: Optional[str] = None
    estimated_duration_seconds: Optional[int] = 60
    is_remedial: bool = False
    is_active: bool = True
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class LessonWithBlocks(Lesson):
    """Lesson model enriched with its content blocks."""
    blocks: list[LessonBlock] = []
