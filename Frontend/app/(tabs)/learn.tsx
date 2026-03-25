import React, { useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
    Animated,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    BookOpen,
    Zap,
    Star,
    ChevronRight,
    Trophy,
    Lock,
    Check,
    Play,
    ArrowRight,
} from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { playSound } from '@/utils/sounds';
import { LEARN_MODULES, Category, Chapter, Lesson, getTotalLessons, getAllLessonsFlat } from '@/data/learnModules';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/context/AuthContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Progress stored locally ────────────────────────────────────────
// We use AsyncStorage with keys like "learn_progress_<lessonId>" = "completed"
// This avoids needing Supabase for local learning modules.

const PROGRESS_KEY_PREFIX = 'learn_progress_';
const XP_KEY = 'learn_total_xp';

async function getCompletedLessons(): Promise<Set<string>> {
    try {
        const keys = await AsyncStorage.getAllKeys();
        const progressKeys = keys.filter((k) => k.startsWith(PROGRESS_KEY_PREFIX));
        const completed = new Set<string>();
        for (const key of progressKeys) {
            const val = await AsyncStorage.getItem(key);
            if (val === 'completed') {
                completed.add(key.replace(PROGRESS_KEY_PREFIX, ''));
            }
        }
        return completed;
    } catch {
        return new Set();
    }
}

async function getTotalXP(): Promise<number> {
    try {
        const val = await AsyncStorage.getItem(XP_KEY);
        return val ? parseInt(val, 10) : 0;
    } catch {
        return 0;
    }
}

// ─── Category Progress Info ───────────────────────────────────────────
interface CategoryProgress {
    completed: number;
    total: number;
    xpEarned: number;
    xpTotal: number;
    isComplete: boolean;
    nextLessonIndex: number; // -1 if complete
}

function getCategoryProgress(
    cat: Category,
    completedSet: Set<string>
): CategoryProgress {
    let completed = 0;
    let xpEarned = 0;
    let nextLessonIndex = -1;
    let totalLessonsCount = 0;
    let xpTotal = 0;

    cat.chapters.forEach((ch) => {
        ch.lessons.forEach((l) => {
            totalLessonsCount++;
            xpTotal += l.xpReward;
            if (completedSet.has(l.id)) {
                completed++;
                xpEarned += l.xpReward;
            } else if (nextLessonIndex === -1) {
                // If this is the first uncompleted lesson we found
                nextLessonIndex = totalLessonsCount - 1;
            }
        });
    });

    return {
        completed,
        total: totalLessonsCount,
        xpEarned,
        xpTotal,
        isComplete: completed === totalLessonsCount && totalLessonsCount > 0,
        nextLessonIndex,
    };
}

// ─── Find current resume point ──────────────────────────────────────
function findResumePoint(completedSet: Set<string>): {
    categoryIndex: number;
    chapterIndex: number;
    lessonIndex: number;
    category: Category;
} | null {
    for (let i = 0; i < LEARN_MODULES.length; i++) {
        const cat = LEARN_MODULES[i];
        for (let j = 0; j < cat.chapters.length; j++) {
            const ch = cat.chapters[j];
            for (let k = 0; k < ch.lessons.length; k++) {
                if (!completedSet.has(ch.lessons[k].id)) {
                    return { categoryIndex: i, chapterIndex: j, lessonIndex: k, category: cat };
                }
            }
        }
    }
    return null; // all complete!
}

// ═══════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════
export default function LearnTab() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { session, profile } = useAuth();
    const [completedLessons, setCompletedLessons] = React.useState<Set<string>>(new Set());
    const [totalXp, setTotalXp] = React.useState(profile?.xp_total || 0);
    const [loading, setLoading] = React.useState(true);
    const [nextLesson, setNextLesson] = React.useState<any | null>(null);
    const [backendTracks, setBackendTracks] = React.useState<any[]>([]);

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const slideAnims = useRef(LEARN_MODULES.map(() => new Animated.Value(40))).current;

    const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.03, duration: 1200, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    const loadProgress = async () => {
        setLoading(true);
        try {
            const completed = await getCompletedLessons();
            setCompletedLessons(completed);
            
            // Prioritize profile XP from database if available
            const xp = profile?.xp_total ?? (await getTotalXP());
            setTotalXp(xp);

            // Fetch state from backend
            if (session?.access_token && BACKEND_URL) {
                // 1. Fetch next lesson
                const nextRes = await fetch(`${BACKEND_URL}/api/lessons/next`, {
                    headers: { 'Authorization': `Bearer ${session.access_token}` }
                });
                if (nextRes.ok) {
                    const nextData = await nextRes.json();
                    if (nextData.lesson) {
                        setNextLesson(nextData.lesson);
                    }
                }

                // 2. Fetch tracks
                const tracksRes = await fetch(`${BACKEND_URL}/api/tracks`, {
                    headers: { 'Authorization': `Bearer ${session.access_token}` }
                });
                if (tracksRes.ok) {
                    const tracksData = await tracksRes.json();
                    setBackendTracks(tracksData.tracks || []);
                }
            }
        } catch (e) {
            console.warn('Error loading learn progress:', e);
        }

        setLoading(false);

        // Stagger card animations
        slideAnims.forEach((anim, i) => {
            anim.setValue(40);
            Animated.spring(anim, {
                toValue: 0,
                friction: 8,
                tension: 40,
                delay: i * 80,
                useNativeDriver: true,
            }).start();
        });
    };

    useFocusEffect(
        React.useCallback(() => {
            loadProgress();
        }, [session?.access_token, profile?.xp_total])
    );

    const resumePoint = findResumePoint(completedLessons);
    const hasProgress = completedLessons.size > 0;
    const totalLessons = getTotalLessons();
    const overallPercent = Math.round((completedLessons.size / totalLessons) * 100);

    const handleCategoryPress = (cat: any, index: number, isBackend = false) => {
        try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch { }
        playSound('tap');
        // @ts-ignore
        router.push({
            pathname: '/learn/roadmap',
            params: { 
                categoryId: cat.id,
                isBackend: isBackend ? 'true' : 'false'
            },
        });
    };

    const handleResumePress = () => {
        try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); } catch { }
        playSound('tap');

        if (nextLesson) {
            // @ts-ignore
            router.push({
                pathname: '/learn/lesson',
                params: {
                    lessonId: nextLesson.id,
                    lessonTitle: nextLesson.title,
                },
            });
            return;
        }

        if (resumePoint) {
            // @ts-ignore
            router.push({
                pathname: '/learn/roadmap',
                params: { categoryId: resumePoint.category.id },
            });
        }
    };

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={[
                styles.content,
                { paddingTop: Math.max(insets.top, 20) + 10, paddingBottom: insets.bottom + 100 },
            ]}
            showsVerticalScrollIndicator={false}
        >
            {/* ══════ HEADER ══════ */}
            <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
                <View style={styles.headerRow}>
                    <View>
                        <Text style={styles.headerTitle}>Learn</Text>
                        <Text style={styles.headerSubtitle}>Master your financial future</Text>
                    </View>
                    <View style={styles.headerXpBadge}>
                        <Zap size={16} color={Colors.neonGreen} strokeWidth={3} fill={Colors.neonGreen} />
                        <Text style={styles.headerXpText}>{totalXp} XP</Text>
                    </View>
                </View>

                {/* Overall progress bar */}
                <View style={styles.overallProgress}>
                    <View style={styles.overallProgressHeader}>
                        <Text style={styles.overallProgressLabel}>
                            Overall Progress
                        </Text>
                        <Text style={styles.overallProgressPercent}>
                            {completedLessons.size}/{totalLessons} lessons
                        </Text>
                    </View>
                    <View style={styles.overallProgressBarBg}>
                        <Animated.View
                            style={[
                                styles.overallProgressBarFill,
                                { width: `${overallPercent}%` },
                            ]}
                        />
                    </View>
                </View>
            </Animated.View>

            {/* ══════ RESUME CARD ══════ */}
            {(nextLesson || resumePoint) && (
                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                    <Pressable
                        style={({ pressed }) => [
                            styles.resumeCard,
                            pressed && { transform: [{ scale: 0.97 }] },
                        ]}
                        onPress={handleResumePress}
                    >
                        <View style={styles.resumeGlow} />
                        <View style={styles.resumeTop}>
                            <View style={styles.resumeBadge}>
                                <Play size={12} color="#FFF" strokeWidth={3} fill="#FFF" />
                                <Text style={styles.resumeBadgeText}>
                                    {nextLesson ? (nextLesson.order_index === 1 ? 'START' : 'RESUME') : (hasProgress ? 'RESUME' : 'START')}
                                </Text>
                            </View>
                            <View style={styles.resumeXp}>
                                <Star size={14} color="#F59E0B" strokeWidth={3} fill="#F59E0B" />
                                <Text style={styles.resumeXpText}>
                                    +{nextLesson?.xp_reward || (resumePoint ? resumePoint.category.chapters[resumePoint.chapterIndex].lessons[resumePoint.lessonIndex].xpReward : 0)} XP
                                </Text>
                            </View>
                        </View>

                        <Text style={styles.resumeEmoji}>🎯</Text>

                        <Text style={styles.resumeModuleLabel}>
                            {nextLesson ? 'CURRENT LESSON' : (resumePoint ? resumePoint.category.title : '')}
                        </Text>
                        <Text style={styles.resumeChapterTitle}>
                            {nextLesson ? nextLesson.title : (resumePoint ? resumePoint.category.chapters[resumePoint.chapterIndex].lessons[resumePoint.lessonIndex].title : '')}
                        </Text>
                        <Text style={styles.resumeChapterSub}>
                            {nextLesson ? `Lesson ${nextLesson.order_index}` : (resumePoint ? `Unit ${resumePoint.chapterIndex + 1}` : '')}
                        </Text>

                        <View style={styles.resumeBtn}>
                            <Text style={styles.resumeBtnText}>
                                {nextLesson ? 'Open Lesson' : (hasProgress ? 'Continue Learning' : 'Start Learning')}
                            </Text>
                            <ArrowRight size={20} color={Colors.secondary} strokeWidth={3} />
                        </View>
                    </Pressable>
                </Animated.View>
            )}

            {/* ══════ CATEGORY CARDS ══════ */}
            <Text style={styles.modulesHeading}>
                Learning Path
            </Text>

            {/* 1. Hardcoded Tracks (Legacy) */}
            {LEARN_MODULES.map((cat, idx) => {
                const progress = getCategoryProgress(cat, completedLessons);
                const percent = progress.total > 0 ? Math.round(
                    (progress.completed / progress.total) * 100
                ) : 0;
                // A category is accessible if all previous categories are complete or it's the first
                const isAccessible =
                    idx === 0 ||
                    getCategoryProgress(LEARN_MODULES[idx - 1], completedLessons).isComplete;
                const isLocked = !isAccessible && !progress.completed;

                return (
                    <Animated.View
                        key={cat.id}
                        style={{
                            transform: [{ translateY: slideAnims[idx] }],
                            opacity: fadeAnim,
                        }}
                    >
                        <Pressable
                            style={({ pressed }) => [
                                styles.moduleCard,
                                { borderLeftColor: cat.color, borderLeftWidth: 6 },
                                isLocked && styles.moduleCardLocked,
                                pressed && !isLocked && styles.moduleCardPressed,
                                { marginBottom: 16 }
                            ]}
                            onPress={() => !isLocked && handleCategoryPress(cat, idx)}
                            disabled={isLocked}
                        >
                            {/* Category header */}
                            <View style={styles.moduleHeader}>
                                <View style={[styles.moduleIconBg, { backgroundColor: cat.bgColor }]}>
                                    <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: cat.color }} />
                                </View>
                                <View style={styles.moduleInfo}>
                                    <View style={styles.moduleRow}>
                                        <Text style={styles.moduleNum}>CORE PATH</Text>
                                        {progress.isComplete && (
                                            <View style={[styles.completeBadge, { backgroundColor: cat.color }]}>
                                                <Check size={12} color="#FFF" strokeWidth={3} />
                                                <Text style={styles.completeBadgeText}>DONE</Text>
                                            </View>
                                        )}
                                    </View>
                                    <Text
                                        style={[
                                            styles.moduleTitle,
                                            isLocked && { color: Colors.textMuted },
                                        ]}
                                        numberOfLines={1}
                                    >
                                        {cat.title}
                                    </Text>
                                    {/* XP Progress Bar */}
                                    <View style={styles.moduleProgressWrap}>
                                        <View style={styles.moduleProgressHeader}>
                                            <View style={styles.xpInfo}>
                                                <Zap size={10} color={cat.color} fill={cat.color} />
                                                <Text style={[styles.moduleXpText, { color: cat.color }]}>
                                                    {progress.xpEarned} / {progress.xpTotal} XP
                                                </Text>
                                            </View>
                                            <Text style={styles.modulePercentText}>{percent}%</Text>
                                        </View>
                                        <View style={styles.moduleProgressBarBg}>
                                            <View style={[styles.moduleProgressBarFill, { width: `${percent}%`, backgroundColor: cat.color }]} />
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </Pressable>
                    </Animated.View>
                );
            })}

            {/* 2. Backend Tracks (New) */}
            {backendTracks.length > 0 && (
                <>
                    <Text style={[styles.modulesHeading, { marginTop: 10 }]}>
                        Custom Tracks
                    </Text>
                    {backendTracks.map((track, idx) => {
                        const isLocked = false; // For now keep it simple

                        return (
                            <Animated.View
                                key={track.id}
                                style={{ opacity: fadeAnim }}
                            >
                                <Pressable
                                    style={({ pressed }) => [
                                        styles.moduleCard,
                                        { borderLeftColor: Colors.primary, borderLeftWidth: 6 },
                                        pressed && styles.moduleCardPressed,
                                        { marginBottom: 16 }
                                    ]}
                                    onPress={() => handleCategoryPress(track, idx, true)}
                                >
                                    <View style={styles.moduleHeader}>
                                        <View style={[styles.moduleIconBg, { backgroundColor: Colors.background }]}>
                                            <Star size={24} color={Colors.primary} />
                                        </View>
                                        <View style={styles.moduleInfo}>
                                            <View style={styles.moduleRow}>
                                                <Text style={styles.moduleNum}>DYNAMIC TRACK</Text>
                                            </View>
                                            <Text style={styles.moduleTitle} numberOfLines={1}>
                                                {track.title}
                                            </Text>
                                            <Text style={styles.moduleDesc} numberOfLines={2}>
                                                {track.description || 'Explore this custom learning track.'}
                                            </Text>
                                            <View style={styles.moduleStats}>
                                                <View style={styles.moduleStat}>
                                                    <BookOpen size={14} color={Colors.primary} strokeWidth={2.5} />
                                                    <Text style={styles.moduleStatText}>
                                                        {track.lesson_count || 0} Lessons
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>
                                    </View>
                                </Pressable>
                            </Animated.View>
                        );
                    })}
                </>
            )}

            {/* ══════ COMPLETION BANNER ══════ */}
            <View style={styles.completionBanner}>
                <Trophy size={36} color="#F59E0B" strokeWidth={2} fill="#FDE68A" />
                <View style={styles.completionInfo}>
                    <Text style={styles.completionTitle}>Financial Master</Text>
                    <Text style={styles.completionSub}>
                        Complete all {totalLessons} lessons to earn this badge
                    </Text>
                </View>
            </View>
        </ScrollView>
    );
}

// ═══════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    content: { paddingHorizontal: 20 },

    // ── Header ──
    header: { marginBottom: 24 },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    headerTitle: {
        fontFamily: Typography.fontFamily.black,
        fontSize: 42,
        color: Colors.secondary,
        letterSpacing: -2,
    },
    headerSubtitle: {
        fontFamily: Typography.fontFamily.bold,
        fontSize: 16,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    headerXpBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.secondary,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 16,
        gap: 6,
        borderWidth: 2,
        borderColor: Colors.secondary,
    },
    headerXpText: {
        fontFamily: Typography.fontFamily.black,
        fontSize: 16,
        color: Colors.neonGreen,
    },

    // ── Overall Progress ──
    overallProgress: {
        marginTop: 18,
        backgroundColor: Colors.white,
        borderRadius: 20,
        padding: 18,
        borderWidth: 3,
        borderColor: Colors.secondary,
        shadowColor: Colors.secondary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 0,
    },
    overallProgressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    overallProgressLabel: {
        fontFamily: Typography.fontFamily.black,
        fontSize: 14,
        color: Colors.secondary,
    },
    overallProgressPercent: {
        fontFamily: Typography.fontFamily.black,
        fontSize: 14,
        color: Colors.neonGreen,
    },
    overallProgressBarBg: {
        height: 14,
        backgroundColor: Colors.background,
        borderRadius: 7,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: Colors.secondary,
    },
    overallProgressBarFill: {
        height: '100%',
        backgroundColor: Colors.neonGreen,
        borderRadius: 5,
    },

    // ── Resume Card ──
    resumeCard: {
        backgroundColor: Colors.secondary,
        borderRadius: 28,
        padding: 24,
        marginBottom: 28,
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

    // ── Module Cards ──
    modulesHeading: {
        fontFamily: Typography.fontFamily.black,
        fontSize: 20,
        color: Colors.secondary,
        marginBottom: 18,
        letterSpacing: -0.5,
    },
    moduleCard: {
        backgroundColor: Colors.white,
        borderRadius: 24,
        padding: 20,
        marginBottom: 18,
        borderWidth: 3,
        borderColor: Colors.secondary,
        shadowColor: Colors.secondary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 1,
        shadowRadius: 0,
        elevation: 6,
    },
    moduleCardLocked: {
        opacity: 0.5,
        backgroundColor: '#F3F4F6',
    },
    moduleCardPressed: {
        transform: [{ scale: 0.98 }],
        shadowOffset: { width: 0, height: 2 },
    },
    moduleHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    moduleIconBg: {
        width: 60,
        height: 60,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: Colors.secondary,
        marginRight: 14,
    },
    moduleEmoji: {
        fontSize: 30,
    },
    moduleInfo: {
        flex: 1,
    },
    moduleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    moduleNum: {
        fontFamily: Typography.fontFamily.black,
        fontSize: 11,
        color: Colors.textMuted,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    completeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    completeBadgeText: {
        fontFamily: Typography.fontFamily.black,
        fontSize: 10,
        color: '#FFF',
        letterSpacing: 0.5,
    },
    lockedBadge: {
        width: 24,
        height: 24,
        borderRadius: 8,
        backgroundColor: Colors.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
    moduleTitle: {
        fontFamily: Typography.fontFamily.black,
        fontSize: 20,
        color: Colors.secondary,
        letterSpacing: -0.5,
    },
    moduleDesc: {
        fontFamily: Typography.fontFamily.bold,
        fontSize: 14,
        color: Colors.textSecondary,
        marginTop: 3,
        lineHeight: 19,
    },
    moduleStats: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14,
    },
    moduleStat: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    moduleStatText: {
        fontFamily: Typography.fontFamily.bold,
        fontSize: 13,
        color: Colors.textSecondary,
    },
    modulePercent: {
        fontFamily: Typography.fontFamily.black,
        fontSize: 14,
    },
    moduleProgressWrap: {
        marginTop: 12,
    },
    moduleProgressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    xpInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    moduleXpText: {
        fontFamily: Typography.fontFamily.black,
        fontSize: 10,
        letterSpacing: 0.5,
    },
    modulePercentText: {
        fontFamily: Typography.fontFamily.black,
        fontSize: 10,
        color: Colors.textMuted,
    },
    moduleProgressBarBg: {
        height: 6,
        backgroundColor: '#F3F4F6',
        borderRadius: 3,
        overflow: 'hidden',
    },
    moduleProgressBarFill: {
        height: '100%',
        borderRadius: 3,
    },
    moduleProgressBg: {
        height: 10,
        backgroundColor: Colors.background,
        borderRadius: 5,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: Colors.secondary,
    },
    moduleProgressFill: {
        height: '100%',
        borderRadius: 3,
    },

    // ── Completion Banner ──
    completionBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.pastelYellow,
        borderRadius: 24,
        padding: 20,
        marginTop: 10,
        borderWidth: 3,
        borderColor: Colors.secondary,
    },
    completionInfo: {
        flex: 1,
        marginLeft: 16,
    },
    completionTitle: {
        fontFamily: Typography.fontFamily.black,
        fontSize: 18,
        color: Colors.secondary,
        letterSpacing: -0.5,
    },
    completionSub: {
        fontFamily: Typography.fontFamily.bold,
        fontSize: 13,
        color: Colors.textSecondary,
        marginTop: 2,
    },
});
