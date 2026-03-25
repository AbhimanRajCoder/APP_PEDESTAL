"""
Lesson routes – content delivery and completion endpoints.
"""

from fastapi import APIRouter, Depends
from uuid import UUID

from app.core.auth import get_current_user
from app.schemas.lesson import (
    LessonResponse,
    LessonCompleteRequest,
    LessonCompleteResponse,
    NextLessonResponse,
)
from app.services.lesson_service import LessonService
from app.utils import get_user_profile_id

router = APIRouter(prefix="/lessons", tags=["Lessons"])


@router.get("/next", response_model=NextLessonResponse)
async def get_next_lesson(auth_uid: str = Depends(get_current_user)):
    """Get the next recommended lesson for the current user."""
    profile_id = await get_user_profile_id(auth_uid)
    service = LessonService()
    return await service.get_next_lesson(profile_id)


@router.get("/{lesson_id}", response_model=LessonResponse)
async def get_lesson(lesson_id: UUID, _: str = Depends(get_current_user)):
    """
    Get a lesson with all its content blocks.
    If the lesson has video, video_url will be included.
    Otherwise, only content blocks are returned.
    """
    service = LessonService()
    return await service.get_lesson(lesson_id)


@router.post("/{lesson_id}/complete", response_model=LessonCompleteResponse)
async def complete_lesson(
    lesson_id: UUID,
    request: LessonCompleteRequest,
    auth_uid: str = Depends(get_current_user),
):
    """
    Mark a lesson as completed (idempotent).
    Awards XP on first completion only.
    """
    profile_id = await get_user_profile_id(auth_uid)
    service = LessonService()
    return await service.complete_lesson(lesson_id, profile_id, request)
