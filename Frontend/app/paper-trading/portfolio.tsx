import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Animated, Dimensions, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography } from '@/constants/theme';
import { ArrowLeft, TrendingUp, TrendingDown, PieChart, ArrowDownCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { MOCK_STOCKS } from '@/data/mockStocks';
import { loadPortfolio, calculatePortfolioValue, simulatePrice, Holding, ShortPosition, PortfolioState, INITIAL_CASH } from '@/data/tradeEngine';
import { fetchAllStockData } from '@/data/yahooFinance';

const { width: SW } = Dimensions.get('window');

const ALLOC_COLORS = ['#3B82F6', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

export default function PortfolioScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [portfolio, setPortfolio] = useState<PortfolioState>({ cash: INITIAL_CASH, holdings: [], shorts: [], trades: [] });
    const [prices, setPrices] = useState<Record<string, number>>({});
    const [refreshing, setRefreshing] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    // Fetch real stock data from Yahoo Finance
    const fetchRealPrices = async () => {
        try {
            const data = await fetchAllStockData();
            if (Object.keys(data).length > 0) {
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
            }
        } catch (e) {
            console.warn('Failed to fetch live prices in portfolio:', e);
        }
    };

    useEffect(() => {
        const initial: Record<string, number> = {};
        MOCK_STOCKS.forEach(s => { initial[s.symbol] = s.price; });
        setPrices(initial);
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
        fetchRealPrices();
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            fetchRealPrices();
        }, 15000); // 15s refresh
        return () => clearInterval(interval);
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        const p = await loadPortfolio();
        setPortfolio(p);
        await fetchRealPrices();
        setRefreshing(false);
    };

    useFocusEffect(useCallback(() => {
        loadPortfolio().then(setPortfolio);
        fetchRealPrices();
    }, []));

    const { totalValue, totalInvested, totalPL, shortPL, totalMarginHeld } = calculatePortfolioValue(portfolio.holdings, prices, portfolio.shorts);
    const portfolioVal = totalValue + portfolio.cash + totalMarginHeld + shortPL;

    // Allocation data
    const allocData = portfolio.holdings.map((h, i) => {
        const cp = prices[h.symbol] || h.avgPrice;
        const val = h.qty * cp;
        return { symbol: h.symbol, value: val, color: ALLOC_COLORS[i % ALLOC_COLORS.length] };
    });
    // Add shorts to allocation if needed (optional)
    const shortAlloc = (portfolio.shorts || []).map((s, i) => {
        const val = s.marginHeld; // Simple representation of margin as value
        return { symbol: s.symbol, value: val, color: '#F59E0B' };
    });
    const cashAlloc = { symbol: 'CASH', value: portfolio.cash, color: '#9CA3AF' };
    const allAlloc = [...allocData, ...shortAlloc, cashAlloc];
    const totalAlloc = allAlloc.reduce((s, a) => s + a.value, 0) || 1;

    // Simple pie chart as horizontal bar
    const renderAllocationBar = () => (
        <View style={styles.allocBar}>
            {allAlloc.map((a, i) => {
                const pct = (a.value / totalAlloc) * 100;
                if (pct < 1) return null;
                return (
                    <View key={i} style={{
                        width: `${pct}%` as any,
                        height: 20,
                        backgroundColor: a.color,
                        borderRadius: i === 0 ? 10 : i === allAlloc.length - 1 ? 10 : 0,
                        borderTopLeftRadius: i === 0 ? 10 : 0,
                        borderBottomLeftRadius: i === 0 ? 10 : 0,
                        borderTopRightRadius: i === allAlloc.length - 1 ? 10 : 0,
                        borderBottomRightRadius: i === allAlloc.length - 1 ? 10 : 0
                    }} />
                );
            })}
        </View>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={20} color={Colors.secondary} strokeWidth={2.5} />
                </Pressable>
                <Text style={styles.headerTitle}>Portfolio</Text>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scroll}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {/* Summary */}
                <Animated.View style={[styles.summaryCard, { opacity: fadeAnim }]}>
                    <Text style={styles.sumLabel}>TOTAL PORTFOLIO VALUE</Text>
                    <Text style={styles.sumValue}>{'\u20B9'}{portfolioVal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Text>
                    <View style={styles.sumRow}>
                        <View style={[styles.sumBadge, { backgroundColor: totalPL >= 0 ? '#DCFCE7' : '#FEE2E2' }]}>
                            {totalPL >= 0
                                ? <TrendingUp size={14} color="#22C55E" strokeWidth={3} />
                                : <TrendingDown size={14} color="#EF4444" strokeWidth={3} />}
                            <Text style={[styles.sumBadgeText, { color: totalPL >= 0 ? '#22C55E' : '#EF4444' }]}>
                                {totalPL >= 0 ? '+' : ''}{'\u20B9'}{totalPL.toLocaleString('en-IN')} Total P&L
                            </Text>
                        </View>
                    </View>
                </Animated.View>

                {/* Allocation */}
                {(portfolio.holdings.length > 0 || (portfolio.shorts && portfolio.shorts.length > 0)) && (
                    <View style={styles.allocCard}>
                        <View style={styles.allocHeader}>
                            <PieChart size={16} color={Colors.secondary} strokeWidth={2.5} />
                            <Text style={styles.allocTitle}>Allocation</Text>
                        </View>
                        {renderAllocationBar()}
                        <View style={styles.allocLegend}>
                            {allAlloc.map((a, i) => {
                                const pct = ((a.value / totalAlloc) * 100).toFixed(1);
                                if (+pct < 1) return null;
                                return (
                                    <View key={i} style={styles.legendItem}>
                                        <View style={[styles.legendDot, { backgroundColor: a.color }]} />
                                        <Text style={styles.legendText}>{a.symbol} {pct}%</Text>
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                )}

                {/* Holdings Sections */}
                <Text style={styles.sectionTitle}>
                    Holdings ({portfolio.holdings.length})
                </Text>

                {portfolio.holdings.map((h) => {
                    const cp = prices[h.symbol] || h.avgPrice;
                    const curVal = +(h.qty * cp).toFixed(2);
                    const invested = +(h.qty * h.avgPrice).toFixed(2);
                    const pl = +(curVal - invested).toFixed(2);
                    const plPct = +((pl / invested) * 100).toFixed(2);
                    const up = pl >= 0;
                    const stock = MOCK_STOCKS.find(s => s.symbol === h.symbol);

                    return (
                        <Pressable
                            key={h.symbol}
                            style={({ pressed }) => [styles.holdingCard, pressed && styles.cardPressed]}
                            onPress={() => {
                                try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch { }
                                router.push({ pathname: '/paper-trading/stock-detail', params: { symbol: h.symbol } } as any);
                            }}
                        >
                            <View style={styles.cardTop}>
                                <View style={[styles.logo, { backgroundColor: stock?.color || '#666' }]}>
                                    <Text style={styles.logoText}>{h.symbol.substring(0, 2)}</Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.cardSymbol}>{h.symbol}</Text>
                                    <Text style={styles.cardName}>{stock?.name || h.symbol}</Text>
                                </View>
                                <View style={[styles.plChip, { backgroundColor: up ? '#DCFCE7' : '#FEE2E2' }]}>
                                    <Text style={[styles.plChipText, { color: up ? '#22C55E' : '#EF4444' }]}>
                                        {up ? '+' : ''}{plPct}%
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.cardGrid}>
                                <View style={styles.gridItem}>
                                    <Text style={styles.gridLabel}>Qty</Text>
                                    <Text style={styles.gridVal}>{h.qty}</Text>
                                </View>
                                <View style={styles.gridItem}>
                                    <Text style={styles.gridLabel}>Avg Price</Text>
                                    <Text style={styles.gridVal}>{'\u20B9'}{h.avgPrice.toLocaleString('en-IN')}</Text>
                                </View>
                                <View style={styles.gridItem}>
                                    <Text style={styles.gridLabel}>Current</Text>
                                    <Text style={styles.gridVal}>{'\u20B9'}{cp.toLocaleString('en-IN')}</Text>
                                </View>
                                <View style={styles.gridItem}>
                                    <Text style={styles.gridLabel}>P&L</Text>
                                    <Text style={[styles.gridVal, { color: up ? '#22C55E' : '#EF4444' }]}>
                                        {up ? '+' : ''}{'\u20B9'}{pl.toLocaleString('en-IN')}
                                    </Text>
                                </View>
                            </View>
                        </Pressable>
                    );
                })}

                {/* Short Positions */}
                {portfolio.shorts && portfolio.shorts.length > 0 && (
                    <>
                        <Text style={[styles.sectionTitle, { marginTop: 10 }]}>
                            Short Positions ({portfolio.shorts.length})
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
                                    style={({ pressed }) => [styles.holdingCard, { borderColor: '#F59E0B' }, pressed && styles.cardPressed]}
                                    onPress={() => {
                                        try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch { }
                                        router.push({ pathname: '/paper-trading/stock-detail', params: { symbol: s.symbol } } as any);
                                    }}
                                >
                                    <View style={styles.cardTop}>
                                        <View style={[styles.logo, { backgroundColor: '#F59E0B' }]}>
                                            <ArrowDownCircle size={20} color="#FFF" strokeWidth={2.5} />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                <Text style={styles.cardSymbol}>{s.symbol}</Text>
                                                <View style={{ backgroundColor: '#FEF3C7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                                                    <Text style={{ fontFamily: Typography.fontFamily.black, fontSize: 9, color: '#F59E0B', letterSpacing: 0.5 }}>SHORT</Text>
                                                </View>
                                            </View>
                                            <Text style={styles.cardName}>{stock?.name || s.symbol}</Text>
                                        </View>
                                        <View style={[styles.plChip, { backgroundColor: up ? '#DCFCE7' : '#FEE2E2' }]}>
                                            <Text style={[styles.plChipText, { color: up ? '#22C55E' : '#EF4444' }]}>
                                                {up ? '+' : ''}{plPct}%
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.cardGrid}>
                                        <View style={styles.gridItem}>
                                            <Text style={styles.gridLabel}>Qty</Text>
                                            <Text style={styles.gridVal}>{s.qty}</Text>
                                        </View>
                                        <View style={styles.gridItem}>
                                            <Text style={styles.gridLabel}>Entry Price</Text>
                                            <Text style={styles.gridVal}>{'\u20B9'}{s.entryPrice.toLocaleString('en-IN')}</Text>
                                        </View>
                                        <View style={styles.gridItem}>
                                            <Text style={styles.gridLabel}>Current</Text>
                                            <Text style={styles.gridVal}>{'\u20B9'}{cp.toLocaleString('en-IN')}</Text>
                                        </View>
                                        <View style={styles.gridItem}>
                                            <Text style={styles.gridLabel}>P&L</Text>
                                            <Text style={[styles.gridVal, { color: up ? '#22C55E' : '#EF4444' }]}>
                                                {up ? '+' : ''}{'\u20B9'}{pl.toLocaleString('en-IN')}
                                            </Text>
                                        </View>
                                    </View>
                                </Pressable>
                            );
                        })}
                    </>
                )}

                {portfolio.holdings.length === 0 && (!portfolio.shorts || portfolio.shorts.length === 0) && (
                    <View style={styles.emptyCard}>
                        <Text style={styles.emptyText}>Your portfolio is empty.</Text>
                        <Text style={styles.emptySub}>Start buying or shorting stocks to build your portfolio.</Text>
                    </View>
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
    scroll: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
    // Summary
    summaryCard: {
        backgroundColor: Colors.secondary, borderRadius: 24, padding: 24,
        borderWidth: 3, borderColor: Colors.secondary, marginBottom: 20,
        shadowColor: Colors.secondary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 1, shadowRadius: 0,
    },
    sumLabel: { fontFamily: Typography.fontFamily.black, fontSize: 12, color: Colors.textMuted, letterSpacing: 1.5 },
    sumValue: { fontFamily: Typography.fontFamily.black, fontSize: 36, color: Colors.white, marginTop: 4, letterSpacing: -1 },
    sumRow: { flexDirection: 'row', marginTop: 12 },
    sumBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, alignSelf: 'flex-start' },
    sumBadgeText: { fontFamily: Typography.fontFamily.black, fontSize: 13 },
    // Allocation
    allocCard: {
        backgroundColor: Colors.white, borderRadius: 20, padding: 18,
        borderWidth: 3, borderColor: Colors.secondary, marginBottom: 20,
        shadowColor: Colors.secondary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 0,
    },
    allocHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
    allocTitle: { fontFamily: Typography.fontFamily.black, fontSize: 16, color: Colors.secondary },
    allocBar: { flexDirection: 'row', borderRadius: 10, overflow: 'hidden', borderWidth: 2, borderColor: Colors.secondary },
    allocLegend: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    legendDot: { width: 10, height: 10, borderRadius: 5 },
    legendText: { fontFamily: Typography.fontFamily.black, fontSize: 11, color: Colors.secondary },
    // Section
    sectionTitle: { fontFamily: Typography.fontFamily.black, fontSize: 20, color: Colors.secondary, marginBottom: 14, letterSpacing: -0.5 },
    // Holding cards
    holdingCard: {
        backgroundColor: Colors.white, borderRadius: 20, padding: 18, marginBottom: 14,
        borderWidth: 3, borderColor: Colors.secondary,
        shadowColor: Colors.secondary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 0,
    },
    cardPressed: { shadowOffset: { width: 0, height: 0 }, marginTop: 4, marginBottom: 10 },
    cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
    logo: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.secondary },
    logoText: { fontFamily: Typography.fontFamily.black, fontSize: 13, color: '#FFF' },
    cardSymbol: { fontFamily: Typography.fontFamily.black, fontSize: 16, color: Colors.secondary },
    cardName: { fontFamily: Typography.fontFamily.bold, fontSize: 12, color: Colors.textMuted },
    plChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
    plChipText: { fontFamily: Typography.fontFamily.black, fontSize: 13 },
    cardGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    gridItem: { width: '50%', marginBottom: 10 },
    gridLabel: { fontFamily: Typography.fontFamily.bold, fontSize: 11, color: Colors.textMuted },
    gridVal: { fontFamily: Typography.fontFamily.black, fontSize: 15, color: Colors.secondary, marginTop: 2 },
    // Empty
    emptyCard: {
        backgroundColor: Colors.white, borderRadius: 20, padding: 28, alignItems: 'center',
        borderWidth: 3, borderColor: Colors.secondary, borderStyle: 'dashed',
    },
    emptyText: { fontFamily: Typography.fontFamily.bold, fontSize: 16, color: Colors.secondary },
    emptySub: { fontFamily: Typography.fontFamily.bold, fontSize: 14, color: Colors.textMuted, marginTop: 6 },
});

