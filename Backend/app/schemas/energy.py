"""
Request/response schemas for energy system endpoints.
"""

from pydantic import BaseModel
from uuid import UUID
from datetime import datetime


class EnergyStatusResponse(BaseModel):
    """Response schema for current energy status."""
    current_energy: int
    max_energy: int
    regen_rate: int
    regen_interval_seconds: int
    next_regen_at: datetime
    time_until_full_seconds: int


class EnergyConsumeRequest(BaseModel):
    """Request schema for consuming energy."""
    lesson_id: UUID
    amount: int


class EnergyConsumeResponse(BaseModel):
    """Response schema after consuming energy."""
    success: bool
    energy_before: int
    energy_after: int
    amount_consumed: int
    message: str
