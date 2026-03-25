from fastapi import APIRouter, Depends, HTTPException
from app.core.auth import get_current_user
from app.utils import get_user_profile_id
from app.schemas.portfolio import PortfolioResponse, TradeRequest
from app.services.portfolio_service import PortfolioService

router = APIRouter(prefix="/portfolio", tags=["Portfolio"])

@router.get("", response_model=PortfolioResponse)
async def get_portfolio(auth_uid: str = Depends(get_current_user)):
    """Fetch the current user's virtual portfolio."""
    profile_id = await get_user_profile_id(auth_uid)
    service = PortfolioService()
    return await service.get_user_portfolio(profile_id)

@router.post("/trade", response_model=PortfolioResponse)
async def execute_trade(req: TradeRequest, auth_uid: str = Depends(get_current_user)):
    """Execute a virtual trade and update the database."""
    profile_id = await get_user_profile_id(auth_uid)
    service = PortfolioService()
    try:
        return await service.execute_trade(profile_id, req)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
