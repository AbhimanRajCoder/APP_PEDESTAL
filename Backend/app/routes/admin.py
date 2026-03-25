"""
Admin routes – CRUD endpoints for content management dashboard.
Protected by X-Admin-Key header (must match SUPABASE_SERVICE_KEY).
"""

from fastapi import APIRouter, Header, HTTPException, Query
from typing import Optional, Any
from uuid import UUID

from app.core.config import get_settings
from app.core.database import get_supabase_admin

router = APIRouter(prefix="/admin", tags=["Admin"])


def _verify_admin(x_admin_key: str = Header(...)):
    """Verify the admin key matches the service role key."""
    settings = get_settings()
    if x_admin_key != settings.supabase_service_key:
        raise HTTPException(status_code=403, detail="Invalid admin key")
    return True


def _db():
    return get_supabase_admin()


# ─── Stats ────────────────────────────────────────────────────────────────────

@router.get("/stats")
async def get_stats(x_admin_key: str = Header(..., alias="X-Admin-Key")):
    _verify_admin(x_admin_key)
    db = _db()
    tracks = db.table("tracks").select("id", count="exact").execute()
    lessons = db.table("lessons").select("id", count="exact").execute()
    users = db.table("user_profiles").select("id", count="exact").execute()
    attempts = db.table("quiz_attempts").select("id", count="exact").execute()
    blocks = db.table("lesson_blocks").select("id", count="exact").execute()
    progress = db.table("user_progress").select("id", count="exact").execute()
    return {
        "tracks": tracks.count or 0,
        "lessons": lessons.count or 0,
        "users": users.count or 0,
        "quiz_attempts": attempts.count or 0,
        "lesson_blocks": blocks.count or 0,
        "progress_records": progress.count or 0,
    }


# ─── Tracks ───────────────────────────────────────────────────────────────────

@router.get("/tracks")
async def list_tracks(x_admin_key: str = Header(..., alias="X-Admin-Key")):
    _verify_admin(x_admin_key)
    result = _db().table("tracks").select("*").order("order_index").execute()
    return result.data or []


@router.post("/tracks")
async def create_track(data: dict[str, Any], x_admin_key: str = Header(..., alias="X-Admin-Key")):
    _verify_admin(x_admin_key)
    result = _db().table("tracks").insert(data).execute()
    return result.data[0] if result.data else {}


@router.put("/tracks/{track_id}")
async def update_track(track_id: str, data: dict[str, Any], x_admin_key: str = Header(..., alias="X-Admin-Key")):
    _verify_admin(x_admin_key)
    result = _db().table("tracks").update(data).eq("id", track_id).execute()
    return result.data[0] if result.data else {}


@router.delete("/tracks/{track_id}")
async def delete_track(track_id: str, x_admin_key: str = Header(..., alias="X-Admin-Key")):
    _verify_admin(x_admin_key)
    _db().table("tracks").delete().eq("id", track_id).execute()
    return {"status": "deleted"}


# ─── Lessons ──────────────────────────────────────────────────────────────────

@router.get("/lessons")
async def list_lessons(
    track_id: Optional[str] = Query(None),
    x_admin_key: str = Header(..., alias="X-Admin-Key"),
):
    _verify_admin(x_admin_key)
    q = _db().table("lessons").select("*").order("order_index")
    if track_id:
        q = q.eq("track_id", track_id)
    result = q.execute()
    return result.data or []


@router.post("/lessons")
async def create_lesson(data: dict[str, Any], x_admin_key: str = Header(..., alias="X-Admin-Key")):
    _verify_admin(x_admin_key)
    result = _db().table("lessons").insert(data).execute()
    return result.data[0] if result.data else {}


@router.put("/lessons/{lesson_id}")
async def update_lesson(lesson_id: str, data: dict[str, Any], x_admin_key: str = Header(..., alias="X-Admin-Key")):
    _verify_admin(x_admin_key)
    result = _db().table("lessons").update(data).eq("id", lesson_id).execute()
    return result.data[0] if result.data else {}


@router.delete("/lessons/{lesson_id}")
async def delete_lesson(lesson_id: str, x_admin_key: str = Header(..., alias="X-Admin-Key")):
    _verify_admin(x_admin_key)
    _db().table("lessons").delete().eq("id", lesson_id).execute()
    return {"status": "deleted"}


# ─── Lesson Blocks ────────────────────────────────────────────────────────────

@router.get("/lessons/{lesson_id}/blocks")
async def list_blocks(lesson_id: str, x_admin_key: str = Header(..., alias="X-Admin-Key")):
    _verify_admin(x_admin_key)
    result = (
        _db().table("lesson_blocks")
        .select("*")
        .eq("lesson_id", lesson_id)
        .order("order_index")
        .execute()
    )
    return result.data or []


@router.post("/blocks")
async def create_block(data: dict[str, Any], x_admin_key: str = Header(..., alias="X-Admin-Key")):
    _verify_admin(x_admin_key)
    result = _db().table("lesson_blocks").insert(data).execute()
    return result.data[0] if result.data else {}


@router.put("/blocks/{block_id}")
async def update_block(block_id: str, data: dict[str, Any], x_admin_key: str = Header(..., alias="X-Admin-Key")):
    _verify_admin(x_admin_key)
    result = _db().table("lesson_blocks").update(data).eq("id", block_id).execute()
    return result.data[0] if result.data else {}


@router.delete("/blocks/{block_id}")
async def delete_block(block_id: str, x_admin_key: str = Header(..., alias="X-Admin-Key")):
    _verify_admin(x_admin_key)
    _db().table("lesson_blocks").delete().eq("id", block_id).execute()
    return {"status": "deleted"}


# ─── Users (Read Only) ────────────────────────────────────────────────────────

@router.get("/users")
async def list_users(x_admin_key: str = Header(..., alias="X-Admin-Key")):
    _verify_admin(x_admin_key)
    result = _db().table("user_profiles").select("*").order("created_at", desc=True).execute()
    return result.data or []


@router.get("/users/{user_id}/progress")
async def get_user_progress(user_id: str, x_admin_key: str = Header(..., alias="X-Admin-Key")):
    _verify_admin(x_admin_key)
    result = _db().table("user_progress").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
    return result.data or []


# ─── Quiz Attempts (Read Only) ────────────────────────────────────────────────

@router.get("/quiz-attempts")
async def list_quiz_attempts(
    user_id: Optional[str] = Query(None),
    lesson_id: Optional[str] = Query(None),
    x_admin_key: str = Header(..., alias="X-Admin-Key"),
):
    _verify_admin(x_admin_key)
    q = _db().table("quiz_attempts").select("*").order("created_at", desc=True)
    if user_id:
        q = q.eq("user_id", user_id)
    if lesson_id:
        q = q.eq("lesson_id", lesson_id)
    result = q.execute()
    return result.data or []


# ─── Bulk Upload ──────────────────────────────────────────────────────────────

@router.post("/bulk-upload")
async def bulk_upload(payload: dict[str, Any], x_admin_key: str = Header(..., alias="X-Admin-Key")):
    """
    Bulk upload lessons with their flashcard & quiz blocks.

    Expected payload format:
    {
      "track_id": "<uuid>",
      "lessons": [
        {
          "title": "Lesson Title",
          "description": "...",
          "difficulty_level": 1,
          "xp_reward": 25,
          "energy_cost": 10,
          "order_index": 1,
          "flashcards": [
            { "front": "...", "back": "..." }
          ],
          "quiz": [
            {
              "q": "Question text?",
              "options": ["A", "B", "C", "D"],
              "correct": 0,
              "xp": 10,
              "difficulty": "easy",
              "explanation": "..."
            }
          ]
        }
      ]
    }
    """
    _verify_admin(x_admin_key)
    db = _db()

    track_id = payload.get("track_id")
    lessons_data = payload.get("lessons", [])

    if not track_id:
        raise HTTPException(status_code=400, detail="track_id is required")
    if not lessons_data:
        raise HTTPException(status_code=400, detail="At least one lesson is required")

    results = {"created_lessons": 0, "created_blocks": 0, "errors": []}

    for i, lesson_input in enumerate(lessons_data):
        try:
            # Extract block data before inserting lesson
            flashcards = lesson_input.pop("flashcards", [])
            quiz_questions = lesson_input.pop("quiz", [])

            # Build lesson row
            lesson_row = {
                "track_id": track_id,
                "title": lesson_input.get("title", f"Untitled Lesson {i+1}"),
                "description": lesson_input.get("description", ""),
                "difficulty_level": lesson_input.get("difficulty_level", 1),
                "xp_reward": lesson_input.get("xp_reward", 25),
                "energy_cost": lesson_input.get("energy_cost", 10),
                "order_index": lesson_input.get("order_index", i + 1),
                "is_active": lesson_input.get("is_active", True),
                "has_video": lesson_input.get("has_video", False),
                "video_url": lesson_input.get("video_url"),
            }

            lesson_result = db.table("lessons").insert(lesson_row).execute()
            if not lesson_result.data:
                results["errors"].append(f"Lesson {i+1}: insert failed")
                continue

            lesson_id = lesson_result.data[0]["id"]
            results["created_lessons"] += 1
            block_order = 1

            # Create flashcard block if cards exist
            if flashcards:
                block_row = {
                    "lesson_id": lesson_id,
                    "block_type": "flashcard",
                    "order_index": block_order,
                    "content": {"cards": flashcards},
                    "is_active": True,
                }
                db.table("lesson_blocks").insert(block_row).execute()
                results["created_blocks"] += 1
                block_order += 1

            # Create quiz block if questions exist
            if quiz_questions:
                block_row = {
                    "lesson_id": lesson_id,
                    "block_type": "quiz",
                    "order_index": block_order,
                    "content": {"questions": quiz_questions},
                    "is_active": True,
                }
                db.table("lesson_blocks").insert(block_row).execute()
                results["created_blocks"] += 1

        except Exception as e:
            results["errors"].append(f"Lesson {i+1} ({lesson_input.get('title', '?')}): {str(e)}")

    return results
