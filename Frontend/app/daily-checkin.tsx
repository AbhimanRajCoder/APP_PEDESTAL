import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Animated,
    PanResponder,
    Dimensions,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    ArrowLeft, Coffee, Car, ShoppingBag, Gamepad2,
    FileText, GraduationCap, MoreHorizontal, Check, Flame, Plus
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Spacing, Typography } from '@/constants/theme';
import Svg, { Defs, Pattern, Circle, Rect } from 'react-native-svg';
import { useAuth } from '@/context/AuthContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAX_AMOUNT = 10000;
const SNAP_STEP = 50;

// ─── Types ──────────────────────────────────────────────────
type Classification = 'need' | 'want';
type Category = 'food' | 'transport' | 'shopping' | 'entertainment' | 'bills' | 'education' | 'other';
type Step = 'INPUT' | 'SUCCESS';

interface CheckinEntry {
    amount: number;
    classification: Classification;
    category: Category;
    score: number;
    date: string;
    createdAt: string;
}

interface StorageData {
    streak: number;
    lastCheckinDate: string | null;
}

// ─── Constants ───────────────────────────────────────────────
const CATEGORIES: { id: Category; icon: React.ComponentType<any>; label: string }[] = [
    { id: 'food', icon: Coffee, label: 'Food' },
    { id: 'transport', icon: Car, label: 'Transport' },
    { id: 'shopping', icon: ShoppingBag, label: 'Shopping' },
    { id: 'entertainment', icon: Gamepad2, label: 'Fun' },
    { id: 'bills', icon: FileText, label: 'Bills' },
    { id: 'education', icon: GraduationCap, label: 'Edu' },
    { id: 'other', icon: MoreHorizontal, label: 'Other' },
];

const STORAGE_KEY = 'pedestal_checkin_streak';
const CHECKINS_KEY = 'pedestal_daily_checkins';

// ─── Helpers ─────────────────────────────────────────────────
function todayISO(): string {
    return new Date().toISOString().split('T')[0];
}

function daysBetween(a: string, b: string): number {
    const msPerDay = 86400000;
    return Math.round((new Date(b).getTime() - new Date(a).getTime()) / msPerDay);
}

function calculateScore(amount: number, classification: Classification, category: Category): number {
    let score = 100;
    if (classification === 'want') score -= 15;
    if (amount > 3000) score -= 10;
    if (amount > 7000) score -= 10;
    if (category === 'entertainment') score -= 5;
    if (classification === 'need' && amount < 1000) score += 5;
    return Math.max(0, Math.min(100, score));
}

function scoreColor(score: number): string {
    if (score >= 80) return Colors.neonGreen;
    if (score >= 50) return Colors.warning;
    return Colors.error;
}

// ─── Main Component ──────────────────────────────────────────
export default function DailyCheckInScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    // Step state
    const [step, setStep] = useState<Step>('INPUT');

    // Form state
    const [amount, setAmount] = useState(0);
    const [classification, setClassification] = useState<Classification | null>(null);
    const [category, setCategory] = useState<Category | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Streak state
    const [streak, setStreak] = useState(0);
    const { session, refreshProfile } = useAuth();
    const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
    const [savedEntry, setSavedEntry] = useState<CheckinEntry | null>(null);
    // All of today's entries (updated after every save)
    const [todayEntries, setTodayEntries] = useState<CheckinEntry[]>([]);

    // Slider state
    const [sliderWidth, setSliderWidth] = useState(SCREEN_WIDTH - Spacing.xxl * 2 - Spacing.xl * 2);

    // Animations
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const successFade = useRef(new Animated.Value(0)).current;
    const saveButtonScale = useRef(new Animated.Value(1)).current;

    // Load streak on mount
    useEffect(() => {
        (async () => {
            try {
                // Fetch from backend
                const res = await fetch(`${BACKEND_URL}/api/progress`, {
                    headers: { 'Authorization': `Bearer ${session?.access_token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setStreak(data.current_streak);
                } else {
                    // Fallback to local
                    const raw = await AsyncStorage.getItem(STORAGE_KEY);
                    const data: StorageData = raw ? JSON.parse(raw) : { streak: 0, lastCheckinDate: null };
                    setStreak(data.streak);
                }
            } catch { /* silent */ }
        })();
    }, []);

    // ── Slider PanResponder ──────────────────────────────────
    const thumbPosRef = useRef(0);
    const panX = useRef(new Animated.Value(0)).current;

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {
                panX.setOffset(thumbPosRef.current);
                panX.setValue(0);
            },
            onPanResponderMove: Animated.event([null, { dx: panX }], { useNativeDriver: false }),
            onPanResponderRelease: () => {
                panX.flattenOffset();
            },
        })
    ).current;

    useEffect(() => {
        const id = panX.addListener(({ value }) => {
            const clamped = Math.max(0, Math.min(sliderWidth, value));
            thumbPosRef.current = clamped;
            const pct = clamped / sliderWidth;
            const raw = Math.round((pct * MAX_AMOUNT) / SNAP_STEP) * SNAP_STEP;
            setAmount(Math.max(0, Math.min(MAX_AMOUNT, raw)));
        });
        return () => panX.removeListener(id);
    }, [sliderWidth]);

    // Thumb left position in px
    const thumbLeft = sliderWidth > 0 ? (amount / MAX_AMOUNT) * sliderWidth : 0;

    // ── Save Handler ─────────────────────────────────────────
    const handleSave = useCallback(async () => {
        if (!classification || !category || isSaving) return;

        // Press animation
        Animated.sequence([
            Animated.spring(saveButtonScale, { toValue: 0.94, useNativeDriver: true, speed: 40 }),
            Animated.spring(saveButtonScale, { toValue: 1, useNativeDriver: true, speed: 40 }),
        ]).start();

        setIsSaving(true);
        try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch { }

        const today = todayISO();
        const score = calculateScore(amount, classification, category);

        const entry: CheckinEntry = {
            amount,
            classification,
            category,
            score,
            date: today,
            createdAt: new Date().toISOString(),
        };

        // Update streak
        try {
            const raw = await AsyncStorage.getItem(STORAGE_KEY);
            const data: StorageData = raw ? JSON.parse(raw) : { streak: 0, lastCheckinDate: null };
            const { lastCheckinDate, streak: currentStreak } = data;

            let newStreak = currentStreak;
            if (!lastCheckinDate) {
                newStreak = 1;
            } else {
                const diff = daysBetween(lastCheckinDate, today);
                if (diff === 0) newStreak = currentStreak; // same day, no change
                else if (diff === 1) newStreak = currentStreak + 1;
                else newStreak = 1; // gap, reset
            }

            const newData: StorageData = { streak: newStreak, lastCheckinDate: today };
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
            setStreak(newStreak);

            // Sync with backend
            try {
                const res = await fetch(`${BACKEND_URL}/api/progress/checkin`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${session?.access_token}` }
                });
                if (res.ok) {
                    const resData = await res.json();
                    if (resData.new_streak) setStreak(resData.new_streak);
                }
                // Refresh global profile state so dashboard updates
                await refreshProfile();
            } catch (err) {
                console.error('Backend sync failed:', err);
            }

            // Persist entry locally too
            const existingRaw = await AsyncStorage.getItem(CHECKINS_KEY);
            const existing: CheckinEntry[] = existingRaw ? JSON.parse(existingRaw) : [];
            const allEntries = [...existing, entry];
            await AsyncStorage.setItem(CHECKINS_KEY, JSON.stringify(allEntries));

            // Filter only today's entries to display
            const todayOnly = allEntries.filter(e => e.date === today);
            setTodayEntries(todayOnly);
        } catch { /* silent */ }

        setSavedEntry(entry);
        setIsSaving(false);

        // Transition to success
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
            setStep('SUCCESS');
            Animated.spring(successFade, { toValue: 1, speed: 12, bounciness: 4, useNativeDriver: true }).start();
        });

        try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch { }
    }, [amount, classification, category, isSaving]);

    const isFormValid = classification !== null && category !== null;

    // ── Render Input ─────────────────────────────────────────
    const renderInput = () => (
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Hero */}
                <View style={styles.heroSection}>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>THE 9 PM RITUAL</Text>
                    </View>
                    <Text style={styles.heroTitle}>Daily{'\n'}Check-in.</Text>
                    <Text style={styles.heroSub}>30 seconds. Financial clarity.</Text>
                </View>

                {/* Amount Card */}
                <View style={styles.card}>
                    <Text style={styles.cardLabel}>AMOUNT SPENT</Text>

                    {amount === 0 ? (
                        <Text style={styles.helperText}>Slide to log today's spending</Text>
                    ) : (
                        <Text style={styles.amountDisplay}>
                            ₹{amount.toLocaleString('en-IN')}
                        </Text>
                    )}

                    {/* Slider */}
                    <View
                        style={styles.sliderTrackContainer}
                        onLayout={(e) => setSliderWidth(e.nativeEvent.layout.width)}
                    >
                        <View style={styles.sliderTrack}>
                            <View style={[styles.sliderFill, { width: thumbLeft }]} />
                        </View>
                        <View
                            style={[styles.sliderThumb, { left: thumbLeft - 18 }]}
                            {...panResponder.panHandlers}
                        >
                            <View style={styles.sliderThumbDot} />
                        </View>
                    </View>
                    <View style={styles.sliderLabels}>
                        <Text style={styles.sliderLabel}>₹0</Text>
                        <Text style={styles.sliderLabel}>₹10,000</Text>
                    </View>
                </View>

                {/* Need vs Want */}
                <View style={styles.card}>
                    <Text style={styles.cardLabel}>TYPE OF EXPENSE</Text>
                    <View style={styles.choiceRow}>
                        <Pressable
                            style={[styles.choiceBtn, classification === 'need' && styles.choiceBtnNeed]}
                            onPress={() => { setClassification('need'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                        >
                            <Text style={[styles.choiceBtnText, classification === 'need' && styles.choiceBtnTextActive]}>
                                ✅ Need
                            </Text>
                        </Pressable>
                        <Pressable
                            style={[styles.choiceBtn, classification === 'want' && styles.choiceBtnWant]}
                            onPress={() => { setClassification('want'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                        >
                            <Text style={[styles.choiceBtnText, classification === 'want' && styles.choiceBtnTextActive]}>
                                🛍️ Want
                            </Text>
                        </Pressable>
                    </View>
                </View>

                {/* Category */}
                <View style={styles.card}>
                    <Text style={styles.cardLabel}>CATEGORY</Text>
                    <View style={styles.categoryGrid}>
                        {CATEGORIES.map((cat) => {
                            const Icon = cat.icon;
                            const isActive = category === cat.id;
                            return (
                                <Pressable
                                    key={cat.id}
                                    style={[styles.categoryItem, isActive && styles.categoryItemActive]}
                                    onPress={() => { setCategory(cat.id); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                                >
                                    <Icon
                                        size={22}
                                        color={isActive ? Colors.white : Colors.secondary}
                                        strokeWidth={isActive ? 2.5 : 2}
                                    />
                                    <Text style={[styles.categoryLabel, isActive && styles.categoryLabelActive]}>
                                        {cat.label}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>
                </View>

                {/* Save Button */}
                <Animated.View style={{ transform: [{ scale: saveButtonScale }] }}>
                    <Pressable
                        style={[styles.saveBtn, !isFormValid && styles.saveBtnDisabled]}
                        onPress={handleSave}
                        disabled={!isFormValid || isSaving}
                    >
                        {isSaving ? (
                            <ActivityIndicator color={Colors.secondary} size="small" />
                        ) : (
                            <>
                                <Text style={styles.saveBtnText}>Save Check-in</Text>
                                <View style={styles.saveBtnIcon}>
                                    <Check size={20} color={Colors.secondary} strokeWidth={3} />
                                </View>
                            </>
                        )}
                    </Pressable>
                </Animated.View>

                <View style={{ height: 48 }} />
            </ScrollView>
        </Animated.View>
    );

    // ── Render Success ────────────────────────────────────────
    const renderSuccess = () => {
        if (!savedEntry) return null;

        // Day-level aggregates from ALL today's entries
        const totalSpent = todayEntries.reduce((s, e) => s + e.amount, 0);
        const needsTotal = todayEntries.filter(e => e.classification === 'need').reduce((s, e) => s + e.amount, 0);
        const wantsTotal = todayEntries.filter(e => e.classification === 'want').reduce((s, e) => s + e.amount, 0);
        const avgScore = todayEntries.length > 0
            ? Math.round(todayEntries.reduce((s, e) => s + e.score, 0) / todayEntries.length)
            : savedEntry.score;
        const needsPct = totalSpent > 0 ? Math.round((needsTotal / totalSpent) * 100) : 0;

        const goBackToInput = () => {
            setAmount(0);
            setClassification(null);
            setCategory(null);
            panX.setValue(0);
            thumbPosRef.current = 0;
            successFade.setValue(0);
            setStep('INPUT');
            Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
        };

        return (
            <Animated.View style={[styles.successContainer, { opacity: successFade }]}>
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    {/* Header */}
                    <View style={styles.successHeader}>
                        <View style={styles.successCheckCircle}>
                            <Check size={32} color={Colors.secondary} strokeWidth={3.5} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.successTitle}>Today's Log</Text>
                            <Text style={styles.successSub}>{todayEntries.length} {todayEntries.length === 1 ? 'entry' : 'entries'} recorded</Text>
                        </View>
                    </View>

                    {/* Day total card */}
                    <View style={styles.card}>
                        <Text style={styles.cardLabel}>TODAY'S SPENDING</Text>
                        <Text style={styles.summaryAmount}>₹{totalSpent.toLocaleString('en-IN')}</Text>

                        {/* Needs vs Wants bar */}
                        <View style={styles.splitBarWrap}>
                            <View style={[styles.splitBarNeed, { flex: needsTotal }]} />
                            <View style={[styles.splitBarWant, { flex: wantsTotal > 0 ? wantsTotal : 0.001 }]} />
                        </View>
                        <View style={styles.splitLabelRow}>
                            <View style={styles.splitLabelItem}>
                                <View style={[styles.splitDot, { backgroundColor: Colors.neonGreen }]} />
                                <Text style={styles.splitLabelText}>Needs ₹{needsTotal.toLocaleString('en-IN')} ({needsPct}%)</Text>
                            </View>
                            <View style={styles.splitLabelItem}>
                                <View style={[styles.splitDot, { backgroundColor: Colors.error }]} />
                                <Text style={styles.splitLabelText}>Wants ₹{wantsTotal.toLocaleString('en-IN')} ({100 - needsPct}%)</Text>
                            </View>
                        </View>
                    </View>

                    {/* Entry list */}
                    <View style={styles.card}>
                        <Text style={styles.cardLabel}>ALL ENTRIES</Text>
                        {todayEntries.map((entry, idx) => {
                            const catInfo = CATEGORIES.find(c => c.id === entry.category);
                            const Icon = catInfo?.icon ?? MoreHorizontal;
                            const isLast = idx === todayEntries.length - 1;
                            return (
                                <View key={entry.createdAt} style={[styles.entryRow, !isLast && styles.entryRowBorder]}>
                                    <View style={[
                                        styles.entryIcon,
                                        { backgroundColor: entry.classification === 'need' ? Colors.pastelGreen : Colors.pastelRed }
                                    ]}>
                                        <Icon size={16} color={Colors.secondary} strokeWidth={2.5} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.entryName}>{catInfo?.label ?? entry.category}</Text>
                                        <Text style={styles.entryType}>{entry.classification.toUpperCase()}</Text>
                                    </View>
                                    <Text style={styles.entryAmount}>₹{entry.amount.toLocaleString('en-IN')}</Text>
                                </View>
                            );
                        })}
                    </View>

                    {/* Score */}
                    <View style={styles.card}>
                        <Text style={styles.cardLabel}>DAY SCORE</Text>
                        <View style={styles.scoreRow}>
                            <Text style={[styles.scoreNumber, { color: scoreColor(avgScore) }]}>{avgScore}</Text>
                            <Text style={styles.scoreOf}> / 100</Text>
                        </View>
                        <View style={styles.scoreBarBg}>
                            <View style={[styles.scoreBarFill, { width: `${avgScore}%`, backgroundColor: scoreColor(avgScore) }]} />
                        </View>
                        <Text style={styles.scoreComment}>
                            {avgScore >= 80 ? '🔥 Excellent financial discipline!' :
                                avgScore >= 60 ? '👍 Pretty good. Watch those wants!' :
                                    '⚠️ Reflect on your spending patterns.'}
                        </Text>
                    </View>

                    {/* Streak */}
                    <View style={[styles.card, styles.streakCard]}>
                        <Flame size={28} color={Colors.streak} fill={Colors.streak} />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.streakTitle}>{streak}-Day Streak!</Text>
                            <Text style={styles.streakSub}>Keep the habit going tonight.</Text>
                        </View>
                    </View>

                    {/* Add another entry */}
                    <Pressable style={styles.anotherBtn} onPress={goBackToInput}>
                        <Plus size={18} color={Colors.secondary} strokeWidth={3} />
                        <Text style={styles.anotherBtnText}>Add Another Entry</Text>
                    </Pressable>

                    {/* Done */}
                    <Pressable style={styles.doneBtn} onPress={() => router.back()}>
                        <Text style={styles.doneBtnText}>Done</Text>
                    </Pressable>

                    <View style={{ height: 48 }} />
                </ScrollView>
            </Animated.View>
        );
    };

    return (
        <View style={styles.container}>
            {/* Dot grid background */}
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
                <Svg width="100%" height="100%">
                    <Defs>
                        <Pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                            <Circle cx="2" cy="2" r="1.5" fill={Colors.inputBorder} />
                        </Pattern>
                    </Defs>
                    <Rect x="0" y="0" width="100%" height="100%" fill="url(#dots)" />
                </Svg>
            </View>

            {/* Header */}
            <View style={[styles.header, { paddingTop: Math.max(insets.top, 20), zIndex: 10 }]}>
                <Pressable style={styles.backBtn} onPress={() => {
                    if (router.canGoBack()) {
                        router.back();
                    } else {
                        router.replace('/');
                    }
                }}>
                    <ArrowLeft size={22} color={Colors.secondary} strokeWidth={3} />
                </Pressable>
                <View style={styles.streakChip}>
                    <Flame size={15} color={Colors.streak} fill={Colors.streak} />
                    <Text style={styles.streakChipText}>{streak} day streak</Text>
                </View>
            </View>

            {step === 'INPUT' ? renderInput() : renderSuccess()}
        </View>
    );
}

// ─── Styles ──────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.md,
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 2,
        borderColor: Colors.secondary,
        backgroundColor: Colors.white,
        alignItems: 'center',
        justifyContent: 'center',
    },
    streakChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: Colors.pastelYellow,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: Colors.secondary,
    },
    streakChipText: {
        fontFamily: Typography.fontFamily.bold,
        fontSize: 13,
        color: Colors.secondary,
    },
    scrollContent: {
        paddingHorizontal: Spacing.xxl,
        paddingTop: Spacing.xl,
    },
    // Hero
    heroSection: {
        marginBottom: Spacing.xxl,
    },
    badge: {
        alignSelf: 'flex-start',
        backgroundColor: Colors.pastelPurple,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginBottom: Spacing.md,
        borderWidth: 1.5,
        borderColor: Colors.secondary,
    },
    badgeText: {
        fontFamily: Typography.fontFamily.bold,
        fontSize: 11,
        color: Colors.secondary,
        letterSpacing: 1,
    },
    heroTitle: {
        fontFamily: Typography.fontFamily.black,
        fontSize: 44,
        lineHeight: 48,
        color: Colors.secondary,
        letterSpacing: -1.5,
        marginBottom: Spacing.sm,
    },
    heroSub: {
        fontFamily: Typography.fontFamily.bold,
        fontSize: 18,
        color: Colors.pastelPurple,
    },
    // Cards
    card: {
        backgroundColor: Colors.white,
        borderRadius: 24,
        borderWidth: 3,
        borderColor: Colors.secondary,
        padding: Spacing.xl,
        marginBottom: Spacing.lg,
        shadowColor: Colors.secondary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 1,
        shadowRadius: 0,
        elevation: 4,
    },
    cardLabel: {
        fontFamily: Typography.fontFamily.extraBold,
        fontSize: 13,
        color: Colors.secondary,
        letterSpacing: 1,
        marginBottom: Spacing.lg,
    },
    // Amount
    amountDisplay: {
        fontFamily: Typography.fontFamily.black,
        fontSize: 52,
        color: Colors.secondary,
        letterSpacing: -2,
        textAlign: 'center',
        marginBottom: Spacing.xl,
    },
    helperText: {
        fontFamily: Typography.fontFamily.bold,
        fontSize: 15,
        color: Colors.textMuted,
        textAlign: 'center',
        marginBottom: Spacing.xl,
        fontStyle: 'italic',
    },
    // Slider
    sliderTrackContainer: {
        height: 36,
        justifyContent: 'center',
        position: 'relative',
        marginBottom: Spacing.sm,
    },
    sliderTrack: {
        height: 12,
        backgroundColor: Colors.progressBg,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: Colors.secondary,
        overflow: 'visible',
    },
    sliderFill: {
        position: 'absolute',
        left: 0,
        top: -2,
        height: 12,
        backgroundColor: Colors.secondary,
        borderRadius: 6,
    },
    sliderThumb: {
        position: 'absolute',
        top: -12,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.white,
        borderWidth: 3,
        borderColor: Colors.secondary,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: Colors.secondary,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 1,
        shadowRadius: 0,
        elevation: 4,
    },
    sliderThumbDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: Colors.neonGreen,
        borderWidth: 1,
        borderColor: Colors.secondary,
    },
    sliderLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: Spacing.md,
    },
    sliderLabel: {
        fontFamily: Typography.fontFamily.bold,
        fontSize: 13,
        color: Colors.textMuted,
    },
    // Classification
    choiceRow: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    choiceBtn: {
        flex: 1,
        paddingVertical: 18,
        borderRadius: 16,
        borderWidth: 3,
        borderColor: Colors.secondary,
        backgroundColor: Colors.white,
        alignItems: 'center',
        justifyContent: 'center',
    },
    choiceBtnNeed: {
        backgroundColor: Colors.neonGreen,
        shadowColor: Colors.secondary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 0,
        elevation: 3,
    },
    choiceBtnWant: {
        backgroundColor: Colors.secondary,
        shadowColor: Colors.secondary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 0,
        elevation: 3,
    },
    choiceBtnText: {
        fontFamily: Typography.fontFamily.extraBold,
        fontSize: 17,
        color: Colors.secondary,
    },
    choiceBtnTextActive: {
        color: Colors.white,
    },
    // Category grid
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.md,
    },
    categoryItem: {
        width: (SCREEN_WIDTH - Spacing.xxl * 2 - Spacing.xl * 2 - Spacing.md * 3) / 4,
        aspectRatio: 1,
        borderRadius: 16,
        borderWidth: 3,
        borderColor: Colors.secondary,
        backgroundColor: Colors.white,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    categoryItemActive: {
        backgroundColor: Colors.secondary,
        shadowColor: Colors.secondary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 0,
        elevation: 3,
    },
    categoryLabel: {
        fontFamily: Typography.fontFamily.bold,
        fontSize: 11,
        color: Colors.secondary,
    },
    categoryLabelActive: {
        color: Colors.white,
    },
    // Save button
    saveBtn: {
        height: 64,
        borderRadius: 32,
        backgroundColor: Colors.neonGreen,
        borderWidth: 3,
        borderColor: Colors.secondary,
        shadowColor: Colors.secondary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 1,
        shadowRadius: 0,
        elevation: 4,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: Spacing.md,
    },
    saveBtnDisabled: {
        opacity: 0.4,
    },
    saveBtnText: {
        fontFamily: Typography.fontFamily.black,
        fontSize: 20,
        color: Colors.secondary,
        letterSpacing: 0.5,
    },
    saveBtnIcon: {
        position: 'absolute',
        right: 8,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    // Success screen
    successContainer: {
        flex: 1,
    },
    successCheckWrap: {
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    successCheckCircle: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: Colors.neonGreen,
        borderWidth: 3,
        borderColor: Colors.secondary,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: Colors.secondary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 1,
        shadowRadius: 0,
        elevation: 4,
    },
    successTitle: {
        fontFamily: Typography.fontFamily.black,
        fontSize: 44,
        color: Colors.secondary,
        letterSpacing: -1.5,
        textAlign: 'center',
        marginBottom: Spacing.sm,
    },
    successSub: {
        fontFamily: Typography.fontFamily.bold,
        fontSize: 18,
        color: Colors.pastelPurple,
        textAlign: 'center',
        marginBottom: Spacing.xxl,
    },
    // Success header
    successHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.lg,
        marginBottom: Spacing.xxl,
    },
    // Summary
    summaryLine: {
        fontFamily: Typography.fontFamily.bold,
        fontSize: 14,
        color: Colors.textSecondary,
        marginBottom: 4,
    },
    summaryAmount: {
        fontFamily: Typography.fontFamily.black,
        fontSize: 44,
        color: Colors.secondary,
        letterSpacing: -2,
        marginBottom: Spacing.lg,
    },
    // Needs vs Wants split bar
    splitBarWrap: {
        flexDirection: 'row',
        height: 12,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: Colors.secondary,
        overflow: 'hidden',
        marginBottom: Spacing.md,
    },
    splitBarNeed: {
        backgroundColor: Colors.neonGreen,
    },
    splitBarWant: {
        backgroundColor: Colors.error,
    },
    splitLabelRow: {
        gap: Spacing.sm,
    },
    splitLabelItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    splitDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    splitLabelText: {
        fontFamily: Typography.fontFamily.bold,
        fontSize: 13,
        color: Colors.secondary,
    },
    // Entry list rows
    entryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        paddingVertical: Spacing.md,
    },
    entryRowBorder: {
        borderBottomWidth: 2,
        borderBottomColor: Colors.inputBorder,
    },
    entryIcon: {
        width: 36,
        height: 36,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: Colors.secondary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    entryName: {
        fontFamily: Typography.fontFamily.extraBold,
        fontSize: 14,
        color: Colors.secondary,
    },
    entryType: {
        fontFamily: Typography.fontFamily.bold,
        fontSize: 11,
        color: Colors.textMuted,
        letterSpacing: 0.5,
    },
    entryAmount: {
        fontFamily: Typography.fontFamily.black,
        fontSize: 18,
        color: Colors.secondary,
        letterSpacing: -0.5,
    },
    badgeRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    tagBadge: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: Colors.secondary,
    },
    tagBadgeText: {
        fontFamily: Typography.fontFamily.extraBold,
        fontSize: 12,
        color: Colors.secondary,
        letterSpacing: 0.5,
    },
    // Score
    scoreRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: Spacing.md,
    },
    scoreNumber: {
        fontFamily: Typography.fontFamily.black,
        fontSize: 52,
        letterSpacing: -2,
    },
    scoreOf: {
        fontFamily: Typography.fontFamily.bold,
        fontSize: 22,
        color: Colors.textMuted,
    },
    scoreBarBg: {
        height: 12,
        backgroundColor: Colors.progressBg,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: Colors.secondary,
        marginBottom: Spacing.md,
    },
    scoreBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    scoreComment: {
        fontFamily: Typography.fontFamily.bold,
        fontSize: 14,
        color: Colors.textSecondary,
    },
    // Streak
    streakCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.lg,
        backgroundColor: Colors.pastelYellow,
    },
    streakTitle: {
        fontFamily: Typography.fontFamily.black,
        fontSize: 22,
        color: Colors.secondary,
        letterSpacing: -0.5,
    },
    streakSub: {
        fontFamily: Typography.fontFamily.bold,
        fontSize: 13,
        color: Colors.secondaryLight,
        marginTop: 2,
    },
    // Buttons
    anotherBtn: {
        height: 56,
        borderRadius: 28,
        backgroundColor: Colors.white,
        borderWidth: 3,
        borderColor: Colors.secondary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginBottom: Spacing.md,
    },
    anotherBtnText: {
        fontFamily: Typography.fontFamily.extraBold,
        fontSize: 16,
        color: Colors.secondary,
    },
    doneBtn: {
        height: 64,
        borderRadius: 32,
        backgroundColor: Colors.secondary,
        borderWidth: 3,
        borderColor: Colors.secondary,
        shadowColor: Colors.secondary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 1,
        shadowRadius: 0,
        elevation: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    doneBtnText: {
        fontFamily: Typography.fontFamily.black,
        fontSize: 20,
        color: Colors.white,
        letterSpacing: 0.5,
    },
});
