import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Animated, TextInput, Dimensions, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography } from '@/constants/theme';
import { ArrowLeft, Search, TrendingUp, TrendingDown, Wifi, WifiOff } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { MOCK_STOCKS, StockData } from '@/data/mockStocks';
import { fetchAllStockData, YahooStockData } from '@/data/yahooFinance';

const { width: SW } = Dimensions.get('window');

export default function MarketScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [prices, setPrices] = useState<Record<string, number>>({});
    const [liveData, setLiveData] = useState<Record<string, YahooStockData>>({});
    const [isLive, setIsLive] = useState(false);
    const [loadingPrices, setLoadingPrices] = useState(true);
    const [search, setSearch] = useState('');
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const fetchRealPrices = async () => {
        try {
            const data = await fetchAllStockData();
            if (Object.keys(data).length > 0) {
                setLiveData(data);
                const newPrices: Record<string, number> = {};
                for (const [symbol, stockData] of Object.entries(data)) {
                    newPrices[symbol] = stockData.price;
                }
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
        } finally {
            setLoadingPrices(false);
        }
    };

    useEffect(() => {
        // Set initial mock prices
        const initial: Record<string, number> = {};
        MOCK_STOCKS.forEach(s => { initial[s.symbol] = s.price; });
        setPrices(initial);
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();

        // Fetch real prices
        fetchRealPrices();
    }, []);

    // Refresh every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => { fetchRealPrices(); }, 30000);
        return () => clearInterval(interval);
    }, []);

    const filtered = MOCK_STOCKS.filter(s =>
        s.symbol.toLowerCase().includes(search.toLowerCase()) ||
        s.name.toLowerCase().includes(search.toLowerCase())
    );

    const miniChart = (symbol: string, stock: StockData) => {
        const liveStock = liveData[symbol];
        const rawData = liveStock?.history1D || stock.history1D;
        const sampleRate = Math.max(1, Math.floor(rawData.length / 10));
        const data = rawData.filter((_, i) => i % sampleRate === 0).slice(-10);
        const min = Math.min(...data);
        const max = Math.max(...data);
        const range = max - min || 1;
        const h = 28;
        const w = 56;
        const step = w / (data.length - 1);
        const up = data[data.length - 1] >= data[0];
        return (
            <View style={{ width: w, height: h }}>
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
                            width: len, height: 2, borderRadius: 1,
                            backgroundColor: up ? '#22C55E' : '#EF4444',
                            transform: [{ rotate: `${angle}deg` }],
                            transformOrigin: 'left center',
                        }} />
                    );
                })}
            </View>
        );
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={20} color={Colors.secondary} strokeWidth={2.5} />
                </Pressable>
                <Text style={styles.headerTitle}>Market</Text>
                <View style={[styles.liveBadge, { backgroundColor: isLive ? '#DCFCE7' : '#FEE2E2' }]}>
                    {isLive ? <Wifi size={12} color="#22C55E" strokeWidth={3} /> : <WifiOff size={12} color="#EF4444" strokeWidth={3} />}
                    <Text style={[styles.liveText, { color: isLive ? '#22C55E' : '#EF4444' }]}>
                        {isLive ? 'LIVE' : 'OFFLINE'}
                    </Text>
                </View>
            </View>

            {/* Search */}
            <View style={styles.searchWrap}>
                <Search size={18} color={Colors.textMuted} strokeWidth={2.5} />
                <TextInput
                    style={styles.searchInput}
                    value={search}
                    onChangeText={setSearch}
                    placeholder="Search stocks..."
                    placeholderTextColor={Colors.textMuted}
                />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                <Text style={styles.sectionLabel}>{filtered.length} STOCKS • {isLive ? 'LIVE NSE DATA' : 'MOCK DATA'}</Text>

                {filtered.map((stock, idx) => {
                    const cp = prices[stock.symbol] || stock.price;
                    const liveStock = liveData[stock.symbol];
                    const prevClose = liveStock?.prevClose || stock.prevClose;
                    const change = cp - prevClose;
                    const changePct = ((change / prevClose) * 100).toFixed(2);
                    const up = change >= 0;
                    const displayName = liveStock?.longName || stock.name;
                    const volume = liveStock?.volume || stock.volume;

                    return (
                        <Animated.View key={stock.symbol} style={{ opacity: fadeAnim }}>
                            <Pressable
                                style={({ pressed }) => [styles.stockRow, pressed && styles.stockRowPressed]}
                                onPress={() => {
                                    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch { }
                                    router.push({ pathname: '/paper-trading/stock-detail', params: { symbol: stock.symbol } } as any);
                                }}
                            >
                                <View style={[styles.logo, { backgroundColor: stock.color }]}>
                                    <Text style={styles.logoText}>{stock.symbol.substring(0, 2)}</Text>
                                </View>
                                <View style={styles.stockInfo}>
                                    <Text style={styles.stockSymbol}>{stock.symbol}</Text>
                                    <Text style={styles.stockName} numberOfLines={1}>{displayName}</Text>
                                </View>
                                {miniChart(stock.symbol, stock)}
                                <View style={styles.priceCol}>
                                    <Text style={styles.priceText}>{'\u20B9'}{cp.toLocaleString('en-IN')}</Text>
                                    <View style={[styles.changeBadge, { backgroundColor: up ? '#DCFCE7' : '#FEE2E2' }]}>
                                        {up ? <TrendingUp size={10} color="#22C55E" strokeWidth={3} /> : <TrendingDown size={10} color="#EF4444" strokeWidth={3} />}
                                        <Text style={[styles.changeText, { color: up ? '#22C55E' : '#EF4444' }]}>
                                            {up ? '+' : ''}{changePct}%
                                        </Text>
                                    </View>
                                </View>
                            </Pressable>
                        </Animated.View>
                    );
                })}
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
    liveBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
    },
    liveText: {
        fontFamily: Typography.fontFamily.black, fontSize: 10, letterSpacing: 0.8,
    },
    searchWrap: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white,
        marginHorizontal: 20, marginTop: 16, borderRadius: 16, paddingHorizontal: 16,
        borderWidth: 3, borderColor: Colors.secondary, gap: 10, height: 50,
    },
    searchInput: {
        flex: 1, fontFamily: Typography.fontFamily.bold, fontSize: 16, color: Colors.secondary, height: '100%',
    },
    scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },
    sectionLabel: { fontFamily: Typography.fontFamily.black, fontSize: 12, color: Colors.textMuted, letterSpacing: 1.5, marginBottom: 14 },
    stockRow: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white,
        borderRadius: 18, padding: 14, marginBottom: 10,
        borderWidth: 3, borderColor: Colors.secondary, gap: 10,
        shadowColor: Colors.secondary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 1, shadowRadius: 0,
    },
    stockRowPressed: { shadowOffset: { width: 0, height: 0 }, marginTop: 3, marginBottom: 7 },
    logo: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.secondary },
    logoText: { fontFamily: Typography.fontFamily.black, fontSize: 13, color: '#FFF' },
    stockInfo: { flex: 1 },
    stockSymbol: { fontFamily: Typography.fontFamily.black, fontSize: 15, color: Colors.secondary },
    stockName: { fontFamily: Typography.fontFamily.bold, fontSize: 11, color: Colors.textMuted, marginTop: 1 },
    priceCol: { alignItems: 'flex-end', gap: 3 },
    priceText: { fontFamily: Typography.fontFamily.black, fontSize: 15, color: Colors.secondary },
    changeBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    changeText: { fontFamily: Typography.fontFamily.black, fontSize: 11 },
});
