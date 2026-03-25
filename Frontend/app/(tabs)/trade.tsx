import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Animated, Dimensions, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography } from '@/constants/theme';
import { ArrowLeft, TrendingUp, TrendingDown, Wallet, PieChart, BarChart3, Store, RotateCcw, Wifi, WifiOff, ArrowDownCircle, Shield } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { MOCK_STOCKS, StockData } from '@/data/mockStocks';
import { loadPortfolio, calculatePortfolioValue, simulatePrice, resetPortfolio, Holding, ShortPosition, PortfolioState, INITIAL_CASH } from '@/data/tradeEngine';
import { fetchAllStockData, YahooStockData } from '@/data/yahooFinance';
import { useAuth } from '@/context/AuthContext';

const { width: SW } = Dimensions.get('window');

export default function PaperTradingHome() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { session } = useAuth();
    const [portfolio, setPortfolio] = useState<PortfolioState>({ cash: INITIAL_CASH, holdings: [], shorts: [], trades: [] });
    const [prices, setPrices] = useState<Record<string, number>>({});
    const [liveData, setLiveData] = useState<Record<string, YahooStockData>>({});
    const [isLive, setIsLive] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    // Fetch real stock data from Yahoo Finance
    const fetchRealPrices = async () => {
        try {
            const data = await fetchAllStockData();
            if (Object.keys(data).length > 0) {
                setLiveData(data);
                const newPrices: Record<string, number> = {};
                for (const [symbol, stockData] of Object.entries(data)) {
                    newPrices[symbol] = stockData.price;
                }
                // Also keep fallback prices for stocks not fetched
                MOCK_STOCKS.forEach(s => {
                    if (!newPrices[s.symbol]) {
                        newPrices[s.symbol] = prices[s.symbol] || s.price;
                    }
                });
                setPrices(newPrices);
                setIsLive(true);
            }
        } catch (e) {
            console.warn('Failed to fetch live prices:', e);
            setIsLive(false);
        }
    };

    useEffect(() => {
        // Set initial prices from mock data immediately
        const initial: Record<string, number> = {};
        MOCK_STOCKS.forEach(s => { initial[s.symbol] = s.price; });
        setPrices(initial);
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();

        // Fetch real prices
        fetchRealPrices();
    }, []);

    // Refresh real prices every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            fetchRealPrices();
        }, 30000);
        return () => clearInterval(interval);
    }, []);

    useFocusEffect(useCallback(() => {
        loadPortfolio(session?.access_token).then(setPortfolio);
        fetchRealPrices();
    }, [session]));

    const onRefresh = async () => {
        setRefreshing(true);
        const p = await loadPortfolio(session?.access_token);
        setPortfolio(p);
        await fetchRealPrices();
        setRefreshing(false);
    };

    const { totalValue, totalInvested, totalPL, shortPL, totalMarginHeld } = calculatePortfolioValue(portfolio.holdings, prices, portfolio.shorts);
    const portfolioVal = totalValue + portfolio.cash + totalMarginHeld + shortPL;
    const todayPL = totalPL;
    const isUp = totalPL >= 0;

    const handleReset = async () => {
        try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); } catch { }
        const p = await resetPortfolio();
        setPortfolio(p);
    };

    const miniChart = (symbol: string, stock: StockData) => {
        // Use real intraday data if available
        const liveStock = liveData[symbol];
        const rawData = liveStock?.history1D || stock.history1D;
        // Sample down for chart: take every Nth point to get ~10 points
        const sampleRate = Math.max(1, Math.floor(rawData.length / 10));
        const data = rawData.filter((_, i) => i % sampleRate === 0).slice(-10);
        const min = Math.min(...data);
        const max = Math.max(...data);
        const range = max - min || 1;
        const h = 30;
        const w = 60;
        const step = w / (data.length - 1);
        const up = data[data.length - 1] >= data[0];
        let d = '';
        data.forEach((v, i) => {
            const x = i * step;
            const y = h - ((v - min) / range) * h;
            d += i === 0 ? `M${x},${y}` : ` L${x},${y}`;
        });
        return (
            <View style={{ width: w, height: h }}>
                <View style={{ position: 'absolute', width: w, height: h }}>
                    {/* SVG approximation using Views */}
                    {data.map((v, i) => {
                        if (i === 0) return null;
                        const x1 = (i - 1) * step;
                        const y1 = h - ((data[i - 1] - min) / range) * h;
                        const x2 = i * step;
                        const y2 = h - ((v - min) / range) * h;
                        const len = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
                        const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
                        return (
                            <View key={i} style={{
                                position: 'absolute', left: x1, top: y1,
                                width: len, height: 2.5, borderRadius: 1.25,
                                backgroundColor: up ? '#22C55E' : '#EF4444',
                                transform: [{ rotate: `${angle}deg` }],
                                transformOrigin: 'left center',
                            }} />
                        );
                    })}
                </View>
            </View>
        );
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={[styles.headerTitle, { marginLeft: 0 }]}>Paper Trading</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={[styles.liveBadge, { backgroundColor: isLive ? '#DCFCE7' : '#FEE2E2' }]}>
                        {isLive ? <Wifi size={12} color="#22C55E" strokeWidth={3} /> : <WifiOff size={12} color="#EF4444" strokeWidth={3} />}
                        <Text style={[styles.liveText, { color: isLive ? '#22C55E' : '#EF4444' }]}>
                            {isLive ? 'LIVE' : 'OFFLINE'}
                        </Text>
                    </View>
                    <Pressable onPress={handleReset} style={styles.resetBtn}>
                        <RotateCcw size={16} color={Colors.secondary} strokeWidth={2.5} />
                    </Pressable>
                </View>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scroll}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {/* Portfolio Summary */}
                <Animated.View style={[styles.summaryCard, { opacity: fadeAnim }]}>
                    <Text style={styles.summaryLabel}>PORTFOLIO VALUE</Text>
                    <Text style={styles.summaryValue}>
                        {'\u20B9'}{portfolioVal.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </Text>
                    <View style={styles.summaryRow}>
                        <View style={[styles.plBadge, { backgroundColor: isUp ? '#DCFCE7' : '#FEE2E2' }]}>
                            {isUp ? <TrendingUp size={14} color="#22C55E" strokeWidth={3} /> : <TrendingDown size={14} color="#EF4444" strokeWidth={3} />}
                            <Text style={[styles.plText, { color: isUp ? '#22C55E' : '#EF4444' }]}>
                                {isUp ? '+' : ''}{'\u20B9'}{totalPL.toLocaleString('en-IN')}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.statsGrid}>
                        <View style={styles.statItem}>
                            <Wallet size={14} color={Colors.textMuted} strokeWidth={2.5} />
                            <Text style={styles.statLabel}>Cash</Text>
                            <Text style={styles.statVal}>{'\u20B9'}{portfolio.cash.toLocaleString('en-IN')}</Text>
                        </View>
                        <View style={styles.statItem}>
                            <BarChart3 size={14} color={Colors.textMuted} strokeWidth={2.5} />
                            <Text style={styles.statLabel}>Invested</Text>
                            <Text style={styles.statVal}>{'\u20B9'}{totalInvested.toLocaleString('en-IN')}</Text>
                        </View>
                        {totalMarginHeld > 0 && (
                            <View style={styles.statItem}>
                                <Shield size={14} color="#F59E0B" strokeWidth={2.5} />
                                <Text style={styles.statLabel}>Margin</Text>
                                <Text style={[styles.statVal, { color: '#F59E0B' }]}>{'\u20B9'}{totalMarginHeld.toLocaleString('en-IN')}</Text>
                            </View>
                        )}
                    </View>
                </Animated.View>

                {/* Quick Actions */}
                <View style={styles.actions}>
                    <Pressable
                        style={({ pressed }) => [styles.actionBtn, styles.marketBtn, pressed && styles.btnPressed]}
                        onPress={() => { try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch { } router.push('/paper-trading/market' as any); }}
                    >
                        <Store size={20} color="#FFF" strokeWidth={2.5} />
                        <Text style={styles.actionBtnText}>Explore Market</Text>
                    </Pressable>
                    <Pressable
                        style={({ pressed }) => [styles.actionBtn, styles.portfolioBtn, pressed && styles.btnPressed]}
                        onPress={() => { try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch { } router.push('/paper-trading/portfolio' as any); }}
                    >
                        <PieChart size={20} color={Colors.secondary} strokeWidth={2.5} />
                        <Text style={[styles.actionBtnText, { color: Colors.secondary }]}>Portfolio</Text>
                    </Pressable>
                </View>

                {/* Holdings */}
                <Text style={styles.sectionTitle}>
                    {portfolio.holdings.length > 0 ? 'Your Holdings' : 'No Holdings Yet'}
                </Text>

                {portfolio.holdings.length === 0 && (
                    <View style={styles.emptyCard}>
                        <Text style={styles.emptyText}>Start trading to see your holdings here.</Text>
                        <Text style={styles.emptySubText}>You have {'\u20B9'}1,00,000 virtual cash to play with.</Text>
                    </View>
                )}

                {portfolio.holdings.map((h) => {
                    const cp = prices[h.symbol] || h.avgPrice;
                    const liveStock = liveData[h.symbol];
                    const prevClose = liveStock?.prevClose || (MOCK_STOCKS.find(s => s.symbol === h.symbol)?.prevClose || h.avgPrice);
                    const pl = +((cp - h.avgPrice) * h.qty).toFixed(2);
                    const plPct = +((cp - h.avgPrice) / h.avgPrice * 100).toFixed(2);
                    const up = pl >= 0;
                    const stock = MOCK_STOCKS.find(s => s.symbol === h.symbol);

                    return (
                        <Pressable
                            key={h.symbol}
                            style={({ pressed }) => [styles.holdingCard, pressed && styles.holdingPressed]}
                            onPress={() => {
                                try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch { }
                                router.push({ pathname: '/paper-trading/stock-detail', params: { symbol: h.symbol } } as any);
                            }}
                        >
                            <View style={[styles.stockLogo, { backgroundColor: stock?.color || '#666' }]}>
                                <Text style={styles.stockLogoText}>{h.symbol.substring(0, 2)}</Text>
                            </View>
                            <View style={styles.holdingInfo}>
                                <Text style={styles.holdingSymbol}>{h.symbol}</Text>
                                <Text style={styles.holdingQty}>Qty: {h.qty} @ {'\u20B9'}{h.avgPrice.toLocaleString('en-IN')}</Text>
                            </View>
                            <View style={styles.holdingRight}>
                                {stock && miniChart(h.symbol, stock)}
                                <Text style={styles.holdingPrice}>{'\u20B9'}{cp.toLocaleString('en-IN')}</Text>
                                <Text style={[styles.holdingPL, { color: up ? '#22C55E' : '#EF4444' }]}>
                                    {up ? '+' : ''}{'\u20B9'}{pl.toLocaleString('en-IN')} ({plPct}%)
                                </Text>
                            </View>
                        </Pressable>
                    );
                })}

                {/* Short Positions */}
                {portfolio.shorts && portfolio.shorts.length > 0 && (
                    <>
                        <Text style={[styles.sectionTitle, { marginTop: 28 }]}>
                            📉 Short Positions
                        </Text>
                        {portfolio.shorts.map((s) => {
                            const cp = prices[s.symbol] || s.entryPrice;
                            const pl = +((s.entryPrice - cp) * s.qty).toFixed(2);
                            const plPct = +((s.entryPrice - cp) / s.entryPrice * 100).toFixed(2);
                            const up = pl >= 0;
                            const stock = MOCK_STOCKS.find(ms => ms.symbol === s.symbol);

                            return (
                                <Pressable
                                    key={`short-${s.symbol}`}
                                    style={({ pressed }) => [styles.holdingCard, { borderColor: '#F59E0B' }, pressed && styles.holdingPressed]}
                                    onPress={() => {
                                        try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch { }
                                        router.push({ pathname: '/paper-trading/stock-detail', params: { symbol: s.symbol } } as any);
                                    }}
                                >
                                    <View style={[styles.stockLogo, { backgroundColor: '#F59E0B' }]}>
                                        <ArrowDownCircle size={20} color="#FFF" strokeWidth={2.5} />
                                    </View>
                                    <View style={styles.holdingInfo}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                            <Text style={styles.holdingSymbol}>{s.symbol}</Text>
                                            <View style={{ backgroundColor: '#FEF3C7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                                                <Text style={{ fontFamily: Typography.fontFamily.black, fontSize: 9, color: '#F59E0B', letterSpacing: 0.5 }}>SHORT</Text>
                                            </View>
                                        </View>
                                        <Text style={styles.holdingQty}>
                                            Qty: {s.qty} @ {'\u20B9'}{s.entryPrice.toLocaleString('en-IN')} • Margin: {'\u20B9'}{s.marginHeld.toLocaleString('en-IN')}
                                        </Text>
                                    </View>
                                    <View style={styles.holdingRight}>
                                        <Text style={styles.holdingPrice}>{'\u20B9'}{cp.toLocaleString('en-IN')}</Text>
                                        <Text style={[styles.holdingPL, { color: up ? '#22C55E' : '#EF4444' }]}>
                                            {up ? '+' : ''}{'\u20B9'}{pl.toLocaleString('en-IN')} ({plPct}%)
                                        </Text>
                                    </View>
                                </Pressable>
                            );
                        })}
                    </>
                )}

                {/* Recent Trades */}
                {portfolio.trades.length > 0 && (
                    <>
                        <Text style={[styles.sectionTitle, { marginTop: 28 }]}>Recent Trades</Text>
                        {portfolio.trades.slice(0, 8).map((t) => {
                            const badgeColor = t.type === 'BUY' ? '#DCFCE7' 
                                : t.type === 'SELL' ? '#FEE2E2'
                                : t.type === 'SHORT' ? '#FEF3C7'
                                : '#EDE9FE'; // COVER
                            const textColor = t.type === 'BUY' ? '#22C55E'
                                : t.type === 'SELL' ? '#EF4444'
                                : t.type === 'SHORT' ? '#F59E0B'
                                : '#8B5CF6'; // COVER
                            return (
                                <View key={t.id} style={styles.tradeRow}>
                                    <View style={[styles.tradeTypeBadge, { backgroundColor: badgeColor }]}>
                                        <Text style={[styles.tradeTypeText, { color: textColor }]}>{t.type}</Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.tradeSymbol}>{t.symbol}</Text>
                                        <Text style={styles.tradeDetail}>{t.qty} shares @ {'\u20B9'}{t.price}</Text>
                                    </View>
                                    <Text style={styles.tradeTotal}>{'\u20B9'}{t.total.toLocaleString('en-IN')}</Text>
                                </View>
                            );
                        })}
                    </>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
        flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14,
        borderBottomWidth: 3, borderBottomColor: Colors.secondary, backgroundColor: Colors.white,
    },
    backBtn: {
        width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.white,
        borderWidth: 2, borderColor: Colors.secondary, alignItems: 'center', justifyContent: 'center',
    },
    headerTitle: { flex: 1, fontFamily: Typography.fontFamily.black, fontSize: 22, color: Colors.secondary, marginLeft: 14, letterSpacing: -0.5 },
    resetBtn: {
        width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.pastelYellow,
        borderWidth: 2, borderColor: Colors.secondary, alignItems: 'center', justifyContent: 'center',
    },
    liveBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
    },
    liveText: {
        fontFamily: Typography.fontFamily.black, fontSize: 10, letterSpacing: 0.8,
    },
    scroll: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 100 },
    // Summary
    summaryCard: {
        backgroundColor: Colors.secondary, borderRadius: 24, padding: 24,
        borderWidth: 3, borderColor: Colors.secondary,
        shadowColor: Colors.secondary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 1, shadowRadius: 0,
    },
    summaryLabel: { fontFamily: Typography.fontFamily.black, fontSize: 12, color: Colors.textMuted, letterSpacing: 1.5 },
    summaryValue: { fontFamily: Typography.fontFamily.black, fontSize: 38, color: Colors.white, marginTop: 4, letterSpacing: -1 },
    summaryRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
    plBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
    plText: { fontFamily: Typography.fontFamily.black, fontSize: 14 },
    statsGrid: { flexDirection: 'row', marginTop: 20, gap: 12 },
    statItem: { flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 16, padding: 14, gap: 4 },
    statLabel: { fontFamily: Typography.fontFamily.bold, fontSize: 12, color: Colors.textMuted },
    statVal: { fontFamily: Typography.fontFamily.black, fontSize: 16, color: Colors.white },
    // Actions
    actions: { flexDirection: 'row', gap: 12, marginTop: 20 },
    actionBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        height: 56, borderRadius: 16, borderWidth: 3, borderColor: Colors.secondary,
        shadowColor: Colors.secondary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 0,
    },
    marketBtn: { backgroundColor: Colors.secondary },
    portfolioBtn: { backgroundColor: Colors.neonGreen },
    actionBtnText: { fontFamily: Typography.fontFamily.black, fontSize: 15, color: '#FFF', letterSpacing: 0.3 },
    btnPressed: { shadowOffset: { width: 0, height: 0 }, marginTop: 4, marginBottom: -4 },
    // Holdings
    sectionTitle: { fontFamily: Typography.fontFamily.black, fontSize: 20, color: Colors.secondary, marginTop: 28, marginBottom: 14, letterSpacing: -0.5 },
    emptyCard: {
        backgroundColor: Colors.white, borderRadius: 20, padding: 28, alignItems: 'center',
        borderWidth: 3, borderColor: Colors.secondary, borderStyle: 'dashed',
    },
    emptyText: { fontFamily: Typography.fontFamily.bold, fontSize: 16, color: Colors.secondary, textAlign: 'center' },
    emptySubText: { fontFamily: Typography.fontFamily.bold, fontSize: 14, color: Colors.textMuted, marginTop: 6, textAlign: 'center' },
    holdingCard: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white,
        borderRadius: 20, padding: 16, marginBottom: 12,
        borderWidth: 3, borderColor: Colors.secondary,
        shadowColor: Colors.secondary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 0,
    },
    holdingPressed: { shadowOffset: { width: 0, height: 0 }, marginTop: 4, marginBottom: 8 },
    stockLogo: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.secondary },
    stockLogoText: { fontFamily: Typography.fontFamily.black, fontSize: 14, color: '#FFF' },
    holdingInfo: { flex: 1, marginLeft: 12 },
    holdingSymbol: { fontFamily: Typography.fontFamily.black, fontSize: 16, color: Colors.secondary },
    holdingQty: { fontFamily: Typography.fontFamily.bold, fontSize: 12, color: Colors.textMuted, marginTop: 2 },
    holdingRight: { alignItems: 'flex-end', gap: 4 },
    holdingPrice: { fontFamily: Typography.fontFamily.black, fontSize: 15, color: Colors.secondary },
    holdingPL: { fontFamily: Typography.fontFamily.black, fontSize: 12 },
    // Trades
    tradeRow: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white,
        borderRadius: 16, padding: 14, marginBottom: 10,
        borderWidth: 2, borderColor: Colors.inputBorder, gap: 12,
    },
    tradeTypeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    tradeTypeText: { fontFamily: Typography.fontFamily.black, fontSize: 11, letterSpacing: 0.5 },
    tradeSymbol: { fontFamily: Typography.fontFamily.black, fontSize: 14, color: Colors.secondary },
    tradeDetail: { fontFamily: Typography.fontFamily.bold, fontSize: 12, color: Colors.textMuted },
    tradeTotal: { fontFamily: Typography.fontFamily.black, fontSize: 14, color: Colors.secondary },
});
