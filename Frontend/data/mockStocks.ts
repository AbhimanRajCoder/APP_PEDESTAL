// ═══════════════════════════════════════════════════════════════════════════════
// Mock Stock Data — Hardcoded Indian Stocks
// ═══════════════════════════════════════════════════════════════════════════════

export interface StockData {
    symbol: string;
    name: string;
    sector: string;
    color: string;
    price: number;
    prevClose: number;
    dayHigh: number;
    dayLow: number;
    volume: number;
    history1D: number[];
    history1W: number[];
    history1M: number[];
    history6M: number[];
    volatility: number; // 0–1 range for simulation
}

const gen = (base: number, count: number, vol: number): number[] => {
    const arr: number[] = [base];
    for (let i = 1; i < count; i++) {
        const delta = (Math.random() - 0.48) * vol * base;
        arr.push(+(arr[i - 1] + delta).toFixed(2));
    }
    return arr;
};

export const MOCK_STOCKS: StockData[] = [
    {
        symbol: 'RELIANCE',
        name: 'Reliance Industries',
        sector: 'Oil & Gas',
        color: '#0057B8',
        price: 1390,
        prevClose: 1408,
        dayHigh: 1424,
        dayLow: 1375,
        volume: 14200000,
        history1D: gen(1408, 24, 0.004),
        history1W: gen(1380, 7, 0.008),
        history1M: gen(1340, 30, 0.012),
        history6M: gen(1250, 180, 0.009),
        volatility: 0.45
    },

    {
        symbol: 'TCS',
        name: 'Tata Consultancy Services',
        sector: 'IT',
        color: '#1D4ED8',
        price: 2465,
        prevClose: 2410,
        dayHigh: 2521,
        dayLow: 2400,
        volume: 2800000,
        history1D: gen(2410, 24, 0.003),
        history1W: gen(2380, 7, 0.006),
        history1M: gen(2300, 30, 0.01),
        history6M: gen(2150, 180, 0.008),
        volatility: 0.35
    },

    {
        symbol: 'HDFCBANK',
        name: 'HDFC Bank',
        sector: 'Banking',
        color: '#004C8F',
        price: 834,
        prevClose: 849,
        dayHigh: 870,
        dayLow: 821,
        volume: 8200000,
        history1D: gen(849, 24, 0.004),
        history1W: gen(830, 7, 0.007),
        history1M: gen(800, 30, 0.011),
        history6M: gen(760, 180, 0.008),
        volatility: 0.40
    },

    {
        symbol: 'INFY',
        name: 'Infosys',
        sector: 'IT',
        color: '#007CC3',
        price: 1272,
        prevClose: 1248,
        dayHigh: 1300,
        dayLow: 1264,
        volume: 5200000,
        history1D: gen(1248, 24, 0.004),
        history1W: gen(1220, 7, 0.008),
        history1M: gen(1180, 30, 0.012),
        history6M: gen(1100, 180, 0.009),
        volatility: 0.42
    },

    {
        symbol: 'ITC',
        name: 'ITC Limited',
        sector: 'FMCG',
        color: '#1B3D6F',
        price: 318,
        prevClose: 312,
        dayHigh: 322,
        dayLow: 310,
        volume: 17500000,
        history1D: gen(312, 24, 0.005),
        history1W: gen(305, 7, 0.008),
        history1M: gen(295, 30, 0.013),
        history6M: gen(270, 180, 0.01),
        volatility: 0.50
    },

    {
        symbol: 'ICICIBANK',
        name: 'ICICI Bank',
        sector: 'Banking',
        color: '#F37021',
        price: 1254,
        prevClose: 1266,
        dayHigh: 1280,
        dayLow: 1240,
        volume: 7200000,
        history1D: gen(1266, 24, 0.004),
        history1W: gen(1240, 7, 0.007),
        history1M: gen(1200, 30, 0.011),
        history6M: gen(1100, 180, 0.009),
        volatility: 0.40
    },

    {
        symbol: 'BHARTIARTL',
        name: 'Bharti Airtel',
        sector: 'Telecom',
        color: '#ED1C24',
        price: 1807,
        prevClose: 1829,
        dayHigh: 1910,
        dayLow: 1797,
        volume: 4300000,
        history1D: gen(1829, 24, 0.004),
        history1W: gen(1780, 7, 0.008),
        history1M: gen(1720, 30, 0.012),
        history6M: gen(1600, 180, 0.009),
        volatility: 0.44
    },

    {
        symbol: 'SBIN',
        name: 'State Bank of India',
        sector: 'Banking',
        color: '#2B3990',
        price: 1091,
        prevClose: 1046,
        dayHigh: 1115,
        dayLow: 1088,
        volume: 9800000,
        history1D: gen(1046, 24, 0.005),
        history1W: gen(1020, 7, 0.009),
        history1M: gen(980, 30, 0.013),
        history6M: gen(900, 180, 0.01),
        volatility: 0.48
    },

    {
        symbol: 'ASIANPAINT',
        name: 'Asian Paints',
        sector: 'Consumer',
        color: '#E31836',
        price: 2980,
        prevClose: 2965,
        dayHigh: 3010,
        dayLow: 2940,
        volume: 1500000,
        history1D: gen(2965, 24, 0.003),
        history1W: gen(2920, 7, 0.006),
        history1M: gen(2850, 30, 0.01),
        history6M: gen(2700, 180, 0.007),
        volatility: 0.35
    },

    {
        symbol: 'WIPRO',
        name: 'Wipro',
        sector: 'IT',
        color: '#44135A',
        price: 500,
        prevClose: 495,
        dayHigh: 508,
        dayLow: 488,
        volume: 6200000,
        history1D: gen(495, 24, 0.005),
        history1W: gen(490, 7, 0.009),
        history1M: gen(470, 30, 0.013),
        history6M: gen(440, 180, 0.01),
        volatility: 0.50
    },

    {
        symbol: 'MARUTI',
        name: 'Maruti Suzuki',
        sector: 'Auto',
        color: '#003E7E',
        price: 11800,
        prevClose: 11710,
        dayHigh: 11950,
        dayLow: 11650,
        volume: 720000,
        history1D: gen(11710, 24, 0.003),
        history1W: gen(11500, 7, 0.006),
        history1M: gen(11100, 30, 0.01),
        history6M: gen(10300, 180, 0.008),
        volatility: 0.38
    },

    {
        symbol: 'SUNPHARMA',
        name: 'Sun Pharmaceutical',
        sector: 'Pharma',
        color: '#F58220',
        price: 1826,
        prevClose: 1813,
        dayHigh: 1843,
        dayLow: 1818,
        volume: 3100000,
        history1D: gen(1813, 24, 0.004),
        history1W: gen(1780, 7, 0.007),
        history1M: gen(1700, 30, 0.011),
        history6M: gen(1600, 180, 0.009),
        volatility: 0.42
    },

    {
        symbol: 'ADANIPORTS',
        name: 'Adani Ports',
        sector: 'Infrastructure',
        color: '#002B5C',
        price: 1320,
        prevClose: 1305,
        dayHigh: 1345,
        dayLow: 1288,
        volume: 5200000,
        history1D: gen(1305, 24, 0.005),
        history1W: gen(1275, 7, 0.009),
        history1M: gen(1220, 30, 0.014),
        history6M: gen(1080, 180, 0.012),
        volatility: 0.58
    },

    {
        symbol: 'LT',
        name: 'Larsen & Toubro',
        sector: 'Infrastructure',
        color: '#003B6F',
        price: 3650,
        prevClose: 3615,
        dayHigh: 3685,
        dayLow: 3580,
        volume: 1900000,
        history1D: gen(3615, 24, 0.003),
        history1W: gen(3550, 7, 0.006),
        history1M: gen(3450, 30, 0.01),
        history6M: gen(3200, 180, 0.008),
        volatility: 0.38
    }
];

// Learning tips shown after trades
export const TRADE_TIPS: string[] = [
    'Diversification reduces risk. Avoid putting all money in one stock.',
    'Long-term investors ignore short-term volatility.',
    'Buy businesses, not stock tickers.',
    'Compounding needs time — patience is the real strategy.',
    'Never invest money you cannot afford to lose.',
    'Paper trading is the safest way to learn market dynamics.',
    'A 10% dip is a normal event. Panicking is not.',
    'Dollar-cost averaging beats timing the market.',
    'Volume confirms price movements. Low volume = weak signal.',
    'High P/E does not always mean overvalued.',
    'Check fundamentals before checking technicals.',
    'A stop-loss protects you from catastrophic losses.',
];
