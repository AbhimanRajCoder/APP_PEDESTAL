import React, { useRef, useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, Pressable,
    Animated, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Clock, Zap, Star, ChevronRight, TrendingDown, Shield } from 'lucide-react-native';
import * as LucideIcons from 'lucide-react-native';
import Svg, { Rect, Circle, Line, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { SIMULATION_CASES, SimulationCase } from '@/data/simulatorCases';
import * as Haptics from 'expo-haptics';

const { width: SW } = Dimensions.get('window');

const DIFF_COLORS: Record<number, string> = {
    1: '#22C55E', 2: '#22C55E', 3: '#F59E0B', 4: '#EF4444', 5: '#DC2626',
};

function MiniChart({ color, crash }: { color: string; crash: boolean }) {
    const points = crash
        ? '10,15 30,12 50,10 70,8 90,12 110,18 130,28 150,35'
        : '10,30 30,25 50,18 70,22 90,15 110,10 130,8 150,5';
    return (
        <Svg width={120} height={40} viewBox="0 0 160 40">
            <Defs>
                <LinearGradient id={`cg-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <Stop offset="0%" stopColor={color} stopOpacity="0.4" />
                    <Stop offset="100%" stopColor={color} stopOpacity="0" />
                </LinearGradient>
            </Defs>
            <Line x1="10" y1="15" x2="10" y2="35" stroke={color} strokeWidth="1" strokeDasharray="3,3" opacity="0.3" />
            <Line x1="80" y1="5" x2="80" y2="35" stroke={color} strokeWidth="1" strokeDasharray="3,3" opacity="0.3" />
            <Line x1="150" y1="5" x2="150" y2="35" stroke={color} strokeWidth="1" strokeDasharray="3,3" opacity="0.3" />
            {/* Chart polyline using Path for compatibility */}
            <Rect x="0" y="0" width="160" height="40" fill="transparent" />
        </Svg>
    );
}

function DifficultyDots({ level }: { level: number }) {
    const col = DIFF_COLORS[level] || '#F59E0B';
    return (
        <View style={{ flexDirection: 'row', gap: 3 }}>
            {[1, 2, 3, 4, 5].map((i) => (
                <View key={i} style={{
                    width: 8, height: 8, borderRadius: 4,
                    backgroundColor: i <= level ? col : Colors.inputBorder,
                }} />
            ))}
        </View>
    );
}

function CaseCard({ item, index, onPress }: { item: SimulationCase; index: number; onPress: () => void }) {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(40)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 500, delay: index * 120, useNativeDriver: true }),
            Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 9, delay: index * 120, useNativeDriver: true }),
        ]).start();
    }, []);

    const IconComponent = (LucideIcons as any)[item.iconName] || LucideIcons.HelpCircle;

    return (
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            <Pressable
                style={({ pressed }) => [styles.caseCard, pressed && { transform: [{ scale: 0.97 }] }]}
                onPress={() => {
                    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch { }
                    onPress();
                }}
            >
                {/* Accent bar */}
                <View style={[styles.accentBar, { backgroundColor: item.accentColor }]} />

                <View style={styles.cardContent}>
                    {/* Top row */}
                    <View style={styles.cardTop}>
                        <View style={[styles.emojiContainer, { backgroundColor: item.accentColor + '15', borderColor: item.accentColor + '30' }]}>
                            <IconComponent size={26} color={item.accentColor} strokeWidth={2.5} />
                        </View>
                        <View style={styles.cardMeta}>
                            <View style={[styles.yearBadge, { backgroundColor: item.accentColor + '18' }]}>
                                <Text style={[styles.yearText, { color: item.accentColor }]}>{item.year}</Text>
                            </View>
                            <View style={styles.diffRow}>
                                <DifficultyDots level={item.difficulty} />
                                <Text style={styles.diffLabel}>{item.difficultyLabel}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Title */}
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
                    <Text style={styles.cardDesc}>{item.description}</Text>

                    {/* Stats row */}
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Clock size={14} color={Colors.textMuted} strokeWidth={2} />
                            <Text style={styles.statText}>{item.duration}</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Zap size={14} color={item.accentColor} strokeWidth={2.5} />
                            <Text style={styles.statText}>{item.startingCapital}</Text>
                        </View>
                        <View style={styles.statItem}>
                            <TrendingDown size={14} color={Colors.error} strokeWidth={2} />
                            <Text style={styles.statText}>{item.assets.length} assets</Text>
                        </View>
                    </View>

                    {/* Tags */}
                    <View style={styles.tagsRow}>
                        {item.tags.map((tag) => (
                            <View key={tag} style={styles.tag}>
                                <Text style={styles.tagText}>{tag}</Text>
                            </View>
                        ))}
                    </View>

                    {/* CTA */}
                    <View style={[styles.startBtn, { backgroundColor: item.accentColor }]}>
                        <Text style={styles.startBtnText}>Start Simulation</Text>
                        <ChevronRight size={18} color="#FFF" strokeWidth={3} />
                    </View>
                </View>
            </Pressable>
        </Animated.View>
    );
}

export default function CaseSelectionScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const headerFade = useRef(new Animated.Value(0)).current;
    const [activeCase, setActiveCase] = useState<SimulationCase | null>(null);

    useEffect(() => {
        Animated.timing(headerFade, { toValue: 1, duration: 600, useNativeDriver: true }).start();
        const randomIdx = Math.floor(Math.random() * SIMULATION_CASES.length);
        setActiveCase(SIMULATION_CASES[randomIdx]);
    }, []);

    return (
        <View style={styles.container}>
            <ScrollView
                contentContainerStyle={[styles.scrollContent, {
                    paddingTop: Math.max(insets.top, 20),
                    paddingBottom: insets.bottom + 30,
                }]}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <Animated.View style={[styles.header, { opacity: headerFade }]}>
                    <Pressable onPress={() => router.back()} style={styles.backBtn}>
                        <ArrowLeft size={22} color={Colors.secondary} strokeWidth={3} />
                    </Pressable>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.headerTitle}>Market Arena</Text>
                        <Text style={styles.headerSub}>Relive history. Master the market.</Text>
                    </View>
                    <View style={styles.xpBadge}>
                        <Shield size={14} color={Colors.neonGreen} strokeWidth={3} />
                        <Text style={styles.xpText}>SIM</Text>
                    </View>
                </Animated.View>

                {/* Hero Banner */}
                <Animated.View style={[styles.heroBanner, { opacity: headerFade }]}>
                    <View style={styles.heroGlow} />
                    <View style={styles.heroIconWrapper}>
                        <LucideIcons.BarChart2 size={36} color="#FFF" strokeWidth={2.5} />
                    </View>
                    <Text style={styles.heroTitle}>Case Simulator</Text>
                    <Text style={styles.heroDesc}>
                        Experience real financial crises. Manage a virtual portfolio.
                        Learn from historical market events.
                    </Text>
                    <View style={styles.heroStats}>
                        <View style={styles.heroStat}>
                            <Text style={styles.heroStatVal}>1</Text>
                            <Text style={styles.heroStatLabel}>Allocated Case</Text>
                        </View>
                        <View style={styles.heroStatDivider} />
                        <View style={styles.heroStat}>
                            <Text style={styles.heroStatVal}>Today</Text>
                            <Text style={styles.heroStatLabel}>Expiry</Text>
                        </View>
                        <View style={styles.heroStatDivider} />
                        <View style={styles.heroStat}>
                            <Text style={styles.heroStatVal}>∞</Text>
                            <Text style={styles.heroStatLabel}>Replays</Text>
                        </View>
                    </View>
                </Animated.View>

                {/* Cases header */}
                <Text style={styles.sectionTitle}>Your Allocated Case</Text>

                {/* Case Cards */}
                {activeCase && (
                    <CaseCard
                        key={activeCase.id}
                        item={activeCase}
                        index={0}
                        onPress={() => router.push({ pathname: '/simulator/play', params: { caseId: activeCase.id } })}
                    />
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    scrollContent: { paddingHorizontal: Spacing.xl },
    // Header
    header: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        marginBottom: Spacing.xl,
    },
    backBtn: {
        width: 44, height: 44, borderRadius: 22,
        borderWidth: 2.5, borderColor: Colors.secondary,
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: Colors.white,
    },
    headerTitle: {
        fontFamily: Typography.fontFamily.black,
        fontSize: 26, color: Colors.secondary, letterSpacing: -1,
    },
    headerSub: {
        fontFamily: Typography.fontFamily.semiBold,
        fontSize: 13, color: Colors.textMuted, marginTop: 1,
    },
    xpBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: Colors.secondary, paddingHorizontal: 12,
        paddingVertical: 6, borderRadius: 20,
    },
    xpText: {
        fontFamily: Typography.fontFamily.extraBold,
        fontSize: 12, color: Colors.neonGreen, letterSpacing: 1,
    },
    // Hero
    heroBanner: {
        backgroundColor: Colors.secondary, borderRadius: BorderRadius.xl,
        padding: Spacing.xl, marginBottom: Spacing.xxl,
        overflow: 'hidden', borderWidth: 3, borderColor: Colors.secondary,
    },
    heroGlow: {
        position: 'absolute', top: -40, right: -40,
        width: 120, height: 120, borderRadius: 60,
        backgroundColor: '#22C55E', opacity: 0.08,
    },
    heroIconWrapper: {
        width: 56, height: 56, borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    },
    heroTitle: {
        fontFamily: Typography.fontFamily.black,
        fontSize: 28, color: '#FFF', letterSpacing: -1, marginBottom: 6,
    },
    heroDesc: {
        fontFamily: Typography.fontFamily.medium,
        fontSize: 14, color: '#94A3B8', lineHeight: 20,
        marginBottom: Spacing.lg,
    },
    heroStats: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 16, padding: 14,
    },
    heroStat: { flex: 1, alignItems: 'center' },
    heroStatVal: {
        fontFamily: Typography.fontFamily.black,
        fontSize: 22, color: '#FFF',
    },
    heroStatLabel: {
        fontFamily: Typography.fontFamily.semiBold,
        fontSize: 11, color: '#64748B', marginTop: 2, textTransform: 'uppercase',
    },
    heroStatDivider: {
        width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.08)',
    },
    // Section
    sectionTitle: {
        fontFamily: Typography.fontFamily.extraBold,
        fontSize: 20, color: Colors.secondary, marginBottom: Spacing.lg,
    },
    // Case Card
    caseCard: {
        backgroundColor: Colors.white, borderRadius: BorderRadius.xl,
        borderWidth: 2, borderColor: Colors.inputBorder,
        marginBottom: Spacing.lg, overflow: 'hidden',
    },
    accentBar: { height: 4, width: '100%' },
    cardContent: { padding: Spacing.xl },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    emojiContainer: {
        width: 56, height: 56, borderRadius: 18,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1.5,
    },
    cardMeta: { alignItems: 'flex-end', gap: 6 },
    yearBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
    yearText: {
        fontFamily: Typography.fontFamily.extraBold, fontSize: 12, letterSpacing: 0.5,
    },
    diffRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    diffLabel: {
        fontFamily: Typography.fontFamily.semiBold, fontSize: 11, color: Colors.textMuted,
    },
    cardTitle: {
        fontFamily: Typography.fontFamily.black,
        fontSize: 20, color: Colors.secondary, letterSpacing: -0.5, marginBottom: 2,
    },
    cardSubtitle: {
        fontFamily: Typography.fontFamily.semiBold,
        fontSize: 13, color: Colors.textSecondary, marginBottom: 6,
    },
    cardDesc: {
        fontFamily: Typography.fontFamily.medium,
        fontSize: 13, color: Colors.textMuted, lineHeight: 19, marginBottom: 14,
    },
    statsRow: {
        flexDirection: 'row', gap: 14, marginBottom: 12,
    },
    statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    statText: {
        fontFamily: Typography.fontFamily.semiBold, fontSize: 12, color: Colors.textSecondary,
    },
    tagsRow: { flexDirection: 'row', gap: 6, marginBottom: 16 },
    tag: {
        backgroundColor: Colors.background, paddingHorizontal: 10,
        paddingVertical: 4, borderRadius: 8, borderWidth: 1,
        borderColor: Colors.inputBorder,
    },
    tagText: {
        fontFamily: Typography.fontFamily.bold, fontSize: 11, color: Colors.textMuted,
    },
    startBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        height: 48, borderRadius: 24, gap: 6,
    },
    startBtnText: {
        fontFamily: Typography.fontFamily.extraBold,
        fontSize: 15, color: '#FFF', letterSpacing: 0.3,
    },
});
