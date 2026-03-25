"""
Quiz service – quiz evaluation and scoring.
"""

from uuid import UUID
from datetime import datetime, timezone
from fastapi import HTTPException, status

from app.core.database import get_supabase
from app.core.constants import QUIZ_ADVANCE_THRESHOLD, BASE_XP_REWARD
from app.schemas.quiz import (
    QuizEvaluateRequest,
    QuizEvaluateResponse,
    QuizAnswer,
)
from app.services.adaptive_service import AdaptiveService


class QuizService:
    """Evaluates quiz attempts and triggers adaptive learning."""

    def __init__(self):
        self.db = get_supabase()
        self.adaptive_service = AdaptiveService()

    async def evaluate_quiz(
        self, user_profile_id: UUID, request: QuizEvaluateRequest
    ) -> QuizEvaluateResponse:
        """
        Evaluate a quiz attempt:
        1. Fetch the quiz content from the lesson's blocks
        2. Score the answers
        3. Record the attempt
        4. Trigger adaptive evaluation
        5. Return comprehensive feedback
        """
        lesson_id = request.lesson_id

        # Fetch quiz block from lesson
        quiz_block = (
            self.db.table("lesson_blocks")
            .select("content")
            .eq("lesson_id", str(lesson_id))
            .eq("block_type", "quiz")
            .eq("is_active", True)
            .order("order_index")
            .limit(1)
            .execute()
        )

        if not quiz_block.data or len(quiz_block.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No quiz found for this lesson",
            )

        quiz_content = quiz_block.data[0]["content"]
        questions = quiz_content.get("questions", [])
        total_questions = len(questions)

        if total_questions == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Quiz has no questions",
            )

        # Score answers
        correct_answers = 0
        answer_details = []

        for answer in request.answers:
            if answer.question_index < total_questions:
                question = questions[answer.question_index]
                is_correct = answer.selected_option == question.get("correct", -1)
                if is_correct:
                    correct_answers += 1
                answer_details.append(
                    {
                        "question_index": answer.question_index,
                        "selected": answer.selected_option,
                        "correct": is_correct,
                    }
                )

        score = (correct_answers / total_questions) * 100 if total_questions > 0 else 0
        passed = score >= QUIZ_ADVANCE_THRESHOLD

        # Record attempt
        now = datetime.now(timezone.utc).isoformat()
        attempt_result = (
            self.db.table("quiz_attempts")
            .insert(
                {
                    "user_id": str(user_profile_id),
                    "lesson_id": str(lesson_id),
                    "answers": answer_details,
                    "score": score,
                    "total_questions": total_questions,
                    "passed": passed,
                    "created_at": now,
                }
            )
            .execute()
        )

        attempt_id = UUID(attempt_result.data[0]["id"])

        # Trigger adaptive evaluation
        adaptive_result = await self.adaptive_service.evaluate_performance(
            user_profile_id=user_profile_id,
            lesson_id=lesson_id,
            quiz_score=score,
            quiz_attempt_id=attempt_id,
        )

        # Calculate XP
        xp_earned = BASE_XP_REWARD if passed else int(BASE_XP_REWARD * 0.25)

        # Generate feedback message
        if score >= 80:
            feedback = "🔥 Excellent! You've mastered this topic. Moving forward!"
        elif score >= 50:
            feedback = "👍 Good effort! Keep practicing to strengthen your knowledge."
        else:
            feedback = "📚 Let's review this topic. We've queued some review material for you."

        return QuizEvaluateResponse(
            attempt_id=attempt_id,
            lesson_id=lesson_id,
            score=score,
            total_questions=total_questions,
            correct_answers=correct_answers,
            passed=passed,
            xp_earned=xp_earned,
            feedback=feedback,
            difficulty_change=adaptive_result["difficulty_change"],
            remedial_assigned=adaptive_result["remedial_assigned"],
            flashcards_queued=adaptive_result["flashcards_queued"],
            next_lesson_id=adaptive_result.get("next_lesson_id"),
        )
