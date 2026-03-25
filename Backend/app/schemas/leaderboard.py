from pydantic import BaseModel
from typing import List, Optional

class LeaderboardEntry(BaseModel):
    id: str
    name: str
    xp: int
    rank: int
    avatar: str
    color: str

class LeaderboardResponse(BaseModel):
    top_players: List[LeaderboardEntry]
    user_rank: Optional[LeaderboardEntry] = None
