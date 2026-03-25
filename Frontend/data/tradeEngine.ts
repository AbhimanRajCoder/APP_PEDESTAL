// ═══════════════════════════════════════════════════════════════════════════════
// Trade Engine — All local state for Paper Trading (Long + Short)
// ═══════════════════════════════════════════════════════════════════════════════

import AsyncStorage from '@react-native-async-storage/async-storage';
import { MOCK_STOCKS, StockData } from './mockStocks';

const PORTFOLIO_KEY = 'paper_portfolio';
const CASH_KEY = 'paper_cash';
const TRADES_KEY = 'paper_trades';
const SHORTS_KEY = 'paper_shorts';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export const INITIAL_CASH = 100000;

// Margin requirement: 50% of the short value must be held as collateral
export const SHORT_MARGIN_RATE = 0.5;

export interface Holding {
    symbol: string;
    qty: number;
    avgPrice: number;
}

export interface ShortPosition {
    symbol: string;
    qty: number;             // number of shares shorted
    entryPrice: number;      // avg price at which shares were shorted
    marginHeld: number;      // collateral locked (entryPrice * qty * MARGIN_RATE)
}

export interface Trade {
    id: string;
    symbol: string;
    type: 'BUY' | 'SELL' | 'SHORT' | 'COVER';
    qty: number;
    price: number;
    total: number;
    timestamp: number;
}

export interface PortfolioState {
    cash: number;
    holdings: Holding[];
    shorts: ShortPosition[];
    trades: Trade[];
}

// ─── Load ──────────────────────────────────────────────────────────────────────

// Helper to map backend snake_case to frontend camelCase
function mapPortfolioState(data: any): PortfolioState {
    return {
        cash: data.cash,
        holdings: (data.holdings || []).map((h: any) => ({
            symbol: h.symbol,
            qty: h.qty,
            avgPrice: h.avg_price !== undefined ? h.avg_price : h.avgPrice
        })),
        shorts: (data.shorts || []).map((s: any) => ({
            symbol: s.symbol,
            qty: s.qty,
            entryPrice: s.entry_price !== undefined ? s.entry_price : s.entryPrice,
            marginHeld: s.margin_held !== undefined ? s.margin_held : s.marginHeld
        })),
        trades: (data.trades || []).map((t: any) => ({
            ...t,
            id: t.id || `t-${new Date(t.timestamp).getTime()}`,
            timestamp: new Date(t.timestamp).getTime()
        }))
    };
}

export async function loadPortfolio(token?: string): Promise<PortfolioState> {
    // 1. Try backend if token is available
    if (token && BACKEND_URL) {
        try {
            const res = await fetch(`${BACKEND_URL}/api/portfolio`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                const state = mapPortfolioState(data);
                // Sync to local storage as fallback
                await savePortfolio(state);
                return state;
            }
        } catch (err) {
            console.warn('[TradeEngine] Backend fetch failed, falling back to local:', err);
        }
    }

    // 2. Fallback to local storage
    try {
        const [cashStr, holdingsStr, tradesStr, shortsStr] = await Promise.all([
            AsyncStorage.getItem(CASH_KEY),
            AsyncStorage.getItem(PORTFOLIO_KEY),
            AsyncStorage.getItem(TRADES_KEY),
            AsyncStorage.getItem(SHORTS_KEY),
        ]);
        return {
            cash: cashStr ? parseFloat(cashStr) : INITIAL_CASH,
            holdings: holdingsStr ? JSON.parse(holdingsStr) : [],
            shorts: shortsStr ? JSON.parse(shortsStr) : [],
            trades: tradesStr ? JSON.parse(tradesStr) : [],
        };
    } catch {
        return { cash: INITIAL_CASH, holdings: [], shorts: [], trades: [] };
    }
}

// ─── Save ──────────────────────────────────────────────────────────────────────

async function savePortfolio(state: PortfolioState) {
    await Promise.all([
        AsyncStorage.setItem(CASH_KEY, String(state.cash)),
        AsyncStorage.setItem(PORTFOLIO_KEY, JSON.stringify(state.holdings)),
        AsyncStorage.setItem(TRADES_KEY, JSON.stringify(state.trades)),
        AsyncStorage.setItem(SHORTS_KEY, JSON.stringify(state.shorts)),
    ]);
}

// ─── Buy (Long) ────────────────────────────────────────────────────────────────

export async function buyStock(
    symbol: string,
    qty: number,
    price: number,
    token?: string
): Promise<{ success: boolean; message: string; state: PortfolioState }> {
    // 1. Try backend if token is available
    if (token && BACKEND_URL) {
        try {
            const res = await fetch(`${BACKEND_URL}/api/portfolio/trade`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ symbol, qty, price, type: 'BUY' })
            });
            if (res.ok) {
                const data = await res.json();
                const newState = mapPortfolioState(data);
                await savePortfolio(newState);
                return { success: true, message: `Bought ${qty} shares of ${symbol}`, state: newState };
            } else {
                const errData = await res.json();
                return { success: false, message: errData.detail || 'Purchase failed', state: await loadPortfolio(token) };
            }
        } catch (err) {
            console.warn('[TradeEngine] Backend BUY failed, using local:', err);
        }
    }

    // 2. Local fallback
    const state = await loadPortfolio();
    const totalCost = +(qty * price).toFixed(2);

    if (totalCost > state.cash) {
        return { success: false, message: 'Insufficient funds.', state };
    }
    if (qty <= 0) {
        return { success: false, message: 'Invalid quantity.', state };
    }

    // Update cash
    state.cash = +(state.cash - totalCost).toFixed(2);

    // Update holdings
    const existing = state.holdings.find(h => h.symbol === symbol);
    if (existing) {
        const newTotal = existing.qty * existing.avgPrice + totalCost;
        existing.qty += qty;
        existing.avgPrice = +(newTotal / existing.qty).toFixed(2);
    } else {
        state.holdings.push({ symbol, qty, avgPrice: price });
    }

    // Record trade
    state.trades.unshift({
        id: `t-${Date.now()}`,
        symbol, type: 'BUY', qty, price, total: totalCost, timestamp: Date.now(),
    });

    await savePortfolio(state);
    return { success: true, message: `Bought ${qty} shares of ${symbol}`, state };
}

// ─── Sell (Long) ───────────────────────────────────────────────────────────────

export async function sellStock(
    symbol: string,
    qty: number,
    price: number,
    token?: string
): Promise<{ success: boolean; message: string; state: PortfolioState }> {
    // 1. Try backend if token is available
    if (token && BACKEND_URL) {
        try {
            const res = await fetch(`${BACKEND_URL}/api/portfolio/trade`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ symbol, qty, price, type: 'SELL' })
            });
            if (res.ok) {
                const data = await res.json();
                const newState = mapPortfolioState(data);
                await savePortfolio(newState);
                return { success: true, message: `Sold ${qty} shares of ${symbol}`, state: newState };
            } else {
                const errData = await res.json();
                return { success: false, message: errData.detail || 'Sale failed', state: await loadPortfolio(token) };
            }
        } catch (err) {
            console.warn('[TradeEngine] Backend SELL failed, using local:', err);
        }
    }

    // 2. Local fallback
    const state = await loadPortfolio();
    const existing = state.holdings.find(h => h.symbol === symbol);

    if (!existing || existing.qty < qty) {
        return { success: false, message: 'Not enough shares to sell.', state };
    }
    if (qty <= 0) {
        return { success: false, message: 'Invalid quantity.', state };
    }

    const totalValue = +(qty * price).toFixed(2);
    state.cash = +(state.cash + totalValue).toFixed(2);

    existing.qty -= qty;
    if (existing.qty === 0) {
        state.holdings = state.holdings.filter(h => h.symbol !== symbol);
    }

    state.trades.unshift({
        id: `t-${Date.now()}`,
        symbol, type: 'SELL', qty, price, total: totalValue, timestamp: Date.now(),
    });

    await savePortfolio(state);
    return { success: true, message: `Sold ${qty} shares of ${symbol}`, state };
}

// ─── Short Sell ────────────────────────────────────────────────────────────────
// Short selling: Borrow shares and sell them at current price.
// Margin (collateral) = entryPrice * qty * SHORT_MARGIN_RATE is locked from cash.
// The sale proceeds (entryPrice * qty) are credited to cash.
// Net cash impact: cash += (entryPrice * qty) - margin = entryPrice * qty * (1 - MARGIN_RATE)
// BUT we show margin separately so user understands the risk.

export async function shortSell(
    symbol: string,
    qty: number,
    price: number,
    token?: string
): Promise<{ success: boolean; message: string; state: PortfolioState }> {
    // 1. Try backend if token is available
    if (token && BACKEND_URL) {
        try {
            const res = await fetch(`${BACKEND_URL}/api/portfolio/trade`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ symbol, qty, price, type: 'SHORT' })
            });
            if (res.ok) {
                const data = await res.json();
                const newState = mapPortfolioState(data);
                await savePortfolio(newState);
                return { success: true, message: `Shorted ${qty} shares of ${symbol}`, state: newState };
            } else {
                const errData = await res.json();
                return { success: false, message: errData.detail || 'Short failed', state: await loadPortfolio(token) };
            }
        } catch (err) {
            console.warn('[TradeEngine] Backend SHORT failed, using local:', err);
        }
    }

    // 2. Local fallback
    const state = await loadPortfolio();

    if (qty <= 0) {
        return { success: false, message: 'Invalid quantity.', state };
    }

    const marginRequired = +(qty * price * SHORT_MARGIN_RATE).toFixed(2);

    if (marginRequired > state.cash) {
        return {
            success: false,
            message: `Insufficient margin. Need ₹${marginRequired.toLocaleString('en-IN')} (${(SHORT_MARGIN_RATE * 100)}% of ₹${(qty * price).toLocaleString('en-IN')}).`,
            state,
        };
    }

    // Lock margin from cash
    state.cash = +(state.cash - marginRequired).toFixed(2);

    // Update short positions
    const existing = state.shorts.find(s => s.symbol === symbol);
    if (existing) {
        // Average up/down
        const totalMargin = existing.marginHeld + marginRequired;
        const totalValue = existing.qty * existing.entryPrice + qty * price;
        existing.qty += qty;
        existing.entryPrice = +(totalValue / existing.qty).toFixed(2);
        existing.marginHeld = +totalMargin.toFixed(2);
    } else {
        state.shorts.push({
            symbol,
            qty,
            entryPrice: price,
            marginHeld: marginRequired,
        });
    }

    // Record trade
    state.trades.unshift({
        id: `t-${Date.now()}`,
        symbol,
        type: 'SHORT',
        qty,
        price,
        total: +(qty * price).toFixed(2),
        timestamp: Date.now(),
    });

    await savePortfolio(state);
    return {
        success: true,
        message: `Shorted ${qty} shares of ${symbol} at ₹${price.toLocaleString('en-IN')}`,
        state,
    };
}

// ─── Cover Short ───────────────────────────────────────────────────────────────
// Cover: Buy back shorted shares at current market price.
// P&L = (entryPrice - coverPrice) * qty
// Margin is released, and P&L is added/deducted from cash.

export async function coverShort(
    symbol: string,
    qty: number,
    price: number,
    token?: string
): Promise<{ success: boolean; message: string; pnl?: number; state: PortfolioState }> {
    // 1. Try backend if token is available
    if (token && BACKEND_URL) {
        try {
            const res = await fetch(`${BACKEND_URL}/api/portfolio/trade`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ symbol, qty, price, type: 'COVER' })
            });
            if (res.ok) {
                const data = await res.json();
                const newState = mapPortfolioState(data);
                // Calculate P&L for the message (simple diff logic)
                const stateBefore = await loadPortfolio(token);
                const pnl = +(newState.cash - stateBefore.cash).toFixed(2);

                await savePortfolio(newState);
                const pnlStr = pnl >= 0 ? `Profit: +₹${pnl.toLocaleString('en-IN')}` : `Loss: -₹${Math.abs(pnl).toLocaleString('en-IN')}`;
                return { success: true, message: `Covered ${qty} shares of ${symbol}. ${pnlStr}`, pnl, state: newState };
            } else {
                const errData = await res.json();
                return { success: false, message: errData.detail || 'Cover failed', state: await loadPortfolio(token) };
            }
        } catch (err) {
            console.warn('[TradeEngine] Backend COVER failed, using local:', err);
        }
    }

    // 2. Local fallback
    const state = await loadPortfolio();
    const existing = state.shorts.find(s => s.symbol === symbol);

    if (!existing || existing.qty < qty) {
        return { success: false, message: 'Not enough shorted shares to cover.', state };
    }
    if (qty <= 0) {
        return { success: false, message: 'Invalid quantity.', state };
    }

    // P&L: profit when price drops (entry > cover), loss when price rises
    const pnl = +((existing.entryPrice - price) * qty).toFixed(2);

    // Release proportional margin
    const marginRelease = +(existing.marginHeld * (qty / existing.qty)).toFixed(2);

    // Cash = released margin + P&L
    state.cash = +(state.cash + marginRelease + pnl).toFixed(2);

    // Ensure cash doesn't go negative (in extreme loss scenarios)
    if (state.cash < 0) {
        return {
            success: false,
            message: `Cannot cover: loss of ₹${Math.abs(pnl).toLocaleString('en-IN')} exceeds available funds.`,
            state: await loadPortfolio(), // reload clean state
        };
    }

    // Update position
    existing.qty -= qty;
    existing.marginHeld = +(existing.marginHeld - marginRelease).toFixed(2);
    if (existing.qty === 0) {
        state.shorts = state.shorts.filter(s => s.symbol !== symbol);
    }

    // Record trade
    state.trades.unshift({
        id: `t-${Date.now()}`,
        symbol,
        type: 'COVER',
        qty,
        price,
        total: +(qty * price).toFixed(2),
        timestamp: Date.now(),
    });

    await savePortfolio(state);
    const pnlStr = pnl >= 0
        ? `Profit: +₹${pnl.toLocaleString('en-IN')}`
        : `Loss: -₹${Math.abs(pnl).toLocaleString('en-IN')}`;
    return {
        success: true,
        message: `Covered ${qty} shares of ${symbol}. ${pnlStr}`,
        pnl,
        state,
    };
}

// ─── Portfolio Value (Long + Short) ────────────────────────────────────────────

export function calculatePortfolioValue(
    holdings: Holding[],
    currentPrices: Record<string, number>,
    shorts?: ShortPosition[]
): { totalValue: number; totalInvested: number; totalPL: number; shortPL: number; totalMarginHeld: number } {
    let totalValue = 0;
    let totalInvested = 0;

    // Long positions
    for (const h of holdings) {
        const cp = currentPrices[h.symbol] || h.avgPrice;
        totalValue += h.qty * cp;
        totalInvested += h.qty * h.avgPrice;
    }

    // Short positions
    let shortPL = 0;
    let totalMarginHeld = 0;
    if (shorts) {
        for (const s of shorts) {
            const cp = currentPrices[s.symbol] || s.entryPrice;
            // Short P&L: profit when current price < entry price
            shortPL += (s.entryPrice - cp) * s.qty;
            totalMarginHeld += s.marginHeld;
        }
    }

    return {
        totalValue: +totalValue.toFixed(2),
        totalInvested: +totalInvested.toFixed(2),
        totalPL: +(totalValue - totalInvested + shortPL).toFixed(2),
        shortPL: +shortPL.toFixed(2),
        totalMarginHeld: +totalMarginHeld.toFixed(2),
    };
}

// ─── Reset ─────────────────────────────────────────────────────────────────────

export async function resetPortfolio(): Promise<PortfolioState> {
    const state: PortfolioState = { cash: INITIAL_CASH, holdings: [], shorts: [], trades: [] };
    await savePortfolio(state);
    return state;
}

// ─── Price Simulation ──────────────────────────────────────────────────────────

export function simulatePrice(stock: StockData): number {
    const change = (Math.random() - 0.48) * stock.volatility * 0.01 * stock.price;
    return +(stock.price + change).toFixed(2);
}
