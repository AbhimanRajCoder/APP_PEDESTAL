"""
Utility helpers for the Pedestal backend.
"""

from uuid import UUID
from fastapi import HTTPException, status

from app.core.database import get_supabase_admin


async def get_user_profile_id(auth_uid: str) -> UUID:
    """
    Resolve a Supabase auth UID to the internal user_profiles.id.
    Creates a profile if none exists.

    Args:
        auth_uid: The user's Supabase auth.users UID

    Returns:
        UUID of the user_profiles row
    """
    db = get_supabase_admin()

    result = (
        db.table("user_profiles")
        .select("id")
        .eq("auth_uid", auth_uid)
        .execute()
    )

    if result.data and len(result.data) > 0:
        return UUID(result.data[0]["id"])

    # Auto-create profile for new users
    insert_result = (
        db.table("user_profiles")
        .insert({"auth_uid": auth_uid})
        .execute()
    )

    if insert_result.data and len(insert_result.data) > 0:
        return UUID(insert_result.data[0]["id"])

    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Failed to create user profile",
    )
