"""
Pydantic models for Track database entity.
"""

from pydantic import BaseModel
from datetime import datetime
from uuid import UUID
from typing import Optional


class Track(BaseModel):
    """Represents a row in the tracks table."""
    id: UUID
    title: str
    description: Optional[str] = None
    category: str
    difficulty: int = 1
    order_index: int = 0
    is_active: bool = True
    icon_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
