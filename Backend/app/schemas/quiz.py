"""
Request/response schemas for quiz endpoints.
"""

from pydantic import BaseModel, Field
from uuid import UUID
from typing import Any, Optional


class QuizAnswer(BaseModel):
    """A single quiz question answer."""
    question_index: int
    selected_option: int


class QuizEvaluateRequest(BaseModel):
    """Request schema for evaluating a quiz attempt."""
    lesson_id: UUID
    answers: list[QuizAnswer]


class QuizEvaluateResponse(BaseModel):
    """Response schema after evaluating a quiz."""
    attempt_id: UUID
    lesson_id: UUID
    score: float
    total_questions: int
    correct_answers: int
    passed: bool
    xp_earned: int
    feedback: str  # e.g. 'Great job! Moving to next lesson.', 'Let's review this topic again.'

    # Adaptive result
    difficulty_change: int = 0  # +1, 0, or -1
    remedial_assigned: bool = False
    flashcards_queued: bool = False
    next_lesson_id: Optional[UUID] = None
