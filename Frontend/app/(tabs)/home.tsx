import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    Dimensions,
    Animated,
    Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Line } from 'react-native-svg';
import {
    Zap,
    BookOpen,
    PieChart,
    Search,
    Bell,
    EyeOff,
    Plus,
    Lock,
} from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

import { TrendingUp, TrendingDown, Play, Trophy, Swords, Star, ArrowRight, Flame } from 'lucide-react-native';

import { useAuth } from '@/context/AuthContext';
import { loadPortfolio, calculatePortfolioValue, INITIAL_CASH } from '@/data/tradeEngine';
import { MOCK_STOCKS } from '@/data/mockStocks';
import { LEARN_MODULES, getAllLessonsFlat } from '@/data/learnModules';
import { fetchLatestPrices } from '@/data/yahooFinance';

export default function DashboardScreen() {
    const bounceAnim = useRef(new Animated.Value(0)).current;
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { profile, session } = useAuth();
    const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

    const [portfolioVal, setPortfolioVal] = useState(INITIAL_CASH);
    const [portfolioPL, setPortfolioPL] = useState(0);

    const pulseAnim = useRef(new Animated.Value(1)).current;

    const [currentLesson, setCurrentLesson] = useState<{ title: string, chapterTitle: string, categoryId: string, categoryTitle: string, xpReward: number, unitNumber: number, hasProgress: boolean } | null>(null);
    const [learningProgress, setLearningProgress] = useState(0);
    const [userRankNum, setUserRankNum] = useState<number | null>(null);

    useFocusEffect(
        useCallback(() => {
            let isActive = true;

            const fetchData = async () => {
                try {
                    // Portfolio logic
                    const port = await loadPortfolio(session?.access_token);
                    const latestPrices = await fetchLatestPrices();
                    
                    // Fallback to mock prices for stocks not in Yahoo map
                    const initialPrices: Record<string, number> = {};
                    MOCK_STOCKS.forEach(s => { initialPrices[s.symbol] = latestPrices[s.symbol] || s.price; });
                    
                    const { totalValue, totalPL, shortPL, totalMarginHeld } = calculatePortfolioValue(port.holdings, initialPrices, port.shorts);

                    if (isActive) {
                        setPortfolioVal(totalValue + port.cash + totalMarginHeld + shortPL);
                        setPortfolioPL(totalPL);
                    }

                    // Learn progress logic
                    const keys = await AsyncStorage.getAllKeys();
                    const progressKeys = keys.filter(k => k.startsWith('learn_progress_'));
                    const completed = new Set<string>();
                    for (const key of progressKeys) {
                        const val = await AsyncStorage.getItem(key);
                        if (val === 'completed') {
                            completed.add(key.replace('learn_progress_', ''));
                        }
                    }

                    // Sync with Supabase if logged in
                    if (session?.access_token && BACKEND_URL) {
                        try {
                            const res = await fetch(`${BACKEND_URL}/api/progress`, {
                                headers: { 'Authorization': `Bearer ${session.access_token}` }
                            });
                            if (res.ok) {
                                const data = await res.json();
                                if (data.progress) {
                                    data.progress.forEach((item: any) => {
                                        if (item.is_completed) {
                                            completed.add(item.lesson_id);
                                            AsyncStorage.setItem(`learn_progress_${item.lesson_id}`, 'completed');
                                        }
                                    });
                                }
                            }
                        } catch (err) {
                            console.warn('Dashboard sync error:', err);
                        }
                        try {
                            const res = await fetch(`${BACKEND_URL}/api/leaderboard`, {
                                headers: { 'Authorization': `Bearer ${session.access_token}` }
                            });
                            if (res.ok) {
                                const data = await res.json();
                                if (data.user_rank) {
                                    setUserRankNum(data.user_rank.rank);
                                }
                            }
                        } catch (err) {
                            console.warn('Dashboard leaderboard sync error:', err);
                        }
                    }

                    const allFlat = getAllLessonsFlat();
                    const nextLesson = allFlat.find(l => !completed.has(l.id));

                    if (isActive) {
                        if (nextLesson) {
                            const cat = LEARN_MODULES.find(c => c.id === nextLesson.categoryId);
                            let unitNumber = 1;
                            if (cat) {
                                unitNumber = cat.chapters.findIndex(c => c.lessons.some(l => l.id === nextLesson.id)) + 1;
                            }

                            setCurrentLesson({
                                title: nextLesson.title,
                                chapterTitle: nextLesson.chapterTitle.toUpperCase(),
                                categoryId: nextLesson.categoryId,
                                categoryTitle: nextLesson.categoryTitle,
                                xpReward: nextLesson.xpReward,
                                unitNumber: unitNumber,
                                hasProgress: completed.size > 0
                            });

                            if (cat) {
                                const ch = cat.chapters.find(c => c.lessons.some(l => l.id === nextLesson.id));
                                if (ch) {
                                    const chTotal = ch.lessons.length;
                                    const chDone = ch.lessons.filter(l => completed.has(l.id)).length;
                                    setLearningProgress(chTotal > 0 ? (chDone / chTotal) * 100 : 0);
                                }
                            }
                        } else {
                            setCurrentLesson({
                                title: "All Lessons Completed!",
                                chapterTitle: "ROADMAP FINISHED",
                                categoryId: LEARN_MODULES[0].id,
                                categoryTitle: "FINAL PROGRESS",
                                xpReward: 0,
                                unitNumber: 1,
                                hasProgress: true
                            });
                            setLearningProgress(100);
                        }
                    }
                } catch (e) {
                    console.warn('Dashboard fetch error:', e);
                }
            };

            fetchData();

            return () => {
                isActive = false;
            };
        }, [])
    );

    useEffect(() => {
        // Bounce for the current node
        Animated.loop(
            Animated.sequence([
                Animated.timing(bounceAnim, {
                    toValue: -6,
                    duration: 600,
                    useNativeDriver: true,
                }),
                Animated.timing(bounceAnim, {
                    toValue: 0,
                    duration: 600,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // Pulse for resume card
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.03, duration: 1200, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
            ])
        ).start();
    }, [bounceAnim, pulseAnim]);

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={[
                styles.scrollContent,
                { paddingTop: Math.max(insets.top, 20) }
            ]}
            showsVerticalScrollIndicator={false}
        >
            {/* Decorative Top Background (Cooper style curve inspiration) */}
            <View style={styles.topDecor} />

            {/* Header (Cooper + Neobank style) */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <View style={styles.profileChip}>
                        <Zap size={16} color={Colors.neonGreen} strokeWidth={2.5} fill={Colors.neonGreen} />
                        <Text style={styles.profileChipText}>{profile?.xp_total || 0} XP</Text>
                    </View>
                    <View style={styles.avatarContainer}>
                        <Text style={styles.avatarText}>
                            {profile?.display_name
                                ? profile.display_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
                                : 'UU'}
                        </Text>
                        {/* Notification Dot */}
                        <View style={styles.notificationDot} />
                    </View>
                </View>

                <Text style={styles.greeting}>Hello {profile?.display_name?.split(' ')[0] || 'User'}</Text>
                <Text style={styles.subGreeting}>Make your day easy with us</Text>
            </View>

            {/* Gen Z Brutalist Net Worth Section */}
            <View style={styles.netWorthCard}>
                <View style={styles.nwTopRow}>
                    <Text style={styles.nwLabel}>VIRTUAL NET WORTH</Text>
                    <View style={styles.liveBadge}>
                        <View style={styles.liveDot} />
                        <Text style={styles.liveText}>LIVE</Text>
                    </View>
                </View>

                <Text style={styles.nwValue}>
                    {'\u20B9'}{portfolioVal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </Text>

                <View style={styles.nwBottomRow}>
                    <View style={[styles.plPill, { borderColor: portfolioPL >= 0 ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)', backgroundColor: portfolioPL >= 0 ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)' }]}>
                        {portfolioPL >= 0 ?
                            <TrendingUp size={16} color={Colors.neonGreen} strokeWidth={3} /> :
                            <TrendingDown size={16} color={Colors.error} strokeWidth={3} />
                        }
                        <Text style={[styles.plText, { color: portfolioPL >= 0 ? Colors.neonGreen : Colors.error }]}>
                            {portfolioPL >= 0 ? '+' : ''}{'\u20B9'}{portfolioPL.toLocaleString('en-IN')}
                        </Text>
                    </View>
                    <Pressable style={styles.depositBtn}>
                        <Plus size={18} color={Colors.white} strokeWidth={3} />
                    </Pressable>
                </View>
            </View>

            {/* Bento Box Grid (Cooper style) */}
            <View style={styles.bentoGrid}>
                {/* Left Tall Card (Pastel Purple) */}
                <Pressable
                    style={({ pressed }) => [styles.bentoLeft, pressed && { opacity: 0.9 }]}
                    onPress={() => router.push('/simulator')}
                >
                    <View style={styles.bentoIconWhite}>
                        <Swords size={20} color={Colors.secondary} strokeWidth={2.5} />
                    </View>
                    <View style={styles.bentoLeftBottom}>
                        <Text style={styles.bentoLeftTitle}>Market{'\n'}Arena</Text>
                        <Text style={styles.bentoLeftSub}>Relive history</Text>
                    </View>
                    {/* Decorative faint sunburst could go here */}
                </Pressable>

                {/* Right Column */}
                <View style={styles.bentoRight}>
                    {/* Top Right Card (Pastel Yellow) */}
                    <Pressable
                        style={({ pressed }) => [styles.bentoTopRight, pressed && { opacity: 0.9 }]}
                        onPress={() => router.push('/streaks')}
                    >
                        <View style={styles.newBadge}>
                            <Text style={styles.newBadgeText}>
                                {profile?.streak_days || 0}d
                            </Text>
                        </View>
                        <View style={styles.bentoIconOutline}>
                            <Flame size={20} color={Colors.streak} fill={Colors.streak} strokeWidth={2.5} />
                        </View>
                        <Text style={styles.bentoSmallTitle}>Streaks</Text>
                    </Pressable>

                    {/* Bottom Right Card (Dark/Black) */}
                    <Pressable
                        style={({ pressed }) => [styles.bentoBottomRight, pressed && { opacity: 0.9 }]}
                        onPress={() => router.push('/leaderboard')}
                    >
                        <View style={styles.bentoIconDarkOutline}>
                            <Trophy size={20} color={Colors.white} strokeWidth={2.5} />
                        </View>
                        <Text style={styles.bentoDarkTitle}>
                            {userRankNum ? `Rank\n#${userRankNum}` : `Leader\nboard`}
                        </Text>
                    </Pressable>
                </View>
            </View>

            {/* Daily Check-in Banner */}
            <Pressable
                style={({ pressed }) => [styles.learnBanner, styles.dailyCheckinBanner, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
                onPress={() => router.push('/daily-checkin')}
            >
                <View style={styles.learnBannerLeft}>
                    <Text style={styles.learnBannerEmoji}>🌙</Text>
                    <View>
                        <Text style={[styles.learnBannerTitle, { color: Colors.white }]}>9 PM Check-in</Text>
                        <Text style={[styles.learnBannerSub, { color: 'rgba(255,255,255,0.7)' }]}>Reflect on today's spending</Text>
                    </View>
                </View>
                <View style={[styles.learnBannerBtn, { backgroundColor: Colors.white, borderColor: Colors.white }]}>
                    <Text style={[styles.learnBannerBtnText, { color: Colors.primary }]}>GO</Text>
                </View>
            </Pressable>


            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Continue Learning</Text>
            </View>

            {/* New Resume Card (from learn.tsx) */}
            <Animated.View style={{ transform: [{ scale: pulseAnim }], marginBottom: Spacing.xxl }}>
                <Pressable
                    style={({ pressed }) => [
                        styles.resumeCard,
                        pressed && { transform: [{ scale: 0.97 }] },
                    ]}
                    onPress={() => router.push({
                        pathname: '/learn/roadmap',
                        params: { categoryId: currentLesson?.categoryId || LEARN_MODULES[0].id }
                    } as any)}
                >
                    <View style={styles.resumeGlow} />
                    <View style={styles.resumeTop}>
                        <View style={styles.resumeBadge}>
                            <Play size={12} color="#FFF" strokeWidth={3} fill="#FFF" />
                            <Text style={styles.resumeBadgeText}>
                                {currentLesson?.hasProgress ? 'RESUME' : 'START'}
                            </Text>
                        </View>
                        <View style={styles.resumeXp}>
                            <Star size={14} color="#F59E0B" strokeWidth={3} fill="#F59E0B" />
                            <Text style={styles.resumeXpText}>
                                +{currentLesson?.xpReward || 0} XP
                            </Text>
                        </View>
                    </View>

                    <Text style={styles.resumeEmoji}>🎯</Text>

                    <Text style={styles.resumeModuleLabel}>
                        {currentLesson?.categoryTitle || 'PERSONAL FINANCE'}
                    </Text>
                    <Text style={styles.resumeChapterTitle} numberOfLines={1}>
                        {currentLesson?.title || 'Start Learning'}
                    </Text>
                    <Text style={styles.resumeChapterSub}>
                        Unit {currentLesson?.unitNumber || 1}: {currentLesson?.chapterTitle || 'ROADMAP'}
                    </Text>

                    <View style={styles.resumeBtn}>
                        <Text style={styles.resumeBtnText}>
                            {currentLesson?.hasProgress ? 'Continue Learning' : 'Start Learning'}
                        </Text>
                        <ArrowRight size={20} color={Colors.secondary} strokeWidth={3} />
                    </View>
                </Pressable>
            </Animated.View>

            <View style={{ height: 60 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scrollContent: {
        paddingHorizontal: Spacing.xl,
        paddingBottom: 100,
    },
    topDecor: {
        position: 'absolute',
        top: -150,
        right: -100,
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: Colors.purpleLight,
        opacity: 0.6,
    },
    // Header
    header: {
        marginBottom: Spacing.xl,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    profileChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.secondary,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
    },
    profileChipText: {
        fontFamily: Typography.fontFamily.bold,
        fontSize: 14,
        color: Colors.white,
    },
    avatarContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.pastelYellow,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontFamily: Typography.fontFamily.extraBold,
        fontSize: 16,
        color: Colors.secondary,
    },
    notificationDot: {
        position: 'absolute',
        top: 2,
        right: 2,
        width: 10,
        height: 10,
        backgroundColor: Colors.error,
        borderRadius: 5,
        borderWidth: 2,
        borderColor: Colors.background,
    },
    greeting: {
        fontFamily: Typography.fontFamily.extraBold,
        fontSize: 34,
        color: Colors.secondary,
        letterSpacing: -0.5,
        marginBottom: 4,
    },
    subGreeting: {
        fontFamily: Typography.fontFamily.medium,
        fontSize: 16,
        color: Colors.textSecondary,
    },
    // Net Worth Card (Gen Z Brutalist)
    netWorthCard: {
        backgroundColor: Colors.secondary,
        borderRadius: 24,
        padding: 24,
        marginBottom: Spacing.xxxl,
        borderWidth: 4,
        borderColor: Colors.secondary,
        shadowColor: Colors.secondary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 1,
        shadowRadius: 0,
        elevation: 8,
    },
    nwTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    nwLabel: {
        fontFamily: Typography.fontFamily.extraBold,
        fontSize: 13,
        color: '#A1A1AA',
        letterSpacing: 1.5,
    },
    liveBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(34, 197, 94, 0.15)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
    },
    liveDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: Colors.neonGreen,
    },
    liveText: {
        fontFamily: Typography.fontFamily.black,
        fontSize: 10,
        color: Colors.neonGreen,
    },
    nwValue: {
        fontFamily: Typography.fontFamily.black,
        fontSize: 42,
        color: Colors.white,
        letterSpacing: -1.5,
        marginBottom: 20,
    },
    nwBottomRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    plPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(34, 197, 94, 0.15)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        gap: 6,
        borderWidth: 1,
        borderColor: 'rgba(34, 197, 94, 0.3)',
    },
    plText: {
        fontFamily: Typography.fontFamily.black,
        fontSize: 14,
        color: Colors.neonGreen,
    },
    depositBtn: {
        backgroundColor: Colors.neonGreen,
        width: 44,
        height: 44,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#16A34A',
    },
    // Bento Box Grid
    bentoGrid: {
        flexDirection: 'row',
        gap: Spacing.md,
        height: 240,
        marginBottom: Spacing.xxxl,
    },
    bentoLeft: {
        flex: 1,
        backgroundColor: Colors.pastelPurple,
        borderRadius: 32,
        padding: Spacing.xl,
        justifyContent: 'space-between',
    },
    bentoIconWhite: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.white,
        alignItems: 'center',
        justifyContent: 'center',
    },
    bentoLeftBottom: {
        gap: 4,
    },
    bentoLeftTitle: {
        fontFamily: Typography.fontFamily.extraBold,
        fontSize: 22,
        color: Colors.secondary,
        lineHeight: 26,
    },
    bentoLeftSub: {
        fontFamily: Typography.fontFamily.medium,
        fontSize: 14,
        color: '#8A7BB3', // Slightly darker purple
    },
    bentoRight: {
        flex: 1,
        gap: Spacing.md,
    },
    bentoTopRight: {
        flex: 1,
        backgroundColor: Colors.pastelYellow,
        borderRadius: 32,
        padding: Spacing.lg,
        justifyContent: 'space-between',
        position: 'relative',
    },
    newBadge: {
        position: 'absolute',
        top: 16,
        right: 16,
        backgroundColor: Colors.pastelRed,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    newBadgeText: {
        fontFamily: Typography.fontFamily.bold,
        fontSize: 12,
        color: Colors.white,
    },
    bentoIconOutline: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: 'rgba(0,0,0,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    bentoSmallTitle: {
        fontFamily: Typography.fontFamily.bold,
        fontSize: 18,
        color: Colors.secondary,
    },
    bentoBottomRight: {
        flex: 1,
        backgroundColor: Colors.darkCard,
        borderRadius: 32,
        padding: Spacing.lg,
        justifyContent: 'space-between',
    },
    bentoIconDarkOutline: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    bentoDarkTitle: {
        fontFamily: Typography.fontFamily.bold,
        fontSize: 18,
        color: Colors.white,
        lineHeight: 22,
    },
    // Section Header
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    sectionTitle: {
        fontFamily: Typography.fontFamily.bold,
        fontSize: 18,
        color: Colors.secondary,
    },
    seeAll: {
        fontFamily: Typography.fontFamily.semiBold,
        fontSize: 14,
        color: '#999',
    },
    // ── Resume Card ──
    resumeCard: {
        backgroundColor: Colors.secondary,
        borderRadius: 28,
        padding: 24,
        borderWidth: 3,
        borderColor: Colors.secondary,
        overflow: 'hidden',
        shadowColor: Colors.secondary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 1,
        shadowRadius: 0,
        elevation: 8,
    },
    resumeGlow: {
        position: 'absolute',
        top: -60,
        right: -60,
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: Colors.neonGreen,
        opacity: 0.08,
    },
    resumeTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    resumeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: Colors.neonGreen,
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 12,
    },
    resumeBadgeText: {
        fontFamily: Typography.fontFamily.black,
        fontSize: 12,
        color: Colors.secondary,
        letterSpacing: 1,
    },
    resumeXp: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    resumeXpText: {
        fontFamily: Typography.fontFamily.black,
        fontSize: 14,
        color: '#FBBF24',
    },
    resumeEmoji: {
        fontSize: 48,
        marginBottom: 10,
    },
    resumeModuleLabel: {
        fontFamily: Typography.fontFamily.black,
        fontSize: 12,
        color: Colors.neonGreen,
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    resumeChapterTitle: {
        fontFamily: Typography.fontFamily.black,
        fontSize: 26,
        color: Colors.white,
        letterSpacing: -1,
        lineHeight: 30,
    },
    resumeChapterSub: {
        fontFamily: Typography.fontFamily.bold,
        fontSize: 15,
        color: Colors.textMuted,
        marginTop: 6,
    },
    resumeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.neonGreen,
        height: 56,
        borderRadius: 28,
        gap: 10,
        marginTop: 20,
        borderWidth: 3,
        borderColor: Colors.secondary,
    },
    resumeBtnText: {
        fontFamily: Typography.fontFamily.black,
        fontSize: 17,
        color: Colors.secondary,
        letterSpacing: 0.5,
    },
    // Learning CTA Banner
    learnBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Colors.white,
        borderRadius: 24,
        padding: 18,
        marginBottom: Spacing.xxxl,
        borderWidth: 3,
        borderColor: Colors.secondary,
        shadowColor: Colors.secondary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 1,
        shadowRadius: 0,
        elevation: 4,
    },
    dailyCheckinBanner: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
        shadowColor: Colors.primary,
        marginBottom: Spacing.md,
    },
    learnBannerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    learnBannerEmoji: { fontSize: 32 },
    learnBannerTitle: {
        fontFamily: Typography.fontFamily.black,
        fontSize: 18,
        color: Colors.secondary,
        letterSpacing: -0.5,
    },
    learnBannerSub: {
        fontFamily: Typography.fontFamily.bold,
        fontSize: 13,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    learnBannerBtn: {
        backgroundColor: Colors.secondary,
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: Colors.secondary,
    },
    learnBannerBtnText: {
        fontFamily: Typography.fontFamily.black,
        fontSize: 14,
        color: Colors.neonGreen,
        letterSpacing: 1,
    },
});