"""
Adaptive learning routes – path recommendation endpoints.
"""

from fastapi import APIRouter, Depends

from app.core.auth import get_current_user
from app.schemas.adaptive import AdaptivePathResponse
from app.services.adaptive_service import AdaptiveService
from app.utils import get_user_profile_id

router = APIRouter(prefix="/adaptive", tags=["Adaptive Learning"])


@router.get("/next-path", response_model=AdaptivePathResponse)
async def get_next_path(auth_uid: str = Depends(get_current_user)):
    """
    Get the adaptive next-path recommendation.

    Returns the recommended next lesson based on:
    - Reinforcement queue (highest priority)
    - Current difficulty level
    - Adaptive scores (risk, discipline, knowledge, stability)
    """
    profile_id = await get_user_profile_id(auth_uid)
    service = AdaptiveService()
    return await service.get_next_path(profile_id)
