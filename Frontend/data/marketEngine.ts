// ============================================================
// MARKET ENGINE — Dynamic Force-Driven Price Calculation
// Replaces static weeklyReturns with realistic market simulation
// ============================================================

// ── Market Forces ──────────────────────────────────────────
export interface MarketForces {
    liquidity: number;          // 0-100: money flowing into markets
    sentiment: number;          // -100 to +100: bearish to bullish
    leverage: number;           // 0-100: margin/fraud amplification
    institutionalFlow: number;  // -100 to +100: net FII/DII flow
    regulationRisk: number;     // 0-100: regulator proximity
    mediaHype: number;          // 0-100: coverage intensity
}

export type ForceModifiers = Partial<MarketForces>;

// ── Asset Configuration ────────────────────────────────────
export interface AssetConfig {
    name: string;
    type: 'stock' | 'bond' | 'gold' | 'cash' | 'index';
    basePrice: number;             // Starting price
    sentimentBeta: number;         // Sensitivity to sentiment (-1 to +3)
    leverageBeta: number;          // Sensitivity to leverage (0 to +2)
    liquidityBeta: number;         // Sensitivity to liquidity (0 to +1)
    crashSeverity: number;         // How hard it falls in crash (0-1)
    volatility: number;            // Random noise factor (0-0.5)
    safeHaven: boolean;            // Inversely correlated in crashes?
    historicalContext?: string;
}

// ── Asset Return (per-week output) ─────────────────────────
export interface AssetReturn {
    name: string;
    type: string;
    previousPrice: number;
    currentPrice: number;
    weeklyReturnPct: number;
}

// ── Defaults ───────────────────────────────────────────────
export const DEFAULT_FORCES: MarketForces = {
    liquidity: 55,
    sentiment: 30,
    leverage: 20,
    institutionalFlow: 15,
    regulationRisk: 10,
    mediaHype: 25,
};

// ── Harshad Mehta Asset Configs ────────────────────────────
export const HARSHAD_ASSETS: AssetConfig[] = [
    {
        name: 'ACC Cement',
        type: 'stock',
        basePrice: 200,
        sentimentBeta: 2.8,
        leverageBeta: 1.8,
        liquidityBeta: 0.9,
        crashSeverity: 0.85,
        volatility: 0.35,
        safeHaven: false,
        historicalContext: 'Mehta\'s favorite. Manipulated from ₹200 to ₹9,000 on no fundamentals.',
    },
    {
        name: 'Apollo Tyres',
        type: 'stock',
        basePrice: 40,
        sentimentBeta: 2.2,
        leverageBeta: 1.5,
        liquidityBeta: 0.8,
        crashSeverity: 0.75,
        volatility: 0.30,
        safeHaven: false,
        historicalContext: 'Another Mehta target. ₹40 → ₹1,100. Sound company destroyed by association.',
    },
    {
        name: 'Videocon',
        type: 'stock',
        basePrice: 35,
        sentimentBeta: 2.5,
        leverageBeta: 1.7,
        liquidityBeta: 0.85,
        crashSeverity: 0.80,
        volatility: 0.32,
        safeHaven: false,
        historicalContext: 'Infrastructure "new India" story weaponized. ₹35 → ₹1,200.',
    },
    {
        name: 'SBI & Banking',
        type: 'stock',
        basePrice: 150,
        sentimentBeta: 1.5,
        leverageBeta: 1.2,
        liquidityBeta: 0.7,
        crashSeverity: 0.60,
        volatility: 0.25,
        safeHaven: false,
        historicalContext: 'Banks benefited from cheap credit, collapsed when exposure emerged.',
    },
    {
        name: 'BSE Sensex',
        type: 'index',
        basePrice: 1000,
        sentimentBeta: 1.0,
        leverageBeta: 0.8,
        liquidityBeta: 0.6,
        crashSeverity: 0.50,
        volatility: 0.15,
        safeHaven: false,
        historicalContext: '1,000 → 4,467 → 2,529 in 18 months.',
    },
    {
        name: 'FMCG (HUL, ITC)',
        type: 'stock',
        basePrice: 280,
        sentimentBeta: 0.3,
        leverageBeta: 0.1,
        liquidityBeta: 0.2,
        crashSeverity: 0.15,
        volatility: 0.08,
        safeHaven: false,
        historicalContext: 'Boring but stable. The "unsexy" survivors of the crash.',
    },
    {
        name: 'Govt Securities (10Y)',
        type: 'bond',
        basePrice: 100,
        sentimentBeta: -0.2,
        leverageBeta: -0.1,
        liquidityBeta: 0.05,
        crashSeverity: -0.05, // Gains during crash
        volatility: 0.03,
        safeHaven: true,
        historicalContext: 'Yield ~11-12%. Safe haven. Ironically, the instrument Mehta forged.',
    },
    {
        name: 'Gold',
        type: 'gold',
        basePrice: 4200,
        sentimentBeta: -0.15,
        leverageBeta: -0.05,
        liquidityBeta: 0.1,
        crashSeverity: -0.10, // Gains during crash
        volatility: 0.05,
        safeHaven: true,
        historicalContext: '₹4,200/10g. India pledged 67 tonnes to IMF in 1991—gold was precious.',
    },
    {
        name: 'Fixed Deposits',
        type: 'cash',
        basePrice: 100,
        sentimentBeta: 0,
        leverageBeta: 0,
        liquidityBeta: 0,
        crashSeverity: 0,
        volatility: 0,
        safeHaven: true,
        historicalContext: 'FD rates ~12% p.a. Boring but guaranteed.',
    },
];

// ── Clamp utility ──────────────────────────────────────────
function clamp(val: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, val));
}

// ── Seeded pseudo-random for reproducible outcomes ─────────
function seededRandom(seed: number): number {
    const x = Math.sin(seed * 9301 + 49297) * 49297;
    return x - Math.floor(x);
}

// ── Calculate Bubble Score ─────────────────────────────────
export function calculateBubbleScore(forces: MarketForces): number {
    // Weighted combination of danger signals
    const score =
        forces.leverage * 0.30 +
        clamp(forces.sentiment, 0, 100) * 0.25 +
        forces.mediaHype * 0.15 +
        forces.liquidity * 0.10 +
        (100 - forces.regulationRisk) * 0.10 +  // LOW regulation = more bubble
        clamp(forces.institutionalFlow, 0, 100) * 0.10;

    return clamp(Math.round(score), 0, 100);
}

// ── Calculate Crash Probability ────────────────────────────
export function calculateCrashProbability(
    bubbleScore: number,
    weekNumber: number,
    regulationRisk: number
): number {
    // Base probability from bubble score
    let prob = (bubbleScore / 100) * 0.4;

    // Time escalation — after week 4, probability ramps
    if (weekNumber >= 5) {
        prob += (weekNumber - 4) * 0.08;
    }

    // Regulation risk amplifies crash probability
    if (regulationRisk > 60) {
        prob += (regulationRisk - 60) * 0.008;
    }

    return clamp(prob, 0, 0.95);
}

// ── Calculate Weekly Returns for All Assets ────────────────
export function calculateWeeklyReturns(
    forces: MarketForces,
    assets: AssetConfig[],
    currentPrices: number[],
    crashTriggered: boolean,
    weekNumber: number
): AssetReturn[] {
    return assets.map((asset, idx) => {
        const prevPrice = currentPrices[idx];
        let returnPct: number;

        if (asset.type === 'cash') {
            // Fixed deposits: ~0.23% per week (12% annual)
            returnPct = 0.23;
        } else if (crashTriggered) {
            // Crash scenario
            if (asset.safeHaven) {
                // Safe havens gain during crash
                returnPct = Math.abs(asset.crashSeverity) * 5 +
                    seededRandom(weekNumber * 100 + idx) * 2;
            } else {
                // Risk assets crash proportional to severity
                const crashMagnitude = -15 - (asset.crashSeverity * 30);
                const noise = (seededRandom(weekNumber * 100 + idx) - 0.5) * 5;
                returnPct = crashMagnitude + noise;
            }
        } else {
            // Normal week — force-driven returns
            const sentimentEffect = (forces.sentiment / 100) * asset.sentimentBeta * 3;
            const leverageEffect = (forces.leverage / 100) * asset.leverageBeta * 2;
            const liquidityEffect = (forces.liquidity / 100) * asset.liquidityBeta * 1.5;
            const institutionalEffect = (forces.institutionalFlow / 100) * 0.5;

            // Random noise
            const noise = (seededRandom(weekNumber * 100 + idx) - 0.5) * asset.volatility * 10;

            returnPct = sentimentEffect + leverageEffect + liquidityEffect + institutionalEffect + noise;

            // Safe haven inverse correlation in high-sentiment weeks
            if (asset.safeHaven && forces.sentiment > 50) {
                returnPct *= 0.3; // Reduced gains when markets are euphoric
            }
        }

        const newPrice = Math.round(prevPrice * (1 + returnPct / 100));

        return {
            name: asset.name,
            type: asset.type,
            previousPrice: prevPrice,
            currentPrice: Math.max(1, newPrice),
            weeklyReturnPct: Math.round(returnPct * 100) / 100,
        };
    });
}

// ── Apply Event Impact to Forces ───────────────────────────
export function applyEventImpact(
    forces: MarketForces,
    modifiers: ForceModifiers
): MarketForces {
    return {
        liquidity: clamp(forces.liquidity + (modifiers.liquidity || 0), 0, 100),
        sentiment: clamp(forces.sentiment + (modifiers.sentiment || 0), -100, 100),
        leverage: clamp(forces.leverage + (modifiers.leverage || 0), 0, 100),
        institutionalFlow: clamp(forces.institutionalFlow + (modifiers.institutionalFlow || 0), -100, 100),
        regulationRisk: clamp(forces.regulationRisk + (modifiers.regulationRisk || 0), 0, 100),
        mediaHype: clamp(forces.mediaHype + (modifiers.mediaHype || 0), 0, 100),
    };
}

// ── Apply Multiple Modifiers Sequentially ──────────────────
export function applyAllModifiers(
    forces: MarketForces,
    modifiers: ForceModifiers[]
): MarketForces {
    return modifiers.reduce((f: MarketForces, m: ForceModifiers) => applyEventImpact(f, m), forces);
}

// ── Sensex Level from Forces ───────────────────────────────
export function estimateSensexLevel(
    baseSensex: number,
    forces: MarketForces,
    weekNumber: number,
    crashTriggered: boolean
): number {
    if (crashTriggered) {
        // Major drop
        return Math.round(baseSensex * (0.55 + seededRandom(weekNumber) * 0.1));
    }

    const growthFactor =
        1 +
        (forces.sentiment / 100) * 0.15 +
        (forces.leverage / 100) * 0.10 +
        (forces.liquidity / 100) * 0.05;

    return Math.round(baseSensex * growthFactor);
}
