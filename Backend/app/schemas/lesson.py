"""
Request/response schemas for lesson endpoints.
"""

from pydantic import BaseModel
from uuid import UUID
from typing import Any, Optional


class LessonBlockResponse(BaseModel):
    """Response schema for a single content block."""
    id: UUID
    block_type: str
    order_index: int
    content: dict[str, Any]


class LessonResponse(BaseModel):
    """Response schema for a lesson with its content blocks."""
    id: UUID
    track_id: UUID
    title: str
    description: Optional[str] = None
    difficulty_level: int
    energy_cost: int
    xp_reward: int
    order_index: int
    has_video: bool
    video_url: Optional[str] = None
    estimated_duration_seconds: Optional[int] = None
    is_remedial: bool
    blocks: list[LessonBlockResponse] = []


class LessonCompleteRequest(BaseModel):
    """Request schema for completing a lesson."""
    quiz_score: Optional[float] = None


class LessonCompleteResponse(BaseModel):
    """Response schema after completing a lesson."""
    lesson_id: UUID
    xp_earned: int
    new_xp_total: int
    level_up: bool = False
    new_level: int
    next_lesson_id: Optional[UUID] = None
    difficulty_adjusted: bool = False
    reinforcement_queued: bool = False
    message: str


class NextLessonResponse(BaseModel):
    """Response schema for the next recommended lesson."""
    lesson: Optional[LessonResponse] = None
    reason: str  # e.g. 'next_in_track', 'remedial', 'reinforcement'
    has_reinforcement_pending: bool = False
