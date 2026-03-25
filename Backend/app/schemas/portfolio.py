from pydantic import BaseModel, Field
from typing import List, Optional
from uuid import UUID
from datetime import datetime

class HoldingSchema(BaseModel):
    symbol: str
    qty: int
    avg_price: float

class ShortPositionSchema(BaseModel):
    symbol: str
    qty: int
    entry_price: float
    margin_held: float

class TradeSchema(BaseModel):
    symbol: str
    type: str  # 'BUY', 'SELL', 'SHORT', 'COVER'
    qty: int
    price: float
    total: float
    timestamp: datetime

class PortfolioResponse(BaseModel):
    cash: float
    holdings: List[HoldingSchema]
    shorts: List[ShortPositionSchema]
    trades: List[TradeSchema]

class TradeRequest(BaseModel):
    symbol: str
    type: str
    qty: int
    price: float
