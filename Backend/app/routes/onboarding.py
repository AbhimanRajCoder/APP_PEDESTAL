"""
Onboarding routes – initial user onboarding endpoints.
"""

from fastapi import APIRouter, Depends

from app.core.auth import get_current_user
from app.schemas.onboarding import OnboardingSubmitRequest, OnboardingSubmitResponse
from app.services.onboarding_service import OnboardingService
from app.utils import get_user_profile_id

router = APIRouter(prefix="/onboarding", tags=["Onboarding"])


@router.post("/submit", response_model=OnboardingSubmitResponse)
async def submit_onboarding(
    request: OnboardingSubmitRequest,
    auth_uid: str = Depends(get_current_user),
):
    """
    Submit onboarding quiz answers.

    Processes responses to:
    1. Compute initial adaptive scores
    2. Assign the best-fit learning track
    3. Set starting difficulty level

    Can only be submitted once per user.
    """
    profile_id = await get_user_profile_id(auth_uid)
    service = OnboardingService()
    return await service.process_onboarding(profile_id, auth_uid, request)
