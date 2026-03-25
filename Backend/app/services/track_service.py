"""
Track service – business logic for learning tracks.
"""

from uuid import UUID
from fastapi import HTTPException, status

from app.core.database import get_supabase
from app.schemas.track import TrackResponse, TrackListResponse


class TrackService:
    """Handles track listing and retrieval."""

    def __init__(self):
        self.db = get_supabase()

    async def list_tracks(self) -> TrackListResponse:
        """List all active tracks ordered by order_index."""
        result = (
            self.db.table("tracks")
            .select("*, lessons(count)")
            .eq("is_active", True)
            .order("order_index")
            .execute()
        )

        tracks = []
        for row in result.data:
            lesson_count = 0
            if row.get("lessons"):
                lesson_count = row["lessons"][0].get("count", 0) if row["lessons"] else 0

            tracks.append(
                TrackResponse(
                    id=row["id"],
                    title=row["title"],
                    description=row.get("description"),
                    category=row["category"],
                    difficulty=row["difficulty"],
                    order_index=row["order_index"],
                    icon_url=row.get("icon_url"),
                    lesson_count=lesson_count,
                )
            )

        return TrackListResponse(tracks=tracks, total=len(tracks))

    async def get_track(self, track_id: UUID) -> TrackResponse:
        """Get a single track by ID."""
        result = (
            self.db.table("tracks")
            .select("*, lessons(count)")
            .eq("id", str(track_id))
            .eq("is_active", True)
            .single()
            .execute()
        )

        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Track not found",
            )

        row = result.data
        lesson_count = 0
        if row.get("lessons"):
            lesson_count = row["lessons"][0].get("count", 0) if row["lessons"] else 0

        return TrackResponse(
            id=row["id"],
            title=row["title"],
            description=row.get("description"),
            category=row["category"],
            difficulty=row["difficulty"],
            order_index=row["order_index"],
            icon_url=row.get("icon_url"),
            lesson_count=lesson_count,
        )

    async def get_track_lessons(self, track_id: UUID) -> list[dict]:
        """Get all lessons for a track, ordered by order_index."""
        result = (
            self.db.table("lessons")
            .select("*")
            .eq("track_id", str(track_id))
            .eq("is_active", True)
            .order("order_index")
            .execute()
        )
        return result.data or []
