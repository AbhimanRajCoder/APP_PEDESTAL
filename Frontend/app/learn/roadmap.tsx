import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    Animated,
    Dimensions,
    ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Lock, Check, Zap, Star, Trophy, BookOpen, Play } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { playSound } from '@/utils/sounds';
import { LEARN_MODULES, Category, Chapter, Lesson } from '@/data/learnModules';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/context/AuthContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PROGRESS_KEY_PREFIX = 'learn_progress_';
const XP_KEY = 'learn_total_xp';
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

// ─── Difficulty badge config ────────────────────────────────────────
const DIFFICULTY_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
    easy: { label: 'EASY', color: '#22C55E', bgColor: '#DCFCE7' },
    medium: { label: 'MID', color: '#F59E0B', bgColor: '#FEF3C7' },
    hard: { label: 'HARD', color: '#EF4444', bgColor: '#FEE2E2' },
};

export default function RoadmapScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const params = useLocalSearchParams<{ categoryId: string; isBackend: string }>();
    const isBackend = params.isBackend === 'true';

    const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [categoryXp, setCategoryXp] = useState(0);
    const [allLessons, setAllLessons] = useState<any[]>([]);
    const [currentCategory, setCurrentCategory] = useState<any>(null);

    const pulseAnim = useRef(new Animated.Value(1)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const nodeAnims = useRef<Animated.Value[]>([]).current;

    const { session } = useAuth();

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.08, duration: 1000, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    const loadProgress = async () => {
        setLoading(true);
        try {
            // 1. Initial set from AsyncStorage (local source of truth for speed)
            const keys = await AsyncStorage.getAllKeys();
            const progressKeys = keys.filter((k) => k.startsWith(PROGRESS_KEY_PREFIX));
            const completed = new Set<string>();

            for (const key of progressKeys) {
                const val = await AsyncStorage.getItem(key);
                if (val === 'completed') {
                    const lessonId = key.replace(PROGRESS_KEY_PREFIX, '');
                    completed.add(lessonId);
                }
            }

            // 2. Fetch from Backend if logged in (authoritative source)
            let backendLessons: any[] = [];
            let backendTrack: any = null;

            if (session?.access_token && BACKEND_URL) {
                try {
                    // Sync progress
                    const response = await fetch(`${BACKEND_URL}/api/progress`, {
                        headers: { 'Authorization': `Bearer ${session.access_token}` }
                    });

                    if (response.ok) {
                        const data = await response.json();
                        if (data.progress) {
                            data.progress.forEach((item: any) => {
                                if (item.is_completed) {
                                    completed.add(item.lesson_id);
                                    AsyncStorage.setItem(`${PROGRESS_KEY_PREFIX}${item.lesson_id}`, 'completed');
                                }
                            });
                        }
                    }

                    if (isBackend) {
                        // Fetch track details and lessons
                        const trackRes = await fetch(`${BACKEND_URL}/api/tracks/${params.categoryId}`, {
                            headers: { 'Authorization': `Bearer ${session.access_token}` }
                        });
                        const lessonsRes = await fetch(`${BACKEND_URL}/api/tracks/${params.categoryId}/lessons`, {
                            headers: { 'Authorization': `Bearer ${session.access_token}` }
                        });

                        if (trackRes.ok && lessonsRes.ok) {
                            backendTrack = await trackRes.json();
                            const ldata = await lessonsRes.json();
                            backendLessons = ldata.map((l: any) => ({
                                ...l,
                                xpReward: l.xp_reward || 25,
                                difficulty: l.difficulty_level === 3 ? 'hard' : (l.difficulty_level === 2 ? 'medium' : 'easy')
                            }));
                        }
                    }
                } catch (backendError) {
                    console.warn('❌ Backend sync failed:', backendError);
                }
            }

            // 3. Setup current category and lessons
            let targetLessons: any[] = [];
            if (isBackend && backendTrack) {
                setCurrentCategory({
                    id: backendTrack.id,
                    title: backendTrack.title,
                    color: Colors.primary,
                    bgColor: Colors.background,
                    description: backendTrack.description,
                });
                targetLessons = backendLessons;
                setAllLessons(backendLessons);
            } else {
                const category = LEARN_MODULES.find(c => c.id === params.categoryId) || LEARN_MODULES[0];
                setCurrentCategory(category);
                const flat: any[] = [];
                category.chapters.forEach(ch => {
                    ch.lessons.forEach(l => {
                        flat.push({ ...l, chapterId: ch.id, chapterTitle: ch.title });
                    });
                });
                targetLessons = flat;
                setAllLessons(flat);
            }

            setCompletedLessons(completed);

            // Calculate XP for this category
            let xp = 0;
            for (const l of targetLessons) {
                if (completed.has(l.id)) {
                    xp += l.xpReward;
                }
            }
            setCategoryXp(xp);

            // Setup node animations
            while (nodeAnims.length < targetLessons.length) {
                nodeAnims.push(new Animated.Value(0));
            }

            // Stagger animate nodes
            targetLessons.forEach((_, i) => {
                if (nodeAnims[i]) {
                    nodeAnims[i].setValue(0);
                    Animated.spring(nodeAnims[i], {
                        toValue: 1,
                        friction: 6,
                        tension: 40,
                        delay: i * 80,
                        useNativeDriver: true,
                    }).start();
                }
            });

        } catch (e) {
            console.warn('Failed to load roadmap progress:', e);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        React.useCallback(() => {
            loadProgress();
        }, [params.categoryId])
    );

    const getCurrentLessonIndex = (): number => {
        for (let i = 0; i < allLessons.length; i++) {
            if (!completedLessons.has(allLessons[i].id)) return i;
        }
        return allLessons.length; // all done
    };

    const handleLessonPress = (lesson: Lesson, globalIndex: number) => {
        // Removed hard progression lock so users can access future content even if past questions were answered incorrectly.
        try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch { }
        playSound('tap');
        // @ts-ignore
        router.push({
            pathname: '/learn/lesson',
            params: {
                lessonId: lesson.id,
                lessonTitle: lesson.title,
                categoryId: currentCategory.id,
                categoryColor: currentCategory.color,
            },
        });
    };

    const currentLessonIndex = getCurrentLessonIndex();
    const completedInCategory = allLessons.filter((l) =>
        completedLessons.has(l.id)
    ).length;
    const totalXpInCategory = allLessons.reduce((s, l) => s + l.xpReward, 0);
    const progressPercent = Math.round(
        (completedInCategory / allLessons.length) * 100
    );

    if (loading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    let globalLessonCounter = 0;

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
                <Pressable onPress={() => { playSound('tap'); router.back(); }} style={styles.backBtn}>
                    <ArrowLeft size={22} color={Colors.secondary} strokeWidth={2.5} />
                </Pressable>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle} numberOfLines={1}>
                        {currentCategory.title}
                    </Text>
                    <Text style={styles.headerProgress}>
                        {completedInCategory}/{allLessons.length} lessons
                    </Text>
                </View>
                <View style={styles.xpBadge}>
                    <Zap size={14} color={Colors.neonGreen} strokeWidth={3} fill={Colors.neonGreen} />
                    <Text style={styles.xpText}>{categoryXp} XP</Text>
                </View>
            </Animated.View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Category Info Card */}
                <View style={[styles.moduleInfoCard, { borderLeftColor: currentCategory.color, borderLeftWidth: 6 }]}>
                    <View style={styles.moduleInfoContent}>
                        <Text style={styles.moduleInfoTitle}>{currentCategory.title}</Text>
                        <Text style={styles.moduleInfoDesc}>{currentCategory.description}</Text>
                        <View style={styles.moduleInfoStats}>
                            <View style={styles.moduleInfoStat}>
                                <BookOpen size={12} color={currentCategory.color} strokeWidth={2.5} />
                                <Text style={styles.moduleInfoStatText}>
                                    {allLessons.length} Lessons
                                </Text>
                            </View>
                            <View style={styles.moduleInfoStat}>
                                <Zap size={12} color={Colors.neonGreen} strokeWidth={2.5} />
                                <Text style={styles.moduleInfoStatText}>
                                    {totalXpInCategory} XP Total
                                </Text>
                            </View>
                        </View>
                    </View>
                    <View style={styles.moduleInfoPercent}>
                        <Text style={[styles.moduleInfoPercentText, { color: currentCategory.color }]}>
                            {progressPercent}%
                        </Text>
                    </View>
                </View>

                {/* Chapters and Lessons */}
                <View style={styles.pathContainer}>
                    {((currentCategory && currentCategory.chapters) || [{ id: 'backend-default', title: 'Lessons', description: 'Complete all lessons to master this track.', lessons: allLessons }]).map((chapter: any, chapterIdx: any) => {
                        return (
                            <View key={chapter.id} style={styles.chapterSection}>
                                {/* Chapter Banner */}
                                <View style={[styles.chapterBanner, { backgroundColor: currentCategory?.bgColor || Colors.background, borderColor: currentCategory?.color || Colors.primary }]}>
                                    <Text style={[styles.chapterNum, { color: currentCategory?.color || Colors.primary }]}>UNIT {chapterIdx + 1}</Text>
                                    <Text style={styles.chapterTitle}>{chapter.title}</Text>
                                    <Text style={styles.chapterDesc}>{chapter.description}</Text>
                                </View>

                                {/* Lessons for this Chapter */}
                                <View style={styles.lessonsContainer}>
                                    {chapter.lessons.map((lesson, lessonIdx) => {
                                        const glIdx = globalLessonCounter++;
                                        const isCompleted = completedLessons.has(lesson.id);
                                        const isCurrent = glIdx === currentLessonIndex;
                                        const isLocked = glIdx > currentLessonIndex;
                                        const diffConfig = DIFFICULTY_CONFIG[lesson.difficulty];

                                        // Zigzag positioning
                                        const offset = glIdx % 2 === 0 ? -35 : 35;
                                        const nodeAnim = nodeAnims[glIdx] || new Animated.Value(1);

                                        return (
                                            <View key={lesson.id} style={styles.nodeRow}>
                                                {/* Connector line */}
                                                {(lessonIdx > 0) && (
                                                    <View
                                                        style={[
                                                            styles.connector,
                                                            {
                                                                backgroundColor: isLocked
                                                                    ? Colors.inputBorder
                                                                    : currentCategory.color,
                                                                borderColor: isLocked
                                                                    ? Colors.inputBorder
                                                                    : Colors.secondary,
                                                            },
                                                        ]}
                                                    />
                                                )}
                                                {/* If it's the first lesson of a chapter, we shouldn't show a connector from the banner, or maybe a tiny one. */}
                                                {(lessonIdx === 0 && chapterIdx > 0) && (
                                                    <View
                                                        style={[
                                                            styles.connector,
                                                            {
                                                                backgroundColor: isLocked
                                                                    ? Colors.inputBorder
                                                                    : currentCategory.color,
                                                                borderColor: isLocked
                                                                    ? Colors.inputBorder
                                                                    : Colors.secondary,
                                                                marginTop: -14, // pull up slightly
                                                                height: 30, // shorter connector from banner
                                                            },
                                                        ]}
                                                    />
                                                )}

                                                <Animated.View
                                                    style={[
                                                        styles.nodeWrapper,
                                                        { marginLeft: offset },
                                                        isCurrent && { transform: [{ scale: pulseAnim }] },
                                                        {
                                                            opacity: nodeAnim,
                                                            transform: [
                                                                ...(isCurrent ? [{ scale: pulseAnim }] : []),
                                                                {
                                                                    translateY: nodeAnim.interpolate({
                                                                        inputRange: [0, 1],
                                                                        outputRange: [20, 0],
                                                                    }),
                                                                },
                                                            ],
                                                        },
                                                    ]}
                                                >
                                                    <Pressable
                                                        onPress={() => handleLessonPress(lesson, glIdx)}
                                                        style={[
                                                            styles.node,
                                                            isCompleted && {
                                                                backgroundColor: currentCategory.color,
                                                                borderColor: currentCategory.color,
                                                            },
                                                            isCurrent && {
                                                                backgroundColor: Colors.secondary,
                                                                borderColor: Colors.neonGreen,
                                                                borderWidth: 4,
                                                            },
                                                            isLocked && {
                                                                backgroundColor: '#F3F4F6',
                                                                borderColor: '#D1D5DB',
                                                            },
                                                        ]}
                                                    >
                                                        {isCompleted ? (
                                                            <Check size={28} color="#FFF" strokeWidth={3} />
                                                        ) : isCurrent ? (
                                                            <Play
                                                                size={26}
                                                                color={Colors.neonGreen}
                                                                strokeWidth={2.5}
                                                                fill={Colors.neonGreen}
                                                            />
                                                        ) : (
                                                            <Lock size={22} color="#9CA3AF" strokeWidth={2.5} />
                                                        )}
                                                    </Pressable>

                                                    {/* Lesson Info Card */}
                                                    <View
                                                        style={[
                                                            styles.nodeLabel,
                                                            { [glIdx % 2 === 0 ? 'right' : 'left']: -160 },
                                                        ]}
                                                    >
                                                        <Text
                                                            style={[
                                                                styles.nodeLabelText,
                                                                { fontSize: 13, opacity: 0.8, marginBottom: 2 }
                                                            ]}
                                                        >
                                                            Lesson {glIdx + 1}
                                                        </Text>
                                                        <Text
                                                            style={[
                                                                styles.nodeLabelText,
                                                                isCurrent && styles.nodeLabelTextCurrent,
                                                                isLocked && { color: Colors.textMuted },
                                                                { fontSize: 15, fontWeight: '700' }
                                                            ]}
                                                            numberOfLines={2}
                                                        >
                                                            {lesson.title}
                                                        </Text>
                                                        <View style={styles.nodeMetaRow}>
                                                            <View
                                                                style={[
                                                                    styles.diffBadge,
                                                                    {
                                                                        backgroundColor: isLocked
                                                                            ? Colors.background
                                                                            : diffConfig.bgColor,
                                                                    },
                                                                ]}
                                                            >
                                                                <Text
                                                                    style={[
                                                                        styles.diffBadgeText,
                                                                        {
                                                                            color: isLocked
                                                                                ? Colors.textMuted
                                                                                : diffConfig.color,
                                                                        },
                                                                    ]}
                                                                >
                                                                    {diffConfig.label}
                                                                </Text>
                                                            </View>
                                                            <View style={styles.xpMiniRow}>
                                                                <Star
                                                                    size={10}
                                                                    color={
                                                                        isLocked ? Colors.textMuted : '#F59E0B'
                                                                    }
                                                                    strokeWidth={3}
                                                                    fill={isLocked ? Colors.textMuted : '#F59E0B'}
                                                                />
                                                                <Text
                                                                    style={[
                                                                        styles.xpMiniText,
                                                                        isLocked && { color: Colors.textMuted },
                                                                    ]}
                                                                >
                                                                    {lesson.xpReward} XP
                                                                </Text>
                                                            </View>
                                                        </View>
                                                    </View>
                                                </Animated.View>
                                            </View>
                                        );
                                    })}
                                </View>
                            </View>
                        );
                    })}
                </View>

                {/* End Banner */}
                <View style={[styles.endBanner, { borderColor: currentCategory.color }]}>
                    <Text style={styles.endEmoji}>
                        {completedInCategory === allLessons.length ? '🏆' : '🎯'}
                    </Text>
                    <Text style={styles.endTitle}>
                        {completedInCategory === allLessons.length
                            ? `${currentCategory.title} Complete!`
                            : `Conquer ${currentCategory.title}`}
                    </Text>
                    <Text style={styles.endSubtitle}>
                        {completedInCategory === allLessons.length
                            ? `You earned ${categoryXp} XP in this category! 🎉`
                            : `Complete all ${allLessons.length} lessons to master this path.`}
                    </Text>

                    {completedInCategory === allLessons.length && (
                        <Pressable
                            style={[styles.nextModuleBtn, { backgroundColor: currentCategory.color }]}
                            onPress={() => {
                                const currentIdx = LEARN_MODULES.findIndex(
                                    (m) => m.id === currentCategory.id
                                );
                                if (currentIdx < LEARN_MODULES.length - 1) {
                                    const nextCat = LEARN_MODULES[currentIdx + 1];
                                    // @ts-ignore
                                    router.replace({
                                        pathname: '/learn/roadmap',
                                        params: { categoryId: nextCat.id },
                                    });
                                } else {
                                    router.back();
                                }
                            }}
                        >
                            <Text style={styles.nextModuleBtnText}>
                                {LEARN_MODULES.findIndex((m) => m.id === currentCategory.id) <
                                    LEARN_MODULES.length - 1
                                    ? 'Next Category →'
                                    : 'Back to Learn'}
                            </Text>
                        </Pressable>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    center: { alignItems: 'center', justifyContent: 'center' },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 3,
        borderBottomColor: Colors.secondary,
        backgroundColor: Colors.white,
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: Colors.white,
        borderWidth: 2,
        borderColor: Colors.secondary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerCenter: { flex: 1, marginLeft: 16 },
    headerTitle: {
        fontFamily: Typography.fontFamily.black,
        fontSize: 20,
        color: Colors.secondary,
        letterSpacing: -0.5,
    },
    headerProgress: {
        fontFamily: Typography.fontFamily.bold,
        fontSize: 13,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    xpBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.secondary,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: Colors.secondary,
    },
    xpText: {
        fontFamily: Typography.fontFamily.black,
        fontSize: 15,
        color: Colors.neonGreen,
        marginLeft: 6,
    },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 120 },

    // Module Info Card
    moduleInfoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.white,
        borderRadius: 20,
        padding: 18,
        marginTop: 20,
        borderWidth: 3,
        borderColor: Colors.secondary,
        shadowColor: Colors.secondary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 0,
    },
    moduleInfoContent: { flex: 1 },
    moduleInfoTitle: {
        fontFamily: Typography.fontFamily.black,
        fontSize: 18,
        color: Colors.secondary,
        letterSpacing: -0.5,
    },
    moduleInfoDesc: {
        fontFamily: Typography.fontFamily.bold,
        fontSize: 13,
        color: Colors.textSecondary,
        marginTop: 3,
    },
    moduleInfoStats: {
        flexDirection: 'row',
        gap: 14,
        marginTop: 8,
    },
    moduleInfoStat: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    moduleInfoStatText: {
        fontFamily: Typography.fontFamily.bold,
        fontSize: 12,
        color: Colors.textSecondary,
    },
    moduleInfoPercent: {
        marginLeft: 10,
    },
    moduleInfoPercentText: {
        fontFamily: Typography.fontFamily.black,
        fontSize: 24,
    },

    // chapter
    chapterSection: {
        width: '100%',
        marginBottom: 20,
    },
    chapterBanner: {
        padding: 18,
        borderRadius: 20,
        borderWidth: 3,
        marginBottom: 10,
        marginTop: 20,
        alignItems: 'center',
    },
    chapterNum: {
        fontFamily: Typography.fontFamily.black,
        fontSize: 12,
        letterSpacing: 2,
        marginBottom: 4,
    },
    chapterTitle: {
        fontFamily: Typography.fontFamily.black,
        fontSize: 20,
        color: Colors.secondary,
        textAlign: 'center',
    },
    chapterDesc: {
        fontFamily: Typography.fontFamily.bold,
        fontSize: 13,
        color: Colors.secondary,
        textAlign: 'center',
        marginTop: 4,
    },
    lessonsContainer: {
        alignItems: 'center',
    },

    // Path
    pathContainer: { alignItems: 'center', paddingVertical: 10 },
    nodeRow: { alignItems: 'center', marginVertical: 14 },
    connector: {
        width: 6,
        height: 48,
        borderRadius: 3,
        marginBottom: -6,
        borderWidth: 2,
    },
    nodeWrapper: { alignItems: 'center', position: 'relative' },
    node: {
        width: 84,
        height: 84,
        borderRadius: 42,
        backgroundColor: Colors.white,
        borderWidth: 4,
        borderColor: Colors.secondary,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: Colors.secondary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 1,
        shadowRadius: 0,
        elevation: 6,
    },
    nodeLabel: {
        position: 'absolute',
        top: 14,
        width: 155,
    },
    nodeLabelText: {
        fontFamily: Typography.fontFamily.black,
        fontSize: 14,
        color: Colors.secondary,
        textAlign: 'center',
        lineHeight: 18,
    },
    nodeLabelTextCurrent: { color: Colors.secondary },
    nodeMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 6,
    },
    diffBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    diffBadgeText: {
        fontFamily: Typography.fontFamily.black,
        fontSize: 9,
        letterSpacing: 0.5,
    },
    xpMiniRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    xpMiniText: {
        fontFamily: Typography.fontFamily.black,
        fontSize: 11,
        color: Colors.textSecondary,
    },

    // End Banner
    endBanner: {
        alignItems: 'center',
        marginTop: 20,
        padding: 32,
        backgroundColor: Colors.white,
        borderRadius: 24,
        borderWidth: 4,
        shadowColor: Colors.secondary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 1,
        shadowRadius: 0,
    },
    endEmoji: { fontSize: 64, marginBottom: 16 },
    endTitle: {
        fontFamily: Typography.fontFamily.black,
        fontSize: 24,
        color: Colors.secondary,
        textAlign: 'center',
    },
    endSubtitle: {
        fontFamily: Typography.fontFamily.bold,
        fontSize: 15,
        color: Colors.textSecondary,
        marginTop: 10,
        textAlign: 'center',
        lineHeight: 22,
    },
    nextModuleBtn: {
        marginTop: 20,
        paddingHorizontal: 28,
        paddingVertical: 14,
        borderRadius: 20,
        borderWidth: 3,
        borderColor: Colors.secondary,
    },
    nextModuleBtnText: {
        fontFamily: Typography.fontFamily.black,
        fontSize: 16,
        color: '#FFF',
    },
});
