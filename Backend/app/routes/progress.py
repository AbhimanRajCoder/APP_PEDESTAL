"""
Progress routes – user progress tracking endpoints.
"""

from fastapi import APIRouter, Depends
from datetime import datetime

from app.core.auth import get_current_user
from app.schemas.progress import ProgressResponse, ProgressUpdate
from app.services.progress_service import ProgressService
from app.utils import get_user_profile_id

router = APIRouter(prefix="/progress", tags=["Progress"])


@router.get("", response_model=ProgressResponse)
async def get_progress(auth_uid: str = Depends(get_current_user)):
    """Get the current user's progress overview."""
    profile_id = await get_user_profile_id(auth_uid)
    service = ProgressService()
    return await service.get_user_progress(profile_id)


@router.post("", status_code=201)
async def update_progress(
    update: ProgressUpdate, 
    auth_uid: str = Depends(get_current_user)
):
    """Update or create a progress record for a lesson."""
    profile_id = await get_user_profile_id(auth_uid)
    service = ProgressService()
    return await service.update_user_progress(profile_id, update)
@router.post("/checkin", status_code=200)
async def daily_checkin(auth_uid: str = Depends(get_current_user)):
    """Record a daily check-in and update streak."""
    profile_id = await get_user_profile_id(auth_uid)
    service = ProgressService()
    
    # We update the user's streak by calling an internal method or just updating user_profiles
    db = service.db
    profile_result = db.table("user_profiles").select("id, streak_days, updated_at").eq("id", str(profile_id)).limit(1).execute()
    profile_row = profile_result.data[0] if profile_result.data else None
    
    if profile_row:
        last_update = profile_row.get("updated_at")
        current_streak = profile_row.get("streak_days", 0)
        update_data = {}
        
        if last_update:
            last_update_dt = datetime.fromisoformat(last_update.replace('Z', '+00:00'))
            now_dt = datetime.now().astimezone()
            diff_days = (now_dt.date() - last_update_dt.date()).days
            
            if diff_days == 1:
                update_data["streak_days"] = current_streak + 1
            elif diff_days > 1:
                update_data["streak_days"] = 1
            # if diff_days == 0, already updated today
        else:
            update_data["streak_days"] = 1
            
        if update_data:
            db.table("user_profiles").update(update_data).eq("id", str(profile_id)).execute()
            return {"status": "success", "new_streak": update_data["streak_days"]}
            
        return {"status": "already_updated", "streak": current_streak}
    
    return {"status": "error", "message": "Profile not found"}
