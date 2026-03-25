// ============================================================
// ENHANCED: Harshad Mehta Securities Scam (1992)
// Historically Accurate with Real Data & Extended Timeline
// ============================================================

export interface AssetPerformance {
    name: string;
    type: 'stock' | 'bond' | 'gold' | 'cash' | 'index';
    weeklyReturns: number[]; // % change per week
    peakReturn: number;
    finalReturn: number;
    historicalContext?: string; // Additional context
}

export interface DecisionOption {
    id: string;
    label: string;
    description: string;
    icon: string;
    impact: Record<string, number>;
    riskScore: number;
}

export interface TimelineEvent {
    id: string;
    text: string;
    type: 'news' | 'warning' | 'breaking' | 'positive' | 'neutral';
    marketImpact: number;
    historicalDate?: string; // Actual date from history
}

export interface SimulationWeek {
    title: string;
    subtitle: string;
    events: TimelineEvent[];
    decision?: {
        prompt: string;
        options: DecisionOption[];
    };
    marketData?: {
        sensexLevel: number;
        volumeCrore: number;
        breadth: string; // "Strong" | "Weak" | "Mixed"
    };
}

export interface SimulationCase {
    id: string;
    title: string;
    subtitle: string;
    description: string;
    year: number;
    duration: string;
    difficulty: number;
    difficultyLabel: string;
    iconName: string;
    accentColor: string;
    startingCapital: string;
    startingCapitalNum: number;
    currency: string;
    context: string;
    historicalBackground: string;
    assets: AssetPerformance[];
    timeline: SimulationWeek[];
    learningObjectives: string[];
    tags: string[];
    keyFigures: {
        name: string;
        role: string;
        bio: string;
    }[];
    aftermath: string;
}

// ============================================================
// HARSHAD MEHTA SCAM — ENHANCED WITH REAL DATA
// ============================================================

const harshadMehtaEnhanced: SimulationCase = {
    id: 'harshad-mehta-1992-enhanced',
    title: 'The Big Bull Scam',
    subtitle: 'Harshad Mehta Securities Fraud (1991-1992)',
    description: "Navigate India's first mega stock market scam with historically accurate data. ₹5,000 crore fraud through bank receipt manipulation. Sensex journey: 1,000 → 4,467 → 2,529 over 18 months.",
    year: 1992,
    duration: '10 weeks',
    difficulty: 3,
    difficultyLabel: 'Medium',
    iconName: 'TrendingDown',
    accentColor: '#F59E0B',
    startingCapital: '₹10,00,000',
    startingCapitalNum: 1000000,
    currency: '₹',

    context: `It's April 1991. India is on the brink of bankruptcy with foreign reserves of just $1 billion—barely enough for 3 weeks of imports. PM Narasimha Rao and Finance Minister Manmohan Singh launch historic economic liberalization. Markets sense opportunity.
    
Enter Harshad Mehta—a Kandivali-based broker who discovered a loophole in the banking system. Using Ready Forward (RF) deals and fake Bank Receipts (BRs), he siphons money from banks into stocks, creating artificial demand.`,

    historicalBackground: `THE SCAM MECHANICS:
    
1. **The RF Deal Loophole**: Banks used Ready Forward deals to lend money to each other using government securities as collateral. Settlement took 15 days—creating a gap Mehta exploited.

2. **The Fake BR Scheme**: Mehta would get a bank to issue a Bank Receipt for securities he never delivered. He'd use this BR as collateral to get cash from another bank, which he'd pump into stocks.

3. **The Circular Game**: He'd use rising stock prices as proof of his "Midas touch" to get more BRs from banks, creating a self-reinforcing cycle.

4. **The Scale**: At peak, Mehta controlled the broking operations of at least 90 institutions across India. Total fraud: ₹5,000 crore (equivalent to ~₹1.2 lakh crore in 2024 values).

5. **The Fall**: Journalist Sucheta Dalal exposed irregularities at State Bank of India on April 23, 1992. The house of cards collapsed within weeks.`,

    keyFigures: [
        {
            name: 'Harshad Shantilal Mehta',
            role: 'The Big Bull',
            bio: 'Born in 1954 in a Gujarati middle-class family. Started as a jobber (floor trader) at BSE in 1980. By 1990, operating from a 15,000 sq ft office in Worli. Known for Lexus cars, lavish lifestyle, and aggressive stock buying. Arrested on November 9, 1992. Died in Tihar Jail (2001) during trial—never convicted.'
        },
        {
            name: 'Sucheta Dalal',
            role: 'Investigative Journalist',
            bio: 'Times of India journalist who broke the story on April 23, 1992. Her investigation uncovered ₹622 crore missing from SBI alone. Won multiple awards for financial journalism. Later co-founded Moneylife Foundation.'
        },
        {
            name: 'S. Venkitaramanan',
            role: 'RBI Governor',
            bio: 'RBI Governor (1990-92) who resigned after the scam. Later revealed that Mehta had threatened to expose other prominent people if investigated. Criticized for regulatory inaction.'
        },
        {
            name: 'Dr. Manmohan Singh',
            role: 'Finance Minister',
            bio: 'Architect of 1991 liberalization. The scam happened just as reforms were gaining momentum. Used the crisis to strengthen SEBI (gave it statutory powers in 1992) and banking regulations.'
        }
    ],

    assets: [
        {
            name: 'ACC Cement',
            type: 'stock',
            weeklyReturns: [8, 12, 18, 22, 15, 8, -5, -12, -42, -38],
            peakReturn: 350, // From ₹200 to ₹9,000 peak
            finalReturn: -68, // From ₹200 to ~₹650 after crash
            historicalContext: 'Mehta\'s favorite stock. Price manipulated from ₹200 (Jan 1991) to ₹9,000 (Apr 1992) on NO fundamental change. Post-crash settled around ₹650-800. Classic pump-and-dump.'
        },
        {
            name: 'Apollo Tyres',
            type: 'stock',
            weeklyReturns: [10, 14, 16, 12, 8, 5, -8, -18, -35, -28],
            peakReturn: 280,
            finalReturn: -58,
            historicalContext: 'Another Mehta target. Went from ₹40 to ₹1,100+. Fundamentally sound company destroyed by association with the scam.'
        },
        {
            name: 'Videocon',
            type: 'stock',
            weeklyReturns: [12, 16, 20, 18, 10, 6, -10, -22, -40, -32],
            peakReturn: 310,
            finalReturn: -62,
            historicalContext: 'Dhirubhai Ambani-linked stock. Mehta pushed it from ₹35 to ₹1,200. Classic "new India" infrastructure story that got weaponized.'
        },
        {
            name: 'SBI & Banking Index',
            type: 'stock',
            weeklyReturns: [6, 10, 14, 12, 8, 3, -6, -15, -28, -25],
            peakReturn: 145,
            finalReturn: -48,
            historicalContext: 'Bank stocks benefited early (cheap credit) then collapsed when their exposure became clear. SBI lost ₹622 cr, National Housing Bank ₹950 cr.'
        },
        {
            name: 'BSE Sensex',
            type: 'index',
            weeklyReturns: [4, 6, 8, 7, 5, 2, -3, -10, -18, -16],
            peakReturn: 78, // 1,000 to 4,467 = +347%, weekly avg shown
            finalReturn: -32, // 4,467 to 2,529 = -43% crash, net +153% from start
            historicalContext: 'Rose from 1,000 (Apr 1991) to 4,467 (Apr 18, 1992). Crashed to 2,529 by Jun 1992. The fastest bull run and crash India had seen.'
        },
        {
            name: 'FMCG Defensives (HUL, ITC, Britannia)',
            type: 'stock',
            weeklyReturns: [2, 3, 4, 3, 2, 1, 0, -5, -8, -6],
            peakReturn: 18,
            finalReturn: -6,
            historicalContext: 'Boring but stable. HUL went from ₹280 to ₹340 (+21%). Didn\'t participate in mania, didn\'t crash hard. The "unsexy" survivors.'
        },
        {
            name: 'Government Securities (10Y)',
            type: 'bond',
            weeklyReturns: [0.25, 0.3, 0.3, 0.35, 0.35, 0.4, 0.4, 0.5, 0.6, 0.5],
            peakReturn: 3.75,
            finalReturn: 3.75,
            historicalContext: 'Yield ~11-12% in this period. Safe haven during crash. Ironically, these were the securities Mehta forged in his BR scam.'
        },
        {
            name: 'Gold (MCX equivalent)',
            type: 'gold',
            weeklyReturns: [0.3, 0.4, 0.5, 0.8, 1.0, 1.2, 1.5, 2.0, 2.5, 2.0],
            peakReturn: 12.2,
            finalReturn: 12.2,
            historicalContext: 'Gold at ~₹4,200/10g (1991) rose to ~₹4,700/10g (mid-1992). Safe haven during crisis. India had just pledged 67 tonnes to IMF in 1991—gold was scarce and precious.'
        },
        {
            name: 'Fixed Deposits (Public Sector Banks)',
            type: 'cash',
            weeklyReturns: [0.23, 0.23, 0.23, 0.23, 0.23, 0.23, 0.23, 0.23, 0.23, 0.23],
            peakReturn: 2.3,
            finalReturn: 2.3,
            historicalContext: 'FD rates ~12% p.a. in 1991-92. Boring but guaranteed. Those who stayed here missed the ride up—and the crash down.'
        }
    ],

    timeline: [
        // ==================== WEEK 1 ====================
        {
            title: 'Week 1: Liberalization Euphoria',
            subtitle: 'April 1991 — India opens up, markets celebrate',
            events: [
                {
                    id: 'hm-1-1',
                    text: 'Budget 1991 presented. Import restrictions eased, FDI encouraged. Sensex crosses 1,200 for first time.',
                    type: 'positive',
                    marketImpact: 4,
                    historicalDate: 'July 24, 1991'
                },
                {
                    id: 'hm-1-2',
                    text: 'Harshad Mehta starts accumulating ACC Cement heavily. Stock up 8% this week on "institutional buying."',
                    type: 'news',
                    marketImpact: 3,
                },
                {
                    id: 'hm-1-3',
                    text: 'Rupee devalued by 18% to boost exports. Markets initially nervous but recover on reform optimism.',
                    type: 'neutral',
                    marketImpact: 1,
                    historicalDate: 'July 1-3, 1991'
                },
                {
                    id: 'hm-1-4',
                    text: 'RBI quietly notes unusual inter-bank RF transactions worth ₹200 crore. No action taken.',
                    type: 'neutral',
                    marketImpact: 0,
                }
            ],
            decision: {
                prompt: 'India is opening up after decades of socialism. "License Raj" is dying. Sensex has crossed 1,200. Your neighbor quit his job to trade full-time. Is this the start of something big?',
                options: [
                    {
                        id: 'hm-d1-a',
                        label: 'New India = New Era',
                        description: 'Go heavy into reform beneficiaries—ACC, Apollo, Videocon. This is a structural bull market.',
                        icon: 'Rocket',
                        impact: { stock: 65, index: 20, bond: 5, gold: 5, cash: 5 },
                        riskScore: 7
                    },
                    {
                        id: 'hm-d1-b',
                        label: 'Cautiously Optimistic',
                        description: 'Participate via Sensex + quality stocks. Keep 30% defensive (bonds, gold, FD).',
                        icon: 'Scale',
                        impact: { stock: 35, index: 25, bond: 15, gold: 15, cash: 10 },
                        riskScore: 4
                    },
                    {
                        id: 'hm-d1-c',
                        label: 'Too Fast, Too Soon',
                        description: 'India nearly went bankrupt 3 months ago. This rally is premature. Stay conservative.',
                        icon: 'Shield',
                        impact: { stock: 15, index: 10, bond: 30, gold: 30, cash: 15 },
                        riskScore: 2
                    }
                ]
            },
            marketData: {
                sensexLevel: 1247,
                volumeCrore: 45,
                breadth: 'Strong'
            }
        },

        // ==================== WEEK 2 ====================
        {
            title: 'Week 2: The Midas Touch Emerges',
            subtitle: 'September 1991 — "Big Bull" narrative begins',
            events: [
                {
                    id: 'hm-2-1',
                    text: 'Harshad Mehta profiled in Business India magazine as "The Raging Bull." Claims special insight into India\'s future.',
                    type: 'news',
                    marketImpact: 3,
                    historicalDate: 'September 1991'
                },
                {
                    id: 'hm-2-2',
                    text: 'ACC crosses ₹1,000 (from ₹200 in Jan). No earnings announcement, no expansion plan. Just buying pressure.',
                    type: 'warning',
                    marketImpact: 4,
                },
                {
                    id: 'hm-2-3',
                    text: 'Sensex crosses 1,500. FII registration process announced—foreign money coming soon.',
                    type: 'positive',
                    marketImpact: 3,
                    historicalDate: 'September 14, 1991'
                },
                {
                    id: 'hm-2-4',
                    text: 'Mehta spotted arriving at BSE in a brand new Toyota Lexus worth ₹45 lakh. Crowd gathers to see "India\'s Buffett."',
                    type: 'news',
                    marketImpact: 1,
                }
            ],
            decision: {
                prompt: 'ACC has gone from ₹200 to ₹1,000 in 8 months—a 5x return. Harshad Mehta is on magazine covers. Your portfolio is up 35%. Do you chase or book profits?',
                options: [
                    {
                        id: 'hm-d2-a',
                        label: 'Follow The Big Bull',
                        description: 'He clearly knows something we don\'t. Add to ACC, Apollo, Videocon positions.',
                        icon: 'Flame',
                        impact: { stock: 75, index: 15, bond: 3, gold: 5, cash: 2 },
                        riskScore: 9
                    },
                    {
                        id: 'hm-d2-b',
                        label: 'Book Partial Profits',
                        description: 'Take 40% off table. Let rest ride. Move profits to bonds and gold.',
                        icon: 'Banknote',
                        impact: { stock: 30, index: 15, bond: 25, gold: 20, cash: 10 },
                        riskScore: 3
                    },
                    {
                        id: 'hm-d2-c',
                        label: 'Rotate to Quality',
                        description: 'Sell Mehta stocks. Buy defensives like HUL, ITC. Lower beta, sleep better.',
                        icon: 'RefreshCw',
                        impact: { stock: 40, index: 20, bond: 20, gold: 10, cash: 10 },
                        riskScore: 4
                    }
                ]
            },
            marketData: {
                sensexLevel: 1580,
                volumeCrore: 68,
                breadth: 'Strong'
            }
        },

        // ==================== WEEK 3 ====================
        {
            title: 'Week 3: Mania Takes Hold',
            subtitle: 'December 1991 — Retail investors flood in',
            events: [
                {
                    id: 'hm-3-1',
                    text: 'Sensex crosses 2,000. Doubled in 6 months. Newspapers call it "India\'s Stock Market Miracle."',
                    type: 'positive',
                    marketImpact: 4,
                    historicalDate: 'December 1991'
                },
                {
                    id: 'hm-3-2',
                    text: 'Demat account openings surge 400%. First-time investors include taxi drivers, paan shop owners, college students.',
                    type: 'warning',
                    marketImpact: 2,
                },
                {
                    id: 'hm-3-3',
                    text: 'Apollo Tyres hits ₹1,100 (from ₹40). Videocon at ₹1,200 (from ₹35). P/E ratios above 100x. "New economy" logic.',
                    type: 'warning',
                    marketImpact: 3,
                },
                {
                    id: 'hm-3-4',
                    text: 'RBI internal audit flags ₹450 crore in irregular BR transactions across multiple banks. Filed but not escalated.',
                    type: 'neutral',
                    marketImpact: 0,
                }
            ],
            decision: {
                prompt: 'Your taxi driver just told you about his 300% gains in Apollo Tyres. Your maid is asking for stock tips. This is either the new India or classic bubble psychology. Which is it?',
                options: [
                    {
                        id: 'hm-d3-a',
                        label: 'Taxi Driver Indicator = SELL',
                        description: 'When your taxi driver gives stock tips, it\'s time to exit. Go 70% defensive immediately.',
                        icon: 'AlertOctagon',
                        impact: { stock: 15, index: 10, bond: 30, gold: 30, cash: 15 },
                        riskScore: 1
                    },
                    {
                        id: 'hm-d3-b',
                        label: 'This Time It\'s Different',
                        description: 'India democratizing = mass retail participation. This is healthy. Stay invested.',
                        icon: 'Users',
                        impact: { stock: 70, index: 20, bond: 5, gold: 3, cash: 2 },
                        riskScore: 9
                    },
                    {
                        id: 'hm-d3-c',
                        label: 'Reduce but Don\'t Exit',
                        description: 'Trim by 30%. Keep quality names. Avoid the most frothy stocks.',
                        icon: 'Scissors',
                        impact: { stock: 35, index: 20, bond: 20, gold: 15, cash: 10 },
                        riskScore: 5
                    }
                ]
            },
            marketData: {
                sensexLevel: 2095,
                volumeCrore: 125,
                breadth: 'Mixed'
            }
        },

        // ==================== WEEK 4 ====================
        {
            title: 'Week 4: The Peak',
            subtitle: 'March-April 1992 — Euphoria reaches maximum',
            events: [
                {
                    id: 'hm-4-1',
                    text: 'ACC hits ₹9,000—a 44x return from ₹200. Market cap larger than L&T despite 1/10th the revenue.',
                    type: 'breaking',
                    marketImpact: 4,
                    historicalDate: 'April 1992'
                },
                {
                    id: 'hm-4-2',
                    text: 'Sensex touches 4,467 on April 18, 1992. The all-time high. Up 346% in 12 months.',
                    type: 'positive',
                    marketImpact: 5,
                    historicalDate: 'April 18, 1992'
                },
                {
                    id: 'hm-4-3',
                    text: 'Mehta appears on Doordarshan. Says "Indian stocks will rival Japanese companies soon." Audience claps.',
                    type: 'news',
                    marketImpact: 2,
                },
                {
                    id: 'hm-4-4',
                    text: 'Smart money quietly exits. Institutional volumes dropping. Breadth narrowing to just Mehta stocks.',
                    type: 'warning',
                    marketImpact: -1,
                }
            ],
            decision: {
                prompt: 'Sensex at 4,467. Your portfolio up 250%. ACC at ₹9,000. But volumes are falling and only retail is buying. The top feels close. What do you do?',
                options: [
                    {
                        id: 'hm-d4-a',
                        label: 'Ring The Register',
                        description: 'Sell 80% of equity. Lock in gains. Move to gold, bonds, and FDs.',
                        icon: 'Bell',
                        impact: { stock: 10, index: 5, bond: 35, gold: 30, cash: 20 },
                        riskScore: 1
                    },
                    {
                        id: 'hm-d4-b',
                        label: 'One Last Push',
                        description: 'Markets can stay irrational longer than you can stay solvent—but not THIS irrational. Hold 2 more weeks.',
                        icon: 'Timer',
                        impact: { stock: 60, index: 25, bond: 10, gold: 3, cash: 2 },
                        riskScore: 8
                    },
                    {
                        id: 'hm-d4-c',
                        label: 'Systematic Exit',
                        description: 'Sell 15% per week for next month. Gradual derisking without trying to time the exact top.',
                        icon: 'TrendingDown',
                        impact: { stock: 35, index: 15, bond: 25, gold: 15, cash: 10 },
                        riskScore: 4
                    }
                ]
            },
            marketData: {
                sensexLevel: 4467,
                volumeCrore: 98, // Down from 125
                breadth: 'Weak' // Only Mehta stocks rising
            }
        },

        // ==================== WEEK 5 ====================
        {
            title: 'Week 5: The Exposé',
            subtitle: 'April 23, 1992 — Sucheta Dalal breaks the story',
            events: [
                {
                    id: 'hm-5-1',
                    text: 'BREAKING: Times of India front page by Sucheta Dalal: "₹622 Crore Missing From SBI." The securities scam exposed.',
                    type: 'breaking',
                    marketImpact: -5,
                    historicalDate: 'April 23, 1992'
                },
                {
                    id: 'hm-5-2',
                    text: 'Report reveals Harshad Mehta used forged Bank Receipts to divert funds. National Housing Bank lost ₹950 crore.',
                    type: 'breaking',
                    marketImpact: -5,
                },
                {
                    id: 'hm-5-3',
                    text: 'Sensex crashes 570 points (12.8%) in single session—the largest single-day fall in Indian stock market history.',
                    type: 'breaking',
                    marketImpact: -5,
                    historicalDate: 'April 28, 1992'
                },
                {
                    id: 'hm-5-4',
                    text: 'Mehta holds emergency press conference. Blames "conspiracy by foreign brokers." Markets unmoved.',
                    type: 'news',
                    marketImpact: -2,
                }
            ],
            decision: {
                prompt: 'The scam is out. Sensex crashed 12.8% today. ACC down 25%. But is this the bottom or just the beginning of the unraveling?',
                options: [
                    {
                        id: 'hm-d5-a',
                        label: 'Total Capitulation',
                        description: 'This is systemic fraud. Banking system compromised. Sell everything now.',
                        icon: 'XCircle',
                        impact: { stock: 0, index: 0, bond: 35, gold: 35, cash: 30 },
                        riskScore: 1
                    },
                    {
                        id: 'hm-d5-b',
                        label: 'Buy The Panic',
                        description: 'Scam was in the banking sector, not the companies. Quality businesses on sale.',
                        icon: 'ShoppingCart',
                        impact: { stock: 55, index: 25, bond: 10, gold: 5, cash: 5 },
                        riskScore: 8
                    },
                    {
                        id: 'hm-d5-c',
                        label: 'Dump Mehta, Keep Rest',
                        description: 'Sell ACC, Apollo, Videocon. Keep HUL, ITC, banks. Differentiate.',
                        icon: 'Filter',
                        impact: { stock: 30, index: 20, bond: 25, gold: 15, cash: 10 },
                        riskScore: 4
                    }
                ]
            },
            marketData: {
                sensexLevel: 3897,
                volumeCrore: 245, // Panic selling
                breadth: 'Weak'
            }
        },

        // ==================== WEEK 6 ====================
        {
            title: 'Week 6: The Unraveling',
            subtitle: 'May 1992 — Full extent of fraud emerges',
            events: [
                {
                    id: 'hm-6-1',
                    text: 'CBI raids Mehta\'s 15,000 sq ft Worli office. Seizes documents showing BR transactions worth ₹2,800 crore.',
                    type: 'breaking',
                    marketImpact: -4,
                    historicalDate: 'May 6, 1992'
                },
                {
                    id: 'hm-6-2',
                    text: 'Standard Chartered, ANZ Grindlays, Citibank also found involved in BR scam. 27 banks implicated.',
                    type: 'breaking',
                    marketImpact: -4,
                },
                {
                    id: 'hm-6-3',
                    text: 'ACC collapses from ₹9,000 to ₹2,200. Apollo from ₹1,100 to ₹280. Investors trapped—no buyers.',
                    type: 'breaking',
                    marketImpact: -5,
                },
                {
                    id: 'hm-6-4',
                    text: 'Sensex at 3,200. Down 28% from peak. But banks estimate actual fraud could be ₹5,000+ crore. More pain likely.',
                    type: 'warning',
                    marketImpact: -3,
                }
            ],
            marketData: {
                sensexLevel: 3200,
                volumeCrore: 180,
                breadth: 'Weak'
            }
        },

        // ==================== WEEK 7 ====================
        {
            title: 'Week 7: Political Fallout',
            subtitle: 'Late May 1992 — Government & RBI under fire',
            events: [
                {
                    id: 'hm-7-1',
                    text: 'RBI Governor S. Venkitaramanan forced to resign. Parliament demands answers on regulatory failure.',
                    type: 'breaking',
                    marketImpact: -3,
                    historicalDate: 'December 21, 1992'
                },
                {
                    id: 'hm-7-2',
                    text: 'Finance Ministry forms Janakiraman Committee to investigate scam. Promises "systemic reforms."',
                    type: 'positive',
                    marketImpact: 1,
                },
                {
                    id: 'hm-7-3',
                    text: 'SEBI gets statutory powers through SEBI Act 1992. Can now penalize violations. Born from this crisis.',
                    type: 'positive',
                    marketImpact: 2,
                    historicalDate: 'April 12, 1992 (Act passed)'
                },
                {
                    id: 'hm-7-4',
                    text: 'Mehta claims he paid ₹1 crore bribe to PM Narasimha Rao. PM denies. Political circus begins.',
                    type: 'news',
                    marketImpact: -2,
                }
            ],
            marketData: {
                sensexLevel: 2950,
                volumeCrore: 95,
                breadth: 'Mixed'
            }
        },

        // ==================== WEEK 8 ====================
        {
            title: 'Week 8: The Bottom',
            subtitle: 'June 1992 — Sensex finds support',
            events: [
                {
                    id: 'hm-8-1',
                    text: 'Sensex hits 2,529 on June 12, 1992. Down 43% from April peak. Retail investors wiped out.',
                    type: 'breaking',
                    marketImpact: -4,
                    historicalDate: 'June 12, 1992'
                },
                {
                    id: 'hm-8-2',
                    text: 'ACC at ₹650 (from ₹9,000). Apollo at ₹160 (from ₹1,100). Videocon at ₹180 (from ₹1,200).',
                    type: 'news',
                    marketImpact: -3,
                },
                {
                    id: 'hm-8-3',
                    text: 'Gold up 12% YTD. FDs and bonds untouched. Those who stayed defensive preserved capital.',
                    type: 'positive',
                    marketImpact: 1,
                },
                {
                    id: 'hm-8-4',
                    text: 'Valuations now back to rational levels. HUL at 18x P/E (was 35x). Long-term investors see opportunity.',
                    type: 'positive',
                    marketImpact: 2,
                }
            ],
            decision: {
                prompt: 'Sensex at 2,529—still up 150% from 1991 low, but down 43% from peak. Are we at fair value now? Is India\'s reform story dead?',
                options: [
                    {
                        id: 'hm-d8-a',
                        label: 'Start Accumulating',
                        description: 'Scam was fraud, not economic failure. Reforms intact. Buy quality at rational prices.',
                        icon: 'TrendingUp',
                        impact: { stock: 45, index: 30, bond: 15, gold: 5, cash: 5 },
                        riskScore: 6
                    },
                    {
                        id: 'hm-d8-b',
                        label: 'Still Too Soon',
                        description: 'More revelations likely. Valuations could go lower. Wait 6 months.',
                        icon: 'Clock',
                        impact: { stock: 10, index: 10, bond: 30, gold: 25, cash: 25 },
                        riskScore: 2
                    },
                    {
                        id: 'hm-d8-c',
                        label: 'Barbell Strategy',
                        description: '30% quality equity + 40% bonds/gold + 30% cash for future deployment.',
                        icon: 'Scale',
                        impact: { stock: 20, index: 10, bond: 25, gold: 15, cash: 30 },
                        riskScore: 3
                    }
                ]
            },
            marketData: {
                sensexLevel: 2529,
                volumeCrore: 52,
                breadth: 'Weak'
            }
        },

        // ==================== WEEK 9 ====================
        {
            title: 'Week 9: Recovery Glimmers',
            subtitle: 'August 1992 — Markets stabilize',
            events: [
                {
                    id: 'hm-9-1',
                    text: 'Sensex bounces to 2,800. Short covering rally as worst fears don\'t materialize.',
                    type: 'positive',
                    marketImpact: 3,
                },
                {
                    id: 'hm-9-2',
                    text: 'FMCG stocks (HUL, ITC, Britannia) hit new highs. Defensives outperforming.',
                    type: 'positive',
                    marketImpact: 2,
                },
                {
                    id: 'hm-9-3',
                    text: 'Institutional buying returns. LIC and UTI announce plans to support market.',
                    type: 'positive',
                    marketImpact: 3,
                },
                {
                    id: 'hm-9-4',
                    text: 'Mehta\'s legal battles begin. 72 criminal cases filed. He\'ll spend next 9 years in court.',
                    type: 'news',
                    marketImpact: 0,
                }
            ],
            marketData: {
                sensexLevel: 2800,
                volumeCrore: 68,
                breadth: 'Mixed'
            }
        },

        // ==================== WEEK 10 ====================
        {
            title: 'Week 10: Lessons & Legacy',
            subtitle: 'End of 1992 — The reckoning',
            events: [
                {
                    id: 'hm-10-1',
                    text: 'Mehta arrested on November 9, 1992. Charged with fraud, forgery, and criminal conspiracy.',
                    type: 'news',
                    marketImpact: 0,
                    historicalDate: 'November 9, 1992'
                },
                {
                    id: 'hm-10-2',
                    text: 'Sensex ends 1992 at 3,000—up 200% from 1991 low, down 33% from peak. Volatility was the story.',
                    type: 'neutral',
                    marketImpact: 1,
                },
                {
                    id: 'hm-10-3',
                    text: 'SEBI introduces circuit breakers (10% daily limit), disclosure norms, and broker capital requirements.',
                    type: 'positive',
                    marketImpact: 2,
                },
                {
                    id: 'hm-10-4',
                    text: 'The Final Score: Govt bonds +3.75%, Gold +12%, Sensex +153% (if you held), ACC -68% (if you chased the peak).',
                    type: 'neutral',
                    marketImpact: 0,
                }
            ],
            marketData: {
                sensexLevel: 3000,
                volumeCrore: 75,
                breadth: 'Strong'
            }
        }
    ],

    learningObjectives: [
        'When a stock rises 44x (₹200→₹9,000) on NO fundamental change, it\'s manipulation—not genius',
        'Follow institutional money flows, not retail sentiment or celebrity brokers',
        'The "taxi driver giving stock tips" is a genuine bubble indicator',
        'Regulatory gaps create fraud opportunities—SEBI\'s birth from this crisis prevented future scams',
        'Concentration risk kills: never put >20% in one sector, >10% in one person\'s stock picks',
        'Gold (+12%) and govt bonds (+3.75%) are genuine safe havens during fraud-driven crashes',
        'Market timing is hard, but systematic profit-booking (15% weekly exit at peak) works',
        'The scam was in the banking system\'s loopholes, but quality companies (HUL, ITC) survived',
        'Sensex went 1,000→4,467→2,529 in 18 months. Those who held the cycle are STILL up +153%',
        'Criminal trials take decades (Mehta died in 2001 before conviction). Justice ≠ market recovery.'
    ],

    tags: ['India', 'Fraud', 'Banking', 'SEBI Origins', 'Bull Market', 'Crash', 'Regulatory Reform'],

    aftermath: `WHAT HAPPENED NEXT:

**Harshad Mehta**: Arrested November 1992. Spent years in court fighting 72 criminal cases. Died of a heart attack in Tihar Jail on December 31, 2001—never convicted. His family is still fighting legal battles over seized assets.

**The Money**: Of the ₹5,000 crore diverted, only ₹2,000 crore recovered. Banks wrote off the rest as bad debt. Taxpayers bore the ultimate cost.

**Regulatory Reform**: 
- SEBI got teeth (statutory powers, 1992)
- Circuit breakers introduced (10% daily limit)
- Dematerialization of shares began (to prevent fake BRs)
- Bank regulatory oversight tightened
- NSE launched in 1994 as electronic alternative to BSE

**Market Recovery**: Sensex took until 1999 to cross 4,500 again—7 years to recover. BUT, those who bought quality stocks at the 2,529 bottom made 10x by 2000.

**Cultural Impact**: The scam exposed India's post-liberalization growing pains. It DIDN'T kill reforms—it strengthened them. The story was adapted into:
- Scam 1992 (SonyLIV web series, 2020)
- The Big Bull (Bollywood film, 2021)
- Multiple books and documentaries

**The Big Lesson**: India's reform story was real. The fraud was an abuse of a flawed system, not proof the system couldn't work. Those who confused the two missed one of the greatest bull markets in history (Sensex is at 80,000+ in 2024).`
};

export const SIMULATION_CASES: SimulationCase[] = [
    harshadMehtaEnhanced,
];

export const getCaseById = (id: string): SimulationCase | undefined =>
    SIMULATION_CASES.find((c) => c.id === id);