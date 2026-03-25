"""
Portfolio service – handles virtual trading and portfolio tracking.
"""

from uuid import UUID
from datetime import datetime
from app.core.database import get_supabase_admin
from app.schemas.portfolio import PortfolioResponse, HoldingSchema, ShortPositionSchema, TradeSchema, TradeRequest

class PortfolioService:
    def __init__(self):
        self.db = get_supabase_admin()

    def _first(self, result) -> dict | None:
        if result and result.data:
            return result.data[0]
        return None

    async def get_user_portfolio(self, user_profile_id: UUID) -> PortfolioResponse:
        """Fetch user cash, holdings, shorts, and trades."""
        # Get portfolio entry (create if not exists)
        result = self.db.table("user_portfolios").select("*").eq("user_id", str(user_profile_id)).limit(1).execute()
        portfolio_row = self._first(result)
        
        if not portfolio_row:
            # Create default portfolio
            portfolio_row = {"user_id": str(user_profile_id), "cash": 100000.0}
            res = self.db.table("user_portfolios").insert(portfolio_row).execute()
            portfolio_row = self._first(res)
            
        portfolio_id = portfolio_row["id"]
        cash = portfolio_row["cash"]

        # Fetch holdings
        holdings_res = self.db.table("portfolio_holdings").select("*").eq("portfolio_id", str(portfolio_id)).execute()
        holdings = [HoldingSchema(symbol=r["symbol"], qty=r["qty"], avg_price=r["avg_price"]) for r in holdings_res.data] if holdings_res.data else []

        # Fetch shorts
        shorts_res = self.db.table("portfolio_shorts").select("*").eq("portfolio_id", str(portfolio_id)).execute()
        shorts = [ShortPositionSchema(symbol=r["symbol"], qty=r["qty"], entry_price=r["entry_price"], margin_held=r["margin_held"]) for r in shorts_res.data] if shorts_res.data else []

        # Fetch trades (limit to 50 for performance)
        trades_res = self.db.table("portfolio_trades").select("*").eq("portfolio_id", str(portfolio_id)).order("timestamp", desc=True).limit(50).execute()
        trades = []
        if trades_res.data:
            for t in trades_res.data:
                ts = datetime.fromisoformat(t["timestamp"].replace('Z', '+00:00'))
                trades.append(TradeSchema(
                    symbol=t["symbol"],
                    type=t["type"],
                    qty=t["qty"],
                    price=t["price"],
                    total=t["total"],
                    timestamp=ts
                ))

        return PortfolioResponse(cash=cash, holdings=holdings, shorts=shorts, trades=trades)

    async def execute_trade(self, user_profile_id: UUID, req: TradeRequest) -> PortfolioResponse:
        """Perform trade logic and update backend tables."""
        # Get portfolio
        result = self.db.table("user_portfolios").select("*").eq("user_id", str(user_profile_id)).limit(1).execute()
        portfolio_row = self._first(result)
        if not portfolio_row:
            portfolio_row = {"user_id": str(user_profile_id), "cash": 100000.0}
            res = self.db.table("user_portfolios").insert(portfolio_row).execute()
            portfolio_row = self._first(res)
        
        portfolio_id = portfolio_row["id"]
        cash = portfolio_row["cash"]
        total_amount = round(req.qty * req.price, 2)
        
        if req.type == "BUY":
            if cash < total_amount:
                raise ValueError("Insufficient funds")
            
            new_cash = round(cash - total_amount, 2)
            self.db.table("user_portfolios").update({"cash": new_cash}).eq("id", str(portfolio_id)).execute()
            
            h_res = self.db.table("portfolio_holdings").select("*").eq("portfolio_id", str(portfolio_id)).eq("symbol", req.symbol).limit(1).execute()
            existing = self._first(h_res)
            if existing:
                new_qty = existing["qty"] + req.qty
                new_avg = round((existing["qty"] * existing["avg_price"] + total_amount) / new_qty, 2)
                self.db.table("portfolio_holdings").update({"qty": new_qty, "avg_price": new_avg}).eq("id", existing["id"]).execute()
            else:
                self.db.table("portfolio_holdings").insert({
                    "portfolio_id": str(portfolio_id), "symbol": req.symbol, "qty": req.qty, "avg_price": req.price
                }).execute()
                
        elif req.type == "SELL":
            h_res = self.db.table("portfolio_holdings").select("*").eq("portfolio_id", str(portfolio_id)).eq("symbol", req.symbol).limit(1).execute()
            existing = self._first(h_res)
            if not existing or existing["qty"] < req.qty:
                raise ValueError("Not enough shares to sell")
            
            new_qty = existing["qty"] - req.qty
            new_cash = round(cash + total_amount, 2)
            self.db.table("user_portfolios").update({"cash": new_cash}).eq("id", str(portfolio_id)).execute()
            
            if new_qty == 0:
                self.db.table("portfolio_holdings").delete().eq("id", existing["id"]).execute()
            else:
                self.db.table("portfolio_holdings").update({"qty": new_qty}).eq("id", existing["id"]).execute()

        elif req.type == "SHORT":
            margin_rate = 0.5
            margin_required = round(total_amount * margin_rate, 2)
            if cash < margin_required:
                raise ValueError(f"Insufficient margin. Need {margin_required}")
            
            new_cash = round(cash - margin_required, 2)
            self.db.table("user_portfolios").update({"cash": new_cash}).eq("id", str(portfolio_id)).execute()
            
            s_res = self.db.table("portfolio_shorts").select("*").eq("portfolio_id", str(portfolio_id)).eq("symbol", req.symbol).limit(1).execute()
            existing = self._first(s_res)
            if existing:
                new_qty = existing["qty"] + req.qty
                new_total_val = existing["qty"] * existing["entry_price"] + total_amount
                new_entry = round(new_total_val / new_qty, 2)
                new_margin = round(existing["margin_held"] + margin_required, 2)
                self.db.table("portfolio_shorts").update({"qty": new_qty, "entry_price": new_entry, "margin_held": new_margin}).eq("id", existing["id"]).execute()
            else:
                self.db.table("portfolio_shorts").insert({
                    "portfolio_id": str(portfolio_id), "symbol": req.symbol, "qty": req.qty, "entry_price": req.price, "margin_held": margin_required
                }).execute()

        elif req.type == "COVER":
            s_res = self.db.table("portfolio_shorts").select("*").eq("portfolio_id", str(portfolio_id)).eq("symbol", req.symbol).limit(1).execute()
            existing = self._first(s_res)
            if not existing or existing["qty"] < req.qty:
                raise ValueError("Not enough shorted shares to cover")
            
            pnl = round((existing["entry_price"] - req.price) * req.qty, 2)
            margin_release = round(existing["margin_held"] * (req.qty / existing["qty"]), 2)
            new_cash = round(cash + margin_release + pnl, 2)
            if new_cash < 0:
                raise ValueError("Cannot cover: loss exceeds available funds")
            
            self.db.table("user_portfolios").update({"cash": new_cash}).eq("id", str(portfolio_id)).execute()
            new_qty = existing["qty"] - req.qty
            if new_qty == 0:
                self.db.table("portfolio_shorts").delete().eq("id", existing["id"]).execute()
            else:
                new_margin = round(existing["margin_held"] - margin_release, 2)
                self.db.table("portfolio_shorts").update({"qty": new_qty, "margin_held": new_margin}).eq("id", existing["id"]).execute()
        
        # Log trade
        self.db.table("portfolio_trades").insert({
            "portfolio_id": str(portfolio_id),
            "symbol": req.symbol,
            "type": req.type,
            "qty": req.qty,
            "price": req.price,
            "total": total_amount,
            "timestamp": datetime.now().isoformat()
        }).execute()
        
        return await self.get_user_portfolio(user_profile_id)
