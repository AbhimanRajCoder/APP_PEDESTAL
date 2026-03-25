"""
Quiz routes – quiz evaluation endpoints.
"""

from fastapi import APIRouter, Depends

from app.core.auth import get_current_user
from app.schemas.quiz import QuizEvaluateRequest, QuizEvaluateResponse
from app.services.quiz_service import QuizService
from app.utils import get_user_profile_id

router = APIRouter(prefix="/quiz", tags=["Quiz"])


@router.post("/evaluate", response_model=QuizEvaluateResponse)
async def evaluate_quiz(
    request: QuizEvaluateRequest,
    auth_uid: str = Depends(get_current_user),
):
    """
    Evaluate a quiz attempt.

    Scores the answers against the lesson's quiz content,
    records the attempt, and triggers adaptive learning adjustments.
    """
    profile_id = await get_user_profile_id(auth_uid)
    service = QuizService()
    return await service.evaluate_quiz(profile_id, request)
