"""
Request/response schemas for track endpoints.
"""

from pydantic import BaseModel
from uuid import UUID
from typing import Optional


class TrackResponse(BaseModel):
    """Response schema for a learning track."""
    id: UUID
    title: str
    description: Optional[str] = None
    category: str
    difficulty: int
    order_index: int
    icon_url: Optional[str] = None
    lesson_count: int = 0


class TrackListResponse(BaseModel):
    """Response schema for listing tracks."""
    tracks: list[TrackResponse]
    total: int
