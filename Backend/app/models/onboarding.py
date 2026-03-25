"""
Pydantic model for OnboardingResponse database entity.
"""

from pydantic import BaseModel
from datetime import datetime
from uuid import UUID
from typing import Any, Optional


class OnboardingResponse(BaseModel):
    """Represents a row in the onboarding_responses table."""
    id: UUID
    user_id: UUID
    responses: dict[str, Any] = {}
    assigned_track_id: Optional[UUID] = None
    computed_scores: Optional[dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True
