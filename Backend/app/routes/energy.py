"""
Energy routes – Lightning Bolts energy system endpoints.
"""

from fastapi import APIRouter, Depends

from app.core.auth import get_current_user
from app.schemas.energy import (
    EnergyStatusResponse,
    EnergyConsumeRequest,
    EnergyConsumeResponse,
)
from app.services.energy_service import EnergyService
from app.utils import get_user_profile_id

router = APIRouter(prefix="/energy", tags=["Energy System"])


@router.get("", response_model=EnergyStatusResponse)
async def get_energy_status(auth_uid: str = Depends(get_current_user)):
    """
    Get the current energy status.

    Energy regenerates automatically over time.
    The response includes real-time regenerated energy.
    """
    profile_id = await get_user_profile_id(auth_uid)
    service = EnergyService()
    return await service.get_energy_status(profile_id)


@router.post("/consume", response_model=EnergyConsumeResponse)
async def consume_energy(
    request: EnergyConsumeRequest,
    auth_uid: str = Depends(get_current_user),
):
    """
    Consume energy to start a lesson.

    Applies regeneration first, then deducts the requested amount.
    Returns failure (not error) if insufficient energy.
    """
    profile_id = await get_user_profile_id(auth_uid)
    service = EnergyService()
    return await service.consume_energy(profile_id, request)
