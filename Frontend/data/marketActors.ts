// ============================================================
// MARKET ACTORS — AI Participants That Influence Market Forces
// Each actor reacts to the current state and modifies forces
// ============================================================

import { MarketForces, ForceModifiers } from './marketEngine';

// ── Actor Interface ────────────────────────────────────────
export interface MarketActor {
    name: string;
    type: 'retail' | 'institutional' | 'broker' | 'regulator' | 'media';
    emoji: string;
    description: string;
    getBehavior: (forces: MarketForces, week: number, crashTriggered: boolean) => ForceModifiers;
}

// ── Harshad Mehta Case Actors ──────────────────────────────

const retailInvestors: MarketActor = {
    name: 'Retail Investors',
    type: 'retail',
    emoji: '👥',
    description: 'Follow momentum. Buy when everyone\'s buying, panic when it crashes.',
    getBehavior: (forces, week, crashTriggered) => {
        if (crashTriggered) {
            // Panic selling
            return {
                sentiment: -15,
                liquidity: -10,
            };
        }
        if (forces.sentiment > 50) {
            // FOMO buying — amplify the mania
            return {
                sentiment: Math.min(8, forces.sentiment * 0.08),
                liquidity: 5,
                mediaHype: 3,
            };
        }
        if (forces.sentiment < -20) {
            // Fear — withdraw
            return {
                sentiment: -5,
                liquidity: -5,
            };
        }
        return { sentiment: 2, liquidity: 2 };
    },
};

const harshadMehta: MarketActor = {
    name: 'Harshad Mehta',
    type: 'broker',
    emoji: '🐂',
    description: 'The Big Bull. Pumps leverage via fake BRs. Vanishes after exposé.',
    getBehavior: (forces, week, crashTriggered) => {
        if (crashTriggered || week >= 5) {
            // After exposé, Mehta's leverage machine stops
            return {
                leverage: -15,
                sentiment: -5,
            };
        }
        if (week <= 2) {
            // Early accumulation phase
            return {
                leverage: 8,
                sentiment: 5,
                liquidity: 6,
            };
        }
        if (week <= 4) {
            // Peak manipulation — maximum leverage injection
            return {
                leverage: 12,
                sentiment: 8,
                liquidity: 10,
                mediaHype: 5,
            };
        }
        return {};
    },
};

const licUti: MarketActor = {
    name: 'LIC / UTI',
    type: 'institutional',
    emoji: '🏛️',
    description: 'Cautious institutional players. Sell at peaks, buy at bottoms.',
    getBehavior: (forces, week, crashTriggered) => {
        if (crashTriggered) {
            // Institutions buy the panic (value hunting)
            return {
                institutionalFlow: 10,
                sentiment: 3,
            };
        }
        if (forces.sentiment > 60 && forces.leverage > 50) {
            // Smart money exits at peak
            return {
                institutionalFlow: -12,
                sentiment: -3,
            };
        }
        if (week >= 8) {
            // Post-crash accumulation
            return {
                institutionalFlow: 8,
                sentiment: 2,
            };
        }
        // Normal operation
        return {
            institutionalFlow: 3,
        };
    },
};

const sebiRbi: MarketActor = {
    name: 'SEBI / RBI',
    type: 'regulator',
    emoji: '⚖️',
    description: 'Regulators. Slow to act, but devastating when they do.',
    getBehavior: (forces, week, crashTriggered) => {
        if (week >= 5) {
            // Post-exposé: aggressive regulatory action
            return {
                regulationRisk: 15,
                leverage: -8,
                sentiment: -5,
            };
        }
        if (forces.leverage > 60 && week >= 3) {
            // Starting to notice anomalies
            return {
                regulationRisk: 5,
            };
        }
        // Asleep early on
        return {
            regulationRisk: 1,
        };
    },
};

const media: MarketActor = {
    name: 'Business Media',
    type: 'media',
    emoji: '📰',
    description: 'Amplifies both euphoria and panic. "Big Bull" stories drive mania.',
    getBehavior: (forces, week, crashTriggered) => {
        if (crashTriggered) {
            // Panic headlines amplify fear
            return {
                mediaHype: 15,
                sentiment: -10,
            };
        }
        if (forces.sentiment > 40 && week <= 4) {
            // Hype stories about "New India" and Mehta's genius
            return {
                mediaHype: 8,
                sentiment: 4,
            };
        }
        if (week === 5) {
            // Sucheta Dalal's exposé
            return {
                mediaHype: 25,
                sentiment: -20,
                regulationRisk: 10,
            };
        }
        return { mediaHype: 2 };
    },
};

// ── Export All Actors ──────────────────────────────────────
export const HARSHAD_ACTORS: MarketActor[] = [
    retailInvestors,
    harshadMehta,
    licUti,
    sebiRbi,
    media,
];

// ── Process All Actor Behaviors ────────────────────────────
export function getAllActorModifiers(
    actors: MarketActor[],
    forces: MarketForces,
    week: number,
    crashTriggered: boolean
): ForceModifiers[] {
    return actors.map(actor => actor.getBehavior(forces, week, crashTriggered));
}

// ── Get narrative summary of actor behavior this week ──────
export function getActorNarrative(
    actors: MarketActor[],
    forces: MarketForces,
    week: number,
    crashTriggered: boolean
): string[] {
    const narratives: string[] = [];

    actors.forEach(actor => {
        const mods = actor.getBehavior(forces, week, crashTriggered);
        const totalImpact = Object.values(mods).reduce((sum, v) => sum + Math.abs(v || 0), 0);

        if (totalImpact > 5) {
            let action = '';
            if (actor.type === 'retail') {
                action = (mods.sentiment || 0) > 0
                    ? 'Retail investors are piling in with FOMO buying'
                    : 'Retail investors are panic-selling positions';
            } else if (actor.type === 'broker') {
                action = (mods.leverage || 0) > 0
                    ? 'Harshad Mehta is injecting leverage via fake BRs'
                    : 'Mehta\'s leverage machine has been shut down';
            } else if (actor.type === 'institutional') {
                action = (mods.institutionalFlow || 0) > 0
                    ? 'LIC/UTI are quietly accumulating positions'
                    : 'Institutional money is exiting the market';
            } else if (actor.type === 'regulator') {
                action = (mods.regulationRisk || 0) > 5
                    ? 'SEBI/RBI launching investigations'
                    : 'Regulators are starting to take notice';
            } else if (actor.type === 'media') {
                action = (mods.sentiment || 0) > 0
                    ? 'Media running "Big Bull genius" cover stories'
                    : 'Media amplifying scam headlines and panic';
            }
            if (action) narratives.push(`${actor.emoji} ${action}`);
        }
    });

    return narratives;
}
