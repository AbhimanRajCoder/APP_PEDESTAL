// ═══════════════════════════════════════════════════════════════════════════════
// Yahoo Finance API Service — Fetches real NSE stock data
// ═══════════════════════════════════════════════════════════════════════════════

// Maps our internal symbols to Yahoo Finance NSE symbols
const SYMBOL_MAP: Record<string, string> = {
    'RELIANCE': 'RELIANCE.NS',
    'TCS': 'TCS.NS',
    'HDFCBANK': 'HDFCBANK.NS',
    'INFY': 'INFY.NS',
    'ITC': 'ITC.NS',
    'ICICIBANK': 'ICICIBANK.NS',
    'BHARTIARTL': 'BHARTIARTL.NS',
    'SBIN': 'SBIN.NS',
    'ASIANPAINT': 'ASIANPAINT.NS',
    'WIPRO': 'WIPRO.NS',
    'MARUTI': 'MARUTI.NS',
    'SUNPHARMA': 'SUNPHARMA.NS',
    'ADANIPORTS': 'ADANIPORTS.NS',
    'LT': 'LT.NS',
    'TATAMOTORS': 'TATAMOTORS.NS',
    'TATAPOWER': 'TATAPOWER.NS',
};

export interface YahooStockData {
    symbol: string;
    price: number;
    prevClose: number;
    dayHigh: number;
    dayLow: number;
    volume: number;
    longName: string;
    change: number;
    changePercent: number;
    fiftyTwoWeekHigh: number;
    fiftyTwoWeekLow: number;
    history1D: number[];     // intraday close prices
}

const BASE_URL = 'https://query1.finance.yahoo.com/v8/finance/chart';

/**
 * Fetch real-time data for a single stock from Yahoo Finance
 */
export async function fetchStockData(symbol: string): Promise<YahooStockData | null> {
    const yahooSymbol = SYMBOL_MAP[symbol] || `${symbol}.NS`;
    try {
        const response = await fetch(`${BASE_URL}/${yahooSymbol}?range=1d&interval=1m`, {
            headers: {
                'User-Agent': 'Mozilla/5.0',
            },
        });

        if (!response.ok) {
            console.warn(`Yahoo Finance: HTTP ${response.status} for ${yahooSymbol}`);
            return null;
        }

        const json = await response.json();
        const result = json?.chart?.result?.[0];
        if (!result) return null;

        const meta = result.meta;
        const quotes = result.indicators?.quote?.[0];
        const closePrices: number[] = [];

        if (quotes?.close) {
            for (const c of quotes.close) {
                if (c !== null && c !== undefined) {
                    closePrices.push(+(c as number).toFixed(2));
                }
            }
        }

        const price = meta.regularMarketPrice || closePrices[closePrices.length - 1] || 0;
        const prevClose = meta.previousClose || meta.chartPreviousClose || price;
        const change = +(price - prevClose).toFixed(2);
        const changePercent = prevClose > 0 ? +((change / prevClose) * 100).toFixed(2) : 0;

        return {
            symbol,
            price,
            prevClose,
            dayHigh: meta.regularMarketDayHigh || price,
            dayLow: meta.regularMarketDayLow || price,
            volume: meta.regularMarketVolume || 0,
            longName: meta.longName || meta.shortName || symbol,
            change,
            changePercent,
            fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh || price,
            fiftyTwoWeekLow: meta.fiftyTwoWeekLow || price,
            history1D: closePrices.length > 0 ? closePrices : [price],
        };
    } catch (e) {
        console.warn(`Yahoo Finance fetch failed for ${symbol}:`, e);
        return null;
    }
}

/**
 * Fetch real-time data for all stocks in our universe.
 * Returns a map of symbol -> YahooStockData.
 * Falls back gracefully: stocks that fail to fetch return null.
 */
export async function fetchAllStockData(): Promise<Record<string, YahooStockData>> {
    const symbols = Object.keys(SYMBOL_MAP);
    const results: Record<string, YahooStockData> = {};

    // Fetch in parallel batches of 5 to avoid rate limits
    const batchSize = 5;
    for (let i = 0; i < symbols.length; i += batchSize) {
        const batch = symbols.slice(i, i + batchSize);
        const promises = batch.map(s => fetchStockData(s));
        const batchResults = await Promise.all(promises);

        batchResults.forEach((data, idx) => {
            if (data) {
                results[batch[idx]] = data;
            }
        });
    }

    return results;
}

/**
 * Get just the latest prices for all stocks (lightweight).
 * Returns a map of symbol -> current price.
 */
export async function fetchLatestPrices(): Promise<Record<string, number>> {
    const data = await fetchAllStockData();
    const prices: Record<string, number> = {};
    for (const [symbol, stockData] of Object.entries(data)) {
        prices[symbol] = stockData.price;
    }
    return prices;
}
