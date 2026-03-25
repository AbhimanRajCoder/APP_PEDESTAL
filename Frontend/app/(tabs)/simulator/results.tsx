import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Animated, Share } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Trophy, TrendingUp, TrendingDown, Shield, Target, BarChart3, RefreshCcw, Home, Share2, Star, Award, Zap, Brain, Eye, Search } from 'lucide-react-native';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { getCaseById } from '@/data/simulatorCases';
import * as Haptics from 'expo-haptics';

const fmt = (n: number, c: string) => {
    if (c === '₹') { if (Math.abs(n) >= 100000) return `₹${(n / 100000).toFixed(2)}L`; return `₹${n.toLocaleString('en-IN')}`; }
    return `$${n.toLocaleString('en-US')}`;
};

function AnimCounter({ value, delay = 0 }: { value: number; delay?: number }) {
    const anim = useRef(new Animated.Value(0)).current;
    const [disp, setDisp] = useState(0);
    useEffect(() => {
        Animated.timing(anim, { toValue: value, duration: 1500, delay, useNativeDriver: false }).start();
        anim.addListener(({ value: v }) => setDisp(Math.round(v)));
        return () => anim.removeAllListeners();
    }, []);
    return <Text style={st.scoreVal}>{disp}</Text>;
}

function Bar({ label, score, color, icon: Icon, delay }: { label: string; score: number; color: string; icon: React.ElementType; delay: number }) {
    const w = useRef(new Animated.Value(0)).current;
    const f = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.parallel([
            Animated.timing(w, { toValue: score, duration: 1200, delay, useNativeDriver: false }),
            Animated.timing(f, { toValue: 1, duration: 500, delay, useNativeDriver: true }),
        ]).start();
    }, []);
    return (
        <Animated.View style={[st.barRow, { opacity: f }]}>
            <View style={st.barHead}><View style={st.barLbl}><Icon size={14} color={color} strokeWidth={2.5} /><Text style={st.barLblTxt}>{label}</Text></View><AnimCounter value={score} delay={delay} /></View>
            <View style={st.barBg}><Animated.View style={[st.barFill, { backgroundColor: color, width: w.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }) }]} /></View>
        </Animated.View>
    );
}

// Strategy identity labels
const STRATEGY_LABELS: Record<string, { title: string; emoji: string; desc: string }> = {
    momentum_trader: { title: 'Momentum Trader', emoji: '⚡', desc: 'You rode the trend, buying what was hot.' },
    value_investor: { title: 'Value Investor', emoji: '💎', desc: 'You focused on fundamentals over hype.' },
    contrarian: { title: 'Contrarian', emoji: '🔄', desc: 'You bought when others sold. Brave.' },
    macro_investor: { title: 'Macro Investor', emoji: '🌍', desc: 'Big picture thinker. You played the system.' },
    panic_seller: { title: 'Panic Seller', emoji: '😰', desc: 'Fear drove your decisions in the crash.' },
    diamond_hands: { title: 'Diamond Hands', emoji: '💎', desc: 'You held through everything. For better or worse.' },
};

export default function ResultsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const p = useLocalSearchParams<{
        caseId: string; finalPortfolio: string; startingCapital: string; divScore: string;
        decisionsMade: string; currency: string; endingType: string; endingTitle: string;
        endingEmoji: string; endingDesc: string; strategyId: string; predictionScore: string;
        signalsFound: string; totalSignals: string; greed: string; fear: string;
        confidence: string; patience: string;
    }>();

    const simCase = getCaseById(p.caseId || '');
    const finalPort = Number(p.finalPortfolio) || 0;
    const startCap = Number(p.startingCapital) || 1000000;
    const currency = p.currency || '₹';
    const trades = Number(p.decisionsMade) || 0;
    const endingTitle = p.endingTitle || 'Market Participant';
    const endingEmoji = p.endingEmoji || '📊';
    const endingDesc = p.endingDesc || '';
    const strategyId = p.strategyId || 'value_investor';
    const predScore = Number(p.predictionScore) || 0;
    const sigFound = Number(p.signalsFound) || 0;
    const sigTotal = Number(p.totalSignals) || 10;
    const greed = Number(p.greed) || 50;
    const fear = Number(p.fear) || 50;
    const confidence = Number(p.confidence) || 50;
    const patience = Number(p.patience) || 50;

    const gl = finalPort - startCap;
    const glPct = ((gl / startCap) * 100).toFixed(1);
    const profit = gl >= 0;

    // Scores
    const portScore = Math.max(0, Math.min(100, 50 + (gl / startCap) * 200));
    const investigationScore = Math.round((sigFound / sigTotal) * 100);
    const predictionScoreNorm = Math.max(0, Math.min(100, 50 + predScore / 5));
    const tradeScore = Math.max(20, Math.min(100, 50 + trades * 8));
    const overall = Math.round(portScore * 0.30 + investigationScore * 0.25 + predictionScoreNorm * 0.25 + tradeScore * 0.20);

    const grade = overall >= 85 ? 'S' : overall >= 70 ? 'A' : overall >= 55 ? 'B' : overall >= 40 ? 'C' : 'D';
    const gradeColors: Record<string, string> = { S: '#FFD700', A: '#22C55E', B: '#3B82F6', C: '#F59E0B', D: '#EF4444' };
    const gc = gradeColors[grade] || '#F59E0B';

    const strategy = STRATEGY_LABELS[strategyId] || STRATEGY_LABELS.value_investor;

    const fadeA = useRef(new Animated.Value(0)).current;
    const slideA = useRef(new Animated.Value(40)).current;
    const scaleA = useRef(new Animated.Value(0.5)).current;

    useEffect(() => {
        try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success) } catch { }
        Animated.parallel([
            Animated.timing(fadeA, { toValue: 1, duration: 800, useNativeDriver: true }),
            Animated.spring(slideA, { toValue: 0, tension: 40, friction: 8, useNativeDriver: true }),
            Animated.spring(scaleA, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
        ]).start();
    }, []);

    const handleShare = async () => {
        try { await Share.share({ message: `I completed "${simCase?.title}" on Pedestal! Ending: ${endingTitle} ${endingEmoji}. Score: ${overall}/100 (Grade: ${grade}). Portfolio: ${glPct}% return. 📈` }); } catch { }
    };

    return (
        <View style={st.container}>
            <ScrollView contentContainerStyle={[st.scroll, { paddingTop: Math.max(insets.top, 20), paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>
                {/* Ending Card */}
                <Animated.View style={[st.endingCard, { opacity: fadeA, transform: [{ scale: scaleA }] }]}>
                    <Text style={st.endingEmoji}>{endingEmoji}</Text>
                    <Text style={st.endingTitle}>{endingTitle}</Text>
                    <Text style={st.endingDesc}>{endingDesc}</Text>
                </Animated.View>

                {/* Grade */}
                <Animated.View style={[st.gradeSection, { opacity: fadeA, transform: [{ scale: scaleA }] }]}>
                    <View style={[st.gradeCircle, { borderColor: gc }]}><Text style={[st.gradeTxt, { color: gc }]}>{grade}</Text></View>
                    <Text style={st.gradeLbl}>Overall Score</Text>
                    <Text style={st.gradeScore}>{overall}/100</Text>
                </Animated.View>

                {/* Strategy Identity */}
                <Animated.View style={[st.card, { opacity: fadeA, transform: [{ translateY: slideA }] }]}>
                    <Text style={st.cardTitle}>Strategy Identity</Text>
                    <View style={st.stratRow}>
                        <Text style={{ fontSize: 32 }}>{strategy.emoji}</Text>
                        <View style={{ flex: 1 }}>
                            <Text style={st.stratTitle}>{strategy.title}</Text>
                            <Text style={st.stratDesc}>{strategy.desc}</Text>
                        </View>
                    </View>
                </Animated.View>

                {/* Portfolio Summary */}
                <Animated.View style={[st.card, { opacity: fadeA, transform: [{ translateY: slideA }] }]}>
                    <Text style={st.cardTitle}>Portfolio Performance</Text>
                    <View style={st.summRow}>
                        <View style={st.summItem}><Text style={st.summLbl}>STARTING</Text><Text style={st.summSmall}>{fmt(startCap, currency)}</Text></View>
                        <View style={[st.summArrow, { backgroundColor: profit ? '#DCFCE7' : '#FEE2E2' }]}>{profit ? <TrendingUp size={16} color="#22C55E" strokeWidth={2.5} /> : <TrendingDown size={16} color="#EF4444" strokeWidth={2.5} />}</View>
                        <View style={st.summItem}><Text style={st.summLbl}>FINAL</Text><Text style={[st.summSmall, { color: profit ? '#22C55E' : '#EF4444' }]}>{fmt(finalPort, currency)}</Text></View>
                    </View>
                    <View style={[st.glBadge, { backgroundColor: profit ? '#DCFCE7' : '#FEE2E2' }]}><Text style={[st.glTxt, { color: profit ? '#16A34A' : '#DC2626' }]}>{profit ? '+' : ''}{glPct}% ({profit ? '+' : ''}{fmt(gl, currency)})</Text></View>
                </Animated.View>

                {/* Score Breakdown */}
                <Animated.View style={[st.card, { opacity: fadeA, transform: [{ translateY: slideA }] }]}>
                    <Text style={st.cardTitle}>Score Breakdown</Text>
                    <Bar label="Portfolio Value" score={Math.round(portScore)} color="#22C55E" icon={BarChart3} delay={300} />
                    <Bar label="Investigation" score={investigationScore} color="#8B5CF6" icon={Search} delay={500} />
                    <Bar label="Predictions" score={Math.round(predictionScoreNorm)} color="#F59E0B" icon={Target} delay={700} />
                    <Bar label="Trading Activity" score={Math.round(tradeScore)} color="#3B82F6" icon={Zap} delay={900} />
                </Animated.View>

                {/* Psychology Profile */}
                <Animated.View style={[st.card, { opacity: fadeA, transform: [{ translateY: slideA }] }]}>
                    <Text style={st.cardTitle}>Psychology Profile</Text>
                    {[{ l: 'Greed', v: greed, c: '#F59E0B' }, { l: 'Fear', v: fear, c: '#EF4444' }, { l: 'Confidence', v: confidence, c: '#3B82F6' }, { l: 'Patience', v: patience, c: '#22C55E' }].map(p => (
                        <View key={p.l} style={st.psychRow}>
                            <Text style={st.psychLbl}>{p.l}</Text>
                            <View style={st.psychBg}><View style={[st.psychFill, { width: `${p.v}%`, backgroundColor: p.c }]} /></View>
                            <Text style={[st.psychVal, { color: p.c }]}>{p.v}</Text>
                        </View>
                    ))}
                </Animated.View>

                {/* Stats */}
                <Animated.View style={[st.card, { opacity: fadeA, transform: [{ translateY: slideA }] }]}>
                    <Text style={st.cardTitle}>Game Stats</Text>
                    <View style={st.statGrid}>
                        <View style={st.statItem}><Text style={st.statVal}>{trades}</Text><Text style={st.statLbl}>Trades Made</Text></View>
                        <View style={st.statItem}><Text style={st.statVal}>{sigFound}/{sigTotal}</Text><Text style={st.statLbl}>Signals Found</Text></View>
                        <View style={st.statItem}><Text style={[st.statVal, { color: predScore >= 0 ? '#22C55E' : '#EF4444' }]}>{predScore >= 0 ? '+' : ''}{predScore}</Text><Text style={st.statLbl}>Prediction Pts</Text></View>
                    </View>
                </Animated.View>

                {/* Historical Aftermath */}
                {simCase?.aftermath && (
                    <Animated.View style={[st.card, { opacity: fadeA }]}>
                        <Text style={st.cardTitle}>The Aftermath</Text>
                        <Text style={st.bodyTxt}>{simCase.aftermath}</Text>
                    </Animated.View>
                )}

                {/* Key Takeaways */}
                {simCase && (
                    <Animated.View style={[st.darkCard, { opacity: fadeA }]}>
                        <View style={st.insightHead}><Award size={18} color={Colors.primary} strokeWidth={2.5} /><Text style={st.insightTitle}>Key Takeaways</Text></View>
                        {simCase.learningObjectives.map((obj: string, idx: number) => (
                            <View key={idx} style={st.learnItem}><View style={st.learnDot} /><Text style={st.learnTxt}>{obj}</Text></View>
                        ))}
                    </Animated.View>
                )}

                {/* Actions */}
                <View style={st.actions}>
                    <Pressable style={[st.actionBtn, { backgroundColor: simCase?.accentColor || Colors.primary }]} onPress={() => { try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium) } catch { } router.replace({ pathname: '/simulator/play', params: { caseId: p.caseId } }) }}>
                        <RefreshCcw size={18} color="#FFF" strokeWidth={2.5} /><Text style={st.actionBtnTxt}>Replay</Text>
                    </Pressable>
                    <View style={st.actionRow}>
                        <Pressable style={st.secBtn} onPress={handleShare}><Share2 size={18} color={Colors.secondary} strokeWidth={2.5} /><Text style={st.secBtnTxt}>Share</Text></Pressable>
                        <Pressable style={st.secBtn} onPress={() => router.replace('/simulator')}><Home size={18} color={Colors.secondary} strokeWidth={2.5} /><Text style={st.secBtnTxt}>Home</Text></Pressable>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const st = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    scroll: { paddingHorizontal: Spacing.xl },
    // Ending
    endingCard: { backgroundColor: Colors.secondary, borderRadius: 28, padding: 28, alignItems: 'center', marginBottom: Spacing.xl },
    endingEmoji: { fontSize: 56, marginBottom: 8 },
    endingTitle: { fontFamily: Typography.fontFamily.black, fontSize: 28, color: '#FFF', letterSpacing: -1 },
    endingDesc: { fontFamily: Typography.fontFamily.medium, fontSize: 14, color: '#94A3B8', lineHeight: 21, textAlign: 'center', marginTop: 8 },
    // Grade
    gradeSection: { alignItems: 'center', marginBottom: Spacing.xxl },
    gradeCircle: { width: 90, height: 90, borderRadius: 45, borderWidth: 5, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.white, marginBottom: 8 },
    gradeTxt: { fontFamily: Typography.fontFamily.black, fontSize: 40 },
    gradeLbl: { fontFamily: Typography.fontFamily.semiBold, fontSize: 12, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
    gradeScore: { fontFamily: Typography.fontFamily.black, fontSize: 18, color: Colors.secondary, marginTop: 2 },
    // Cards
    card: { backgroundColor: Colors.white, borderRadius: BorderRadius.xl, padding: Spacing.xl, borderWidth: 2, borderColor: Colors.inputBorder, marginBottom: Spacing.lg },
    darkCard: { backgroundColor: Colors.secondary, borderRadius: BorderRadius.xl, padding: Spacing.xl, marginBottom: Spacing.lg },
    cardTitle: { fontFamily: Typography.fontFamily.extraBold, fontSize: 16, color: Colors.secondary, marginBottom: 16 },
    bodyTxt: { fontFamily: Typography.fontFamily.medium, fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
    // Strategy
    stratRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    stratTitle: { fontFamily: Typography.fontFamily.black, fontSize: 18, color: Colors.secondary },
    stratDesc: { fontFamily: Typography.fontFamily.medium, fontSize: 13, color: Colors.textMuted, marginTop: 2 },
    // Summary
    summRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
    summItem: { alignItems: 'center', flex: 1 },
    summLbl: { fontFamily: Typography.fontFamily.semiBold, fontSize: 10, color: Colors.textMuted, textTransform: 'uppercase', marginBottom: 4 },
    summSmall: { fontFamily: Typography.fontFamily.black, fontSize: 17, color: Colors.secondary },
    summArrow: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginHorizontal: 8 },
    glBadge: { alignSelf: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 14 },
    glTxt: { fontFamily: Typography.fontFamily.extraBold, fontSize: 14 },
    // Scores
    barRow: { marginBottom: 16 },
    barHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    barLbl: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    barLblTxt: { fontFamily: Typography.fontFamily.bold, fontSize: 13, color: Colors.secondary },
    scoreVal: { fontFamily: Typography.fontFamily.extraBold, fontSize: 14, color: Colors.secondary },
    barBg: { height: 8, backgroundColor: Colors.progressBg, borderRadius: 4, overflow: 'hidden' },
    barFill: { height: '100%', borderRadius: 4 },
    // Psychology
    psychRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
    psychLbl: { fontFamily: Typography.fontFamily.bold, fontSize: 12, color: Colors.secondary, width: 80 },
    psychBg: { flex: 1, height: 8, backgroundColor: Colors.progressBg, borderRadius: 4, overflow: 'hidden' },
    psychFill: { height: '100%', borderRadius: 4 },
    psychVal: { fontFamily: Typography.fontFamily.black, fontSize: 13, width: 30, textAlign: 'right' },
    // Stats
    statGrid: { flexDirection: 'row', gap: 10 },
    statItem: { flex: 1, backgroundColor: Colors.background, borderRadius: 14, padding: 14, alignItems: 'center' },
    statVal: { fontFamily: Typography.fontFamily.black, fontSize: 20, color: Colors.secondary },
    statLbl: { fontFamily: Typography.fontFamily.bold, fontSize: 11, color: Colors.textMuted, marginTop: 4, textAlign: 'center' },
    // Insights
    insightHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
    insightTitle: { fontFamily: Typography.fontFamily.extraBold, fontSize: 15, color: '#FFF' },
    learnItem: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
    learnDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.neonGreen },
    learnTxt: { fontFamily: Typography.fontFamily.semiBold, fontSize: 13, color: '#CBD5E1', flex: 1 },
    // Actions
    actions: { gap: 12, marginTop: Spacing.md },
    actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 56, borderRadius: 28, gap: 8, borderWidth: 3, borderColor: Colors.secondary },
    actionBtnTxt: { fontFamily: Typography.fontFamily.extraBold, fontSize: 16, color: '#FFF' },
    actionRow: { flexDirection: 'row', gap: 12 },
    secBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 48, borderRadius: 24, gap: 6, backgroundColor: Colors.white, borderWidth: 2, borderColor: Colors.inputBorder },
    secBtnTxt: { fontFamily: Typography.fontFamily.bold, fontSize: 14, color: Colors.secondary },
});
