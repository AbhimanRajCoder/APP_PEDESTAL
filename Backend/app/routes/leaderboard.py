"""
Leaderboard routes – user ranking endpoints.
"""

from fastapi import APIRouter, Depends
from typing import List

from app.core.auth import get_current_user
from app.schemas.leaderboard import LeaderboardResponse, LeaderboardEntry
from app.core.database import get_supabase_admin
from app.utils import get_user_profile_id

router = APIRouter(prefix="/leaderboard", tags=["Leaderboard"])

@router.get("", response_model=LeaderboardResponse)
async def get_leaderboard(auth_uid: str = Depends(get_current_user)):
    """Get the global leaderboard of top users by XP."""
    db = get_supabase_admin()
    
    # 1. Fetch top users
    result = (
        db.table("user_profiles")
        .select("id, display_name, xp_total")
        .order("xp_total", desc=True)
        .limit(20)
        .execute()
    )
    
    top_players = []
    # Avatar colors for variety
    colors = ['#3B82F6', '#10B981', '#8B5CF6', '#F43F5E', '#F59E0B']
    
    for i, row in enumerate(result.data or []):
        name = row.get("display_name") or "Anonymous User"
        name_parts = name.split()
        avatar = (name_parts[0][0] if name_parts else "U").upper()
        if len(name_parts) > 1:
            avatar += name_parts[1][0].upper()
        avatar = avatar[:2]
        
        top_players.append(
            LeaderboardEntry(
                id=str(row["id"]),
                name=name,
                xp=row["xp_total"],
                rank=i + 1,
                avatar=avatar,
                color=colors[i % len(colors)]
            )
        )
    
    # 2. Find current user's rank
    profile_id = await get_user_profile_id(auth_uid)
    user_rank = None
    
    # Check if user is in top_players
    for p in top_players:
        if p.id == str(profile_id):
            user_rank = p
            break
            
    if not user_rank:
        # Find user's exact rank (this is a bit expensive but fine for now)
        # In a real app, uses a window function or a separate table
        user_p = (
            db.table("user_profiles")
            .select("id, display_name, xp_total")
            .eq("id", str(profile_id))
            .execute()
        )
        if user_p.data:
            p_row = user_p.data[0]
            count_res = (
                db.table("user_profiles")
                .select("id", count="exact")
                .gt("xp_total", p_row["xp_total"])
                .execute()
            )
            exact_rank = (count_res.count or 0) + 1
            name = p_row.get("display_name") or "You"
            name_parts = name.split()
            avatar = (name_parts[0][0] if name_parts else "Y").upper()
            if len(name_parts) > 1:
                avatar += name_parts[1][0].upper()
            avatar = avatar[:2]
            user_rank = LeaderboardEntry(
                id=str(p_row["id"]),
                name=name,
                xp=p_row["xp_total"],
                rank=exact_rank,
                avatar=avatar,
                color="#6366F1"
            )
            
    return LeaderboardResponse(top_players=top_players, user_rank=user_rank)
