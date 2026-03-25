import asyncio
import os
import sys

# Add backend directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import get_supabase_admin
from app.data.lessons import LESSON_MAP

async def sync():
    db = get_supabase_admin()
    
    # 1. Get a valid track_id
    track_res = db.table('tracks').select('id').limit(1).execute()
    if not track_res.data:
        print("No tracks found! Cannot insert lessons.")
        return
    
    track_id = track_res.data[0]['id']
    
    # 2. Prepare payload
    payload = []
    order = 1
    for slug, data in LESSON_MAP.items():
        payload.append({
            "id": data["uuid"],
            "track_id": track_id,
            "title": data["title"],
            "description": data["title"],
            "difficulty_level": 1,
            "energy_cost": 0,
            "xp_reward": 10,
            "order_index": order,
            "is_active": True
        })
        order += 1
        
    print(f"Upserting {len(payload)} lessons into Supabase...")
    
    # Supabase upsert has a limit, but 50 rows is well within limits.
    res = db.table('lessons').upsert(payload, on_conflict="id").execute()
    print("Successfully mapped all frontend lessons to the database!")

if __name__ == "__main__":
    asyncio.run(sync())
