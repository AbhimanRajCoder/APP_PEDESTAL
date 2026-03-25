// ============================================================
// PLAYER STATE — Psychology, Portfolio, Investigation, Endings
// Tracks everything about the player throughout the simulation
// ============================================================

import { MarketForces } from './marketEngine';

// ── Player Psychology ──────────────────────────────────────
export interface PlayerPsychology {
    greed: number;       // 0-100
    fear: number;        // 0-100
    confidence: number;  // 0-100
    patience: number;    // 0-100
}

export const DEFAULT_PSYCHOLOGY: PlayerPsychology = {
    greed: 30,
    fear: 20,
    confidence: 50,
    patience: 60,
};

// ── Real Portfolio System ──────────────────────────────────
export interface PortfolioPosition {
    assetName: string;
    assetType: string;
    quantity: number;
    avgBuyPrice: number;
    currentPrice: number;
}

export interface TradeAction {
    weekNumber: number;
    assetName: string;
    assetType: string;
    action: 'buy' | 'sell';
    quantity: number;
    price: number;
    totalCost: number;
}

export interface PlayerPortfolio {
    cash: number;
    positions: PortfolioPosition[];
    tradeHistory: TradeAction[];
}

export function createInitialPortfolio(startingCash: number): PlayerPortfolio {
    return {
        cash: startingCash,
        positions: [],
        tradeHistory: [],
    };
}

export function getPositionValue(pos: PortfolioPosition): number {
    return pos.quantity * pos.currentPrice;
}

export function getPositionPL(pos: PortfolioPosition): number {
    return (pos.currentPrice - pos.avgBuyPrice) * pos.quantity;
}

export function getPositionPLPercent(pos: PortfolioPosition): number {
    if (pos.avgBuyPrice === 0) return 0;
    return ((pos.currentPrice - pos.avgBuyPrice) / pos.avgBuyPrice) * 100;
}

export function getTotalPortfolioValue(portfolio: PlayerPortfolio): number {
    const positionsValue = portfolio.positions.reduce(
        (sum, pos) => sum + getPositionValue(pos), 0
    );
    return portfolio.cash + positionsValue;
}

export function getTotalPL(portfolio: PlayerPortfolio, startingCapital: number): number {
    return getTotalPortfolioValue(portfolio) - startingCapital;
}

// ── Execute Trade ──────────────────────────────────────────
export function executeTrade(
    portfolio: PlayerPortfolio,
    assetName: string,
    assetType: string,
    action: 'buy' | 'sell',
    quantity: number,
    price: number,
    weekNumber: number
): { portfolio: PlayerPortfolio; success: boolean; error?: string } {
    const totalCost = quantity * price;

    if (action === 'buy') {
        if (totalCost > portfolio.cash) {
            return { portfolio, success: false, error: 'Insufficient cash' };
        }

        const newPortfolio = { ...portfolio };
        newPortfolio.cash = portfolio.cash - totalCost;

        // Find existing position or create new
        const existingIdx = portfolio.positions.findIndex(p => p.assetName === assetName);
        if (existingIdx >= 0) {
            const existing = portfolio.positions[existingIdx];
            const newQuantity = existing.quantity + quantity;
            const newAvgPrice = (existing.avgBuyPrice * existing.quantity + price * quantity) / newQuantity;
            newPortfolio.positions = [...portfolio.positions];
            newPortfolio.positions[existingIdx] = {
                ...existing,
                quantity: newQuantity,
                avgBuyPrice: Math.round(newAvgPrice),
                currentPrice: price,
            };
        } else {
            newPortfolio.positions = [...portfolio.positions, {
                assetName,
                assetType,
                quantity,
                avgBuyPrice: price,
                currentPrice: price,
            }];
        }

        newPortfolio.tradeHistory = [...portfolio.tradeHistory, {
            weekNumber, assetName, assetType, action, quantity, price, totalCost,
        }];

        return { portfolio: newPortfolio, success: true };
    }

    // SELL
    const existingIdx = portfolio.positions.findIndex(p => p.assetName === assetName);
    if (existingIdx < 0) {
        return { portfolio, success: false, error: 'No position to sell' };
    }

    const existing = portfolio.positions[existingIdx];
    if (quantity > existing.quantity) {
        return { portfolio, success: false, error: 'Insufficient quantity' };
    }

    const newPortfolio = { ...portfolio };
    newPortfolio.cash = portfolio.cash + totalCost;
    newPortfolio.positions = [...portfolio.positions];

    if (quantity === existing.quantity) {
        // Close position entirely
        newPortfolio.positions.splice(existingIdx, 1);
    } else {
        newPortfolio.positions[existingIdx] = {
            ...existing,
            quantity: existing.quantity - quantity,
            currentPrice: price,
        };
    }

    newPortfolio.tradeHistory = [...portfolio.tradeHistory, {
        weekNumber, assetName, assetType, action, quantity, price, totalCost,
    }];

    return { portfolio: newPortfolio, success: true };
}

// ── Update Prices in Portfolio ─────────────────────────────
export function updatePortfolioPrices(
    portfolio: PlayerPortfolio,
    priceMap: Record<string, number>
): PlayerPortfolio {
    return {
        ...portfolio,
        positions: portfolio.positions.map(pos => ({
            ...pos,
            currentPrice: priceMap[pos.assetName] || pos.currentPrice,
        })),
    };
}

// ── Investigation System ───────────────────────────────────
export interface HiddenSignal {
    id: string;
    category: 'bank_exposure' | 'broker_activity' | 'insider_rumor' | 'regulatory_alert';
    title: string;
    description: string;
    revealedInfo: string;
    forceHint: Partial<MarketForces>;
    difficulty: number; // 1-3 tokens cost
    weekAvailable: number;
}

export interface InvestigationState {
    discoveredSignals: string[];
    investigationTokens: number;
}

export const DEFAULT_INVESTIGATION: InvestigationState = {
    discoveredSignals: [],
    investigationTokens: 25,
};

// ── Hidden Signals for Harshad Mehta Case ──────────────────
export const HARSHAD_SIGNALS: HiddenSignal[] = [
    // Week 1
    {
        id: 'sig-1-1', weekAvailable: 0, category: 'broker_activity', difficulty: 1,
        title: 'Unusual Broker Volume',
        description: 'Track the top broker by trading volume on BSE this week.',
        revealedInfo: 'One broker — Growmore Research — accounts for 12% of total BSE volume. Abnormally high. The broker is linked to Harshad Mehta.',
        forceHint: { leverage: 15 },
    },
    {
        id: 'sig-1-2', weekAvailable: 0, category: 'bank_exposure', difficulty: 1,
        title: 'SBI Treasury Report',
        description: 'Request SBI\'s latest inter-bank transaction summary.',
        revealedInfo: 'SBI has ₹200 crore in Ready Forward deals with no matching securities. The gap is unexplained.',
        forceHint: { regulationRisk: 10 },
    },
    // Week 2
    {
        id: 'sig-2-1', weekAvailable: 1, category: 'insider_rumor', difficulty: 1,
        title: 'Dalal Street Gossip',
        description: 'Talk to floor brokers about the "Big Bull" phenomenon.',
        revealedInfo: '"He\'s not using his own money. Banks are funding his trades through some backdoor." Most dismiss it as jealousy.',
        forceHint: { leverage: 20 },
    },
    {
        id: 'sig-2-2', weekAvailable: 1, category: 'bank_exposure', difficulty: 2,
        title: 'National Housing Bank Audit',
        description: 'Examine NHB\'s unexplained securities portfolio.',
        revealedInfo: '₹950 crore in Bank Receipts from Mehta\'s brokerage. Securities never delivered. This is enormous.',
        forceHint: { leverage: 25, regulationRisk: 15 },
    },
    // Week 3
    {
        id: 'sig-3-1', weekAvailable: 2, category: 'broker_activity', difficulty: 1,
        title: 'ACC Ownership Analysis',
        description: 'Who actually owns ACC shares at this price?',
        revealedInfo: 'Top 10 holders are all shell companies linked to one address in Worli. Circular ownership structure.',
        forceHint: { leverage: 30 },
    },
    {
        id: 'sig-3-2', weekAvailable: 2, category: 'regulatory_alert', difficulty: 2,
        title: 'RBI Internal Memo (Leaked)',
        description: 'A contact at RBI has a draft memo about "irregularities."',
        revealedInfo: 'RBI flagged ₹450 crore in irregular BR transactions. Memo was filed but NOT escalated. Someone suppressed it.',
        forceHint: { regulationRisk: 20 },
    },
    // Week 4
    {
        id: 'sig-4-1', weekAvailable: 3, category: 'insider_rumor', difficulty: 1,
        title: 'Institutional Exit Patterns',
        description: 'Monitor large sell orders this week.',
        revealedInfo: 'Three major FIIs and LIC have been net sellers for 10 days straight. Smart money is exiting.',
        forceHint: { institutionalFlow: -20 },
    },
    {
        id: 'sig-4-2', weekAvailable: 3, category: 'broker_activity', difficulty: 2,
        title: 'Mehta\'s Bank Accounts',
        description: 'Deep investigation into fund flows.',
        revealedInfo: 'Mehta is cycling money: Bank A → Fake BR → Cash → Buy Stocks → Use Stocks as Collateral → Get More Cash. The entire rally is funded by banking fraud.',
        forceHint: { leverage: 40, regulationRisk: 25 },
    },
    // Week 5
    {
        id: 'sig-5-1', weekAvailable: 4, category: 'regulatory_alert', difficulty: 1,
        title: 'Sucheta Dalal\'s Draft Article',
        description: 'A journalist friend hints at a major story.',
        revealedInfo: 'Times of India is about to publish a front-page exposé on ₹622 crore missing from SBI. This will break in 2 days.',
        forceHint: { regulationRisk: 40, sentiment: -30 },
    },
    // Week 7-8
    {
        id: 'sig-7-1', weekAvailable: 6, category: 'regulatory_alert', difficulty: 1,
        title: 'Janakiraman Committee Leaks',
        description: 'What are the investigators finding?',
        revealedInfo: 'Committee estimates total fraud at ₹5,000+ crore across 27 banks. SEBI will get full statutory powers. Markets need years to recover.',
        forceHint: { regulationRisk: 30 },
    },
    {
        id: 'sig-8-1', weekAvailable: 7, category: 'insider_rumor', difficulty: 1,
        title: 'Valuation Floor Analysis',
        description: 'Are stocks actually cheap now?',
        revealedInfo: 'HUL at 18x P/E (was 35x). SBI at 6x (was 15x). Quality stocks are genuinely undervalued. The scam is in the system, not the companies.',
        forceHint: { sentiment: 10 },
    },
];

// ── Conviction & Prediction ────────────────────────────────
export interface ConvictionBet {
    weekNumber: number;
    conviction: number;         // 1-5 stars
    prediction: 'bull' | 'bear' | 'flat';
    predictedLevel?: number;
    actualReturn?: number;
    pointsEarned?: number;
}

export function scoreConviction(bet: ConvictionBet, actualReturn: number): number {
    let correct = false;
    if (bet.prediction === 'bull' && actualReturn > 2) correct = true;
    if (bet.prediction === 'bear' && actualReturn < -2) correct = true;
    if (bet.prediction === 'flat' && Math.abs(actualReturn) <= 2) correct = true;

    if (correct) {
        return bet.conviction * 20; // 20-100 points
    } else {
        return -bet.conviction * 10; // -10 to -50 penalty
    }
}

// ── Risk Appetite ──────────────────────────────────────────
export type RiskAppetite = 'conservative' | 'balanced' | 'aggressive';

export function getRiskMultiplier(appetite: RiskAppetite): number {
    switch (appetite) {
        case 'conservative': return 0.6;
        case 'balanced': return 1.0;
        case 'aggressive': return 1.5;
    }
}

// ── Psychology Updates ─────────────────────────────────────
function clamp(v: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, v));
}

export function updatePsychology(
    psych: PlayerPsychology,
    weekReturn: number,
    bubbleScore: number,
    crashTriggered: boolean
): PlayerPsychology {
    let { greed, fear, confidence, patience } = psych;

    if (crashTriggered) {
        fear = clamp(fear + 30, 0, 100);
        greed = clamp(greed - 20, 0, 100);
        confidence = clamp(confidence - 15, 0, 100);
        patience = clamp(patience - 10, 0, 100);
    } else if (weekReturn > 5) {
        greed = clamp(greed + 10, 0, 100);
        fear = clamp(fear - 5, 0, 100);
        confidence = clamp(confidence + 5, 0, 100);
    } else if (weekReturn < -5) {
        fear = clamp(fear + 12, 0, 100);
        greed = clamp(greed - 8, 0, 100);
        confidence = clamp(confidence - 8, 0, 100);
    } else {
        // Gradual normalization
        greed = clamp(greed + (weekReturn > 0 ? 3 : -2), 0, 100);
        fear = clamp(fear + (weekReturn < 0 ? 3 : -2), 0, 100);
        patience = clamp(patience + 2, 0, 100);
    }

    // High bubble score increases greed and reduces patience
    if (bubbleScore > 60) {
        greed = clamp(greed + 3, 0, 100);
        patience = clamp(patience - 4, 0, 100);
    }

    return { greed, fear, confidence, patience };
}

// ── Strategy Identity Detection ────────────────────────────
export type StrategyIdentity =
    'momentum_trader' | 'value_investor' | 'contrarian' |
    'macro_investor' | 'panic_seller' | 'diamond_hands';

export function detectStrategyIdentity(
    tradeHistory: TradeAction[],
    portfolio: PlayerPortfolio,
    startingCapital: number
): StrategyIdentity {
    const buysInBull = tradeHistory.filter(t => t.action === 'buy' && t.weekNumber <= 4).length;
    const sellsInCrash = tradeHistory.filter(t => t.action === 'sell' && t.weekNumber >= 5).length;
    const buysInCrash = tradeHistory.filter(t => t.action === 'buy' && t.weekNumber >= 7).length;
    const totalTrades = tradeHistory.length;
    const cashRatio = portfolio.cash / getTotalPortfolioValue(portfolio);

    if (sellsInCrash > 3 && cashRatio > 0.7) return 'panic_seller';
    if (buysInCrash > 2) return 'contrarian';
    if (buysInBull > 4 && totalTrades > 8) return 'momentum_trader';
    if (totalTrades <= 3 && cashRatio < 0.3) return 'diamond_hands';
    if (cashRatio > 0.5) return 'macro_investor';
    return 'value_investor';
}

// ── Multiple Endings ───────────────────────────────────────
export type GameEnding =
    'bubble_rider' | 'quiet_survivor' | 'market_historian' |
    'panic_seller' | 'diamond_hands' | 'the_oracle' | 'the_gambler';

export interface EndingResult {
    ending: GameEnding;
    title: string;
    description: string;
    emoji: string;
}

export function determineEnding(
    portfolio: PlayerPortfolio,
    psychology: PlayerPsychology,
    predictions: ConvictionBet[],
    strategy: StrategyIdentity,
    startingCapital: number,
    signalsDiscovered: number,
    totalSignals: number
): EndingResult {
    const totalValue = getTotalPortfolioValue(portfolio);
    const plPercent = ((totalValue - startingCapital) / startingCapital) * 100;
    const predictionAccuracy = predictions.length > 0
        ? predictions.filter(p => (p.pointsEarned || 0) > 0).length / predictions.length
        : 0;
    const investigationRate = totalSignals > 0 ? signalsDiscovered / totalSignals : 0;

    // The Oracle — high prediction accuracy + discovered most signals
    if (predictionAccuracy > 0.7 && investigationRate > 0.6) {
        return {
            ending: 'the_oracle',
            title: 'The Oracle',
            emoji: '🔮',
            description: 'You saw through the illusion. Your investigation skills and market predictions were remarkably accurate. You understood the scam before most of Wall Street—err, Dalal Street.',
        };
    }

    // Market Historian — survived well + discovered many signals
    if (plPercent > -10 && investigationRate > 0.5) {
        return {
            ending: 'market_historian',
            title: 'Market Historian',
            emoji: '📚',
            description: 'You studied the market like a scholar. Your detective work uncovered the patterns, and your measured approach preserved capital. SEBI would hire you.',
        };
    }

    // Bubble Rider — made huge gains by riding the wave
    if (plPercent > 50) {
        return {
            ending: 'bubble_rider',
            title: 'Bubble Rider',
            emoji: '🏄',
            description: 'You rode the wave perfectly! You made money in the mania AND got out before the crash. Timing the market is usually impossible—but you did it.',
        };
    }

    // Quiet Survivor — minimal losses through conservative play
    if (plPercent > -5 && Math.abs(plPercent) < 15) {
        return {
            ending: 'quiet_survivor',
            title: 'Quiet Survivor',
            emoji: '🛡️',
            description: 'While others chased the Big Bull, you stayed disciplined. Your conservative approach meant you missed the highs but also the devastating crash. Boring is beautiful.',
        };
    }

    // Panic Seller — sold everything during crash
    if (strategy === 'panic_seller') {
        return {
            ending: 'panic_seller',
            title: 'Panic Seller',
            emoji: '😱',
            description: 'Fear took over. You sold at the worst possible time, crystallizing losses that would have partially recovered. The market punishes emotional decisions.',
        };
    }

    // Diamond Hands — held through everything
    if (strategy === 'diamond_hands') {
        return {
            ending: 'diamond_hands',
            title: 'Diamond Hands',
            emoji: '💎',
            description: plPercent > 0
                ? 'You held through the storm and came out stronger. Not everyone can stomach a 43% crash and hold. Your conviction paid off.'
                : 'You held through everything—including the crash. Sometimes conviction becomes stubbornness. Knowing when to let go is also a skill.',
        };
    }

    // The Gambler — high conviction bets with low accuracy
    if (predictions.filter(p => p.conviction >= 4).length > 3 && predictionAccuracy < 0.3) {
        return {
            ending: 'the_gambler',
            title: 'The Gambler',
            emoji: '🎲',
            description: 'You played with high conviction but low accuracy. The market humbled your predictions. Remember: confidence without research is just gambling.',
        };
    }

    // Default
    return {
        ending: 'quiet_survivor',
        title: 'Market Participant',
        emoji: '📊',
        description: `You navigated the 1992 crisis with a ${plPercent > 0 ? 'gain' : 'loss'} of ${Math.abs(plPercent).toFixed(1)}%. Every market cycle teaches something new.`,
    };
}
