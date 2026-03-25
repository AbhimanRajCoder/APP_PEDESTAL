import React, { useEffect, useState, useRef } from 'react';
import {
    View, Text, StyleSheet, Pressable, Animated, Dimensions, ScrollView, ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, ArrowRight, RotateCcw, Star, Zap, X, Check, ChevronRight, Trophy, Flame } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { playSound } from '@/utils/sounds';
import { LEARN_MODULES, Category, Chapter, Lesson, FlashCard, QuizQuestion } from '@/data/learnModules';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/context/AuthContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PROGRESS_KEY_PREFIX = 'learn_progress_';
const XP_KEY = 'learn_total_xp';
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

type Phase = 'flashcard' | 'quiz' | 'result';

export default function LessonScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const params = useLocalSearchParams<{
        lessonId: string;
        lessonTitle: string;
        categoryId: string;
        categoryColor: string;
    }>();

    const { session, refreshProfile } = useAuth();
    const [phase, setPhase] = useState<Phase>('flashcard');
    const [loading, setLoading] = useState(true);

    // Chapter data
    const [chapter, setChapter] = useState<Chapter | null>(null);
    const [cards, setCards] = useState<FlashCard[]>([]);

    // Quiz state using a resizable queue
    const [quizQueue, setQuizQueue] = useState<QuizQuestion[]>([]);
    const [qIndex, setQIndex] = useState(0);
    const [selected, setSelected] = useState<number | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [lessonXpReward, setLessonXpReward] = useState(0);

    // Stats
    const [totalXp, setTotalXp] = useState(0);
    const [correctCount, setCorrectCount] = useState(0);
    const [firstTryCorrectCount, setFirstTryCorrectCount] = useState(0);
    const [failedQuestions, setFailedQuestions] = useState<Set<string>>(new Set());

    // Flashcard state
    const [cardIndex, setCardIndex] = useState(0);
    const [flipped, setFlipped] = useState(false);
    const flipAnim = useRef(new Animated.Value(0)).current;

    // Animations
    const progressAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const shakeAnim = useRef(new Animated.Value(0)).current;
    const celebrateAnim = useRef(new Animated.Value(0)).current;

    const accentColor = params.categoryColor || Colors.neonGreen;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.spring(slideAnim, { toValue: 0, friction: 8, useNativeDriver: true }),
        ]).start();
        loadLessonContent();
    }, []);

    const loadLessonContent = async () => {
        try {
            // 1. Try to fetch from backend first
            if (params.lessonId && BACKEND_URL && session?.access_token) {
                console.log('📡 Fetching lesson from backend...', params.lessonId);
                const response = await fetch(`${BACKEND_URL}/api/lessons/${params.lessonId}`, {
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    console.log('✅ Lesson data fetched from DB:', data.title);

                    // Parse blocks into flashcards and quiz
                    const dbCards: FlashCard[] = [];
                    const dbQuiz: QuizQuestion[] = [];

                    if (data.blocks) {
                        data.blocks.forEach((b: any) => {
                            if (b.block_type === 'flashcard' && b.content) {
                                dbCards.push({
                                    front: b.content.front || '',
                                    back: b.content.back || '',
                                });
                            } else if (b.block_type === 'quiz' && b.content) {
                                dbQuiz.push({
                                    q: b.content.q || '',
                                    options: b.content.options || [],
                                    correct: b.content.correct !== undefined ? b.content.correct : 0,
                                    xp: b.content.xp || 10,
                                    difficulty: b.content.difficulty || 'easy',
                                    explanation: b.content.explanation || '',
                                });
                            }
                        });
                    }

                    if (dbCards.length > 0 || dbQuiz.length > 0) {
                        setChapter({ title: data.title } as any);
                        setLessonXpReward(data.xp_reward || 0);
                        setCards(dbCards);
                        setQuizQueue(dbQuiz);
                        setLoading(false);
                        return;
                    }
                }
            }

            // 2. Fallback to hardcoded modules if backend fails or no session
            for (const cat of LEARN_MODULES) {
                for (const ch of cat.chapters) {
                    for (const l of ch.lessons) {
                        if (l.id === params.lessonId) {
                            setChapter({ ...ch, lessons: [] });
                            setLessonXpReward(l.xpReward);
                            setCards(l.flashcards);
                            setQuizQueue(l.quiz);
                            setLoading(false);
                            return;
                        }
                    }
                }
            }
        } catch (e) {
            console.warn('Failed to load lesson:', e);
        }
        setLoading(false);
    };

    // ─── Progress ──────────────────────
    const totalSteps = cards.length + quizQueue.length;
    const currentStep = phase === 'flashcard' ? cardIndex : cards.length + qIndex;

    useEffect(() => {
        Animated.timing(progressAnim, {
            toValue: totalSteps > 0 ? (currentStep + 1) / totalSteps : 0,
            duration: 300, useNativeDriver: false,
        }).start();
    }, [currentStep, totalSteps]);

    // ─── Flashcard Logic ───────────────
    const handleFlip = () => {
        try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch { }
        playSound('flip');
        setFlipped(!flipped);
        Animated.spring(flipAnim, {
            toValue: flipped ? 0 : 1, friction: 8, tension: 60, useNativeDriver: true,
        }).start();
    };

    const handleNextCard = () => {
        try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch { }
        playSound('tap');
        setFlipped(false);
        flipAnim.setValue(0);
        if (cardIndex < cards.length - 1) {
            setCardIndex(cardIndex + 1);
        } else {
            setPhase('quiz');
        }
    };

    // ─── Quiz Logic ────────────────────
    const handleAnswer = (optIdx: number) => {
        if (showResult) return;
        setSelected(optIdx);
        setShowResult(true);

        const currentQ = quizQueue[qIndex];
        const isCorrect = optIdx === currentQ.correct;

        if (isCorrect) {
            try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch { }
            playSound('correct');
            
            // ✅ CORRECTED XP SYSTEM: 
            // - Full XP for first try
            // - 50% XP for retries
            const isFirstTry = !failedQuestions.has(currentQ.q);
            const xpToGain = isFirstTry ? currentQ.xp : Math.floor(currentQ.xp / 2);
            
            setTotalXp((prev) => prev + xpToGain);
            setCorrectCount((prev) => prev + 1);
            if (isFirstTry) {
                setFirstTryCorrectCount(prev => prev + 1);
            }
        } else {
            try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); } catch { }
            playSound('wrong');
            
            // Track as failed to reduce XP on future retry
            setFailedQuestions(prev => {
                const next = new Set(prev);
                next.add(currentQ.q);
                return next;
            });

            Animated.sequence([
                Animated.timing(shakeAnim, { toValue: 12, duration: 50, useNativeDriver: true }),
                Animated.timing(shakeAnim, { toValue: -12, duration: 50, useNativeDriver: true }),
                Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
                Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
            ]).start();
        }
    };

    const saveProgress = async () => {
        if (!params.lessonId) return;
        try {
            // Local fallback
            await AsyncStorage.setItem(`${PROGRESS_KEY_PREFIX}${params.lessonId}`, 'completed');
            const currentXpStr = await AsyncStorage.getItem(XP_KEY);
            const currentXpValue = currentXpStr ? parseInt(currentXpStr, 10) : 0;
            
            // Add Lesson Completion Bonus (if available)
            const finalSessionXp = totalXp + lessonXpReward;
            
            await AsyncStorage.setItem(XP_KEY, String(currentXpValue + finalSessionXp));

            // Sync with backend if logged in
            console.log('📤 Attempting to sync progress...', { lessonId: params.lessonId, url: BACKEND_URL });

            if (session?.access_token && BACKEND_URL) {
                const quizScorePct = quizQueue.length > 0
                    ? (firstTryCorrectCount / quizQueue.length) * 100
                    : 100;

                const response = await fetch(`${BACKEND_URL}/api/progress`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.access_token}`
                    },
                    body: JSON.stringify({
                        lesson_id: params.lessonId,
                        is_completed: true,
                        quiz_score: Math.round(quizScorePct),
                        xp_earned: finalSessionXp,
                        completed_at: new Date().toISOString()
                    })
                });

                if (response.ok) {
                    console.log('✅ Progress successfully saved to Supabase');
                    await refreshProfile();
                } else {
                    const errText = await response.text();
                    console.warn('❌ Failed to save progress to backend:', errText);
                }
            }
        } catch (e) {
            console.warn('Failed to save progress:', e);
        }
    };

    const handleNextQuestion = () => {
        const currentQ = quizQueue[qIndex];
        const isCorrect = selected === currentQ.correct;

        // Push wrong questions to the end of the queue to retry later
        if (!isCorrect) {
            setQuizQueue(prev => [...prev, currentQ]);
        }

        setSelected(null);
        setShowResult(false);

        // We use quizQueue.length because if we push a new question, setQuizQueue is async, but we can just use the updated expected length manually or rely on `qIndex < quizQueue.length + (isCorrect ? -1 : 0)`
        if (qIndex < quizQueue.length - (isCorrect ? 1 : 0)) {
            setQIndex(qIndex + 1);
        } else {
            // Lesson complete!
            saveProgress();
            playSound('complete');
            try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch { }
            setPhase('result');
            Animated.spring(celebrateAnim, { toValue: 1, friction: 4, useNativeDriver: true }).start();
        }
    };

    // ─── Loading ───────────────────────
    if (loading) {
        return (
            <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    if (!chapter || (cards.length === 0 && quizQueue.length === 0)) {
        return (
            <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
                <Text style={styles.emptyText}>No content available for this lesson.</Text>
                <Pressable style={styles.emptyBtn} onPress={() => { playSound('tap'); router.back(); }}>
                    <Text style={styles.emptyBtnText}>Go Back</Text>
                </Pressable>
            </View>
        );
    }

    // ─── Result Screen ─────────────────
    if (phase === 'result') {
        return (
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <Animated.View style={[styles.resultContainer, { transform: [{ scale: celebrateAnim }] }]}>
                    <View style={styles.resultIcon}>
                        <Flame size={52} color="#F59E0B" strokeWidth={2} fill="#FDE68A" />
                    </View>
                    <Text style={styles.resultTitle}>Vibe Check Passed.</Text>
                    <Text style={styles.resultSubtitle}>{params.lessonTitle}</Text>

                    <View style={styles.resultStats}>
                        <View style={styles.statCard}>
                            <Star size={24} color="#F59E0B" strokeWidth={2.5} fill="#F59E0B" />
                            <Text style={styles.statValue}>{totalXp + lessonXpReward}</Text>
                            <Text style={styles.statLabel}>XP SECURED</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Check size={24} color="#22C55E" strokeWidth={3} />
                            <Text style={styles.statValue}>{firstTryCorrectCount}/{quizQueue.length}</Text>
                            <Text style={styles.statLabel}>PERFECT HITS</Text>
                        </View>
                    </View>

                    {lessonXpReward > 0 && (
                        <View style={styles.bonusBadge}>
                            <Zap size={16} color={Colors.white} fill={Colors.white} />
                            <Text style={styles.bonusBadgeText}>+{lessonXpReward} COMPLETION BONUS</Text>
                        </View>
                    )}



                    <Pressable
                        style={styles.continueBtn}
                        onPress={() => {
                            playSound('tap');
                            router.back();
                        }}
                    >
                        <Text style={styles.continueBtnText}>Keep Grinding</Text>
                        <ChevronRight size={20} color="#FFF" strokeWidth={3} />
                    </Pressable>
                </Animated.View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Top Bar */}
            <View style={styles.topBar}>
                <Pressable onPress={() => { playSound('tap'); router.back(); }} style={styles.closeBtn}>
                    <X size={20} color={Colors.textMuted} strokeWidth={2.5} />
                </Pressable>
                <View style={styles.progressBarBg}>
                    <Animated.View style={[styles.progressBarFill, {
                        width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                        backgroundColor: accentColor,
                    }]} />
                </View>
                <View style={styles.xpMini}>
                    <Star size={12} color="#F59E0B" strokeWidth={3} fill="#F59E0B" />
                    <Text style={styles.xpMiniText}>{totalXp}</Text>
                </View>
            </View>

            {/* ─── FLASHCARD PHASE ─── */}
            {phase === 'flashcard' && cards.length > 0 && (
                <Animated.View style={[styles.phaseContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                    <View style={styles.phaseHeader}>
                        <Text style={styles.phaseLabel}>CONCEPT {cardIndex + 1}/{cards.length}</Text>
                        <Text style={styles.phaseSubtitle}>Tap card to reveal truths.</Text>
                    </View>

                    <View style={styles.cardContainer}>
                        <Pressable onPress={handleFlip} style={styles.cardOuter}>
                            {/* Front Side */}
                            <Animated.View style={[
                                styles.card,
                                styles.cardPosition,
                                {
                                    opacity: flipAnim.interpolate({ inputRange: [0, 0.5, 0.51, 1], outputRange: [1, 1, 0, 0] }),
                                    transform: [{
                                        rotateY: flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }),
                                    }],
                                    zIndex: flipped ? 0 : 1,
                                },
                            ]}>
                                <View style={styles.cardFront}>
                                    <View style={styles.conceptBadge}>
                                        <Text style={styles.conceptBadgeText}>THE TERM</Text>
                                    </View>
                                    <Text style={styles.cardFrontText}>{cards[cardIndex].front}</Text>
                                    <View style={styles.tapHint}>
                                        <Text style={styles.tapHintText}>TAP TO FLIP</Text>
                                        <RotateCcw size={14} color={Colors.secondary} strokeWidth={3} />
                                    </View>
                                </View>
                            </Animated.View>

                            {/* Back Side */}
                            <Animated.View style={[
                                styles.card,
                                styles.cardBackBg,
                                styles.cardPosition,
                                {
                                    opacity: flipAnim.interpolate({ inputRange: [0, 0.49, 0.5, 1], outputRange: [0, 0, 1, 1] }),
                                    transform: [{
                                        rotateY: flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '0deg'] }),
                                    }],
                                    zIndex: flipped ? 1 : 0,
                                },
                            ]}>
                                <View style={styles.cardBack}>
                                    <View style={styles.revealBadge}>
                                        <Text style={styles.revealBadgeText}>THE TRUTH</Text>
                                    </View>
                                    <Text style={styles.cardBackText}>{cards[cardIndex].back}</Text>
                                </View>
                            </Animated.View>
                        </Pressable>
                    </View>

                    <Pressable
                        style={({ pressed }) => [
                            styles.mainButton,
                            pressed && styles.mainButtonPressed,
                        ]}
                        onPress={handleNextCard}
                    >
                        <Text style={styles.mainButtonText}>
                            {cardIndex < cards.length - 1 ? 'NEXT' : 'FACE THE QUIZ'}
                        </Text>
                        <ArrowRight size={20} color={Colors.secondary} strokeWidth={3} />
                    </Pressable>
                </Animated.View>
            )}

            {/* ─── QUIZ PHASE ─── */}
            {phase === 'quiz' && quizQueue.length > 0 && (
                <Animated.View style={[styles.phaseContainer, { transform: [{ translateX: shakeAnim }] }]}>
                    <View style={styles.quizHeader}>
                        <Text style={styles.phaseLabel}>CHALLENGE {qIndex + 1}/{quizQueue.length}</Text>
                        {quizQueue[qIndex].difficulty === 'hard' && (
                            <View style={styles.hardBadge}>
                                <Zap size={12} color="#FFF" strokeWidth={3} />
                                <Text style={styles.hardBadgeText}>HARD</Text>
                            </View>
                        )}
                        {quizQueue[qIndex].difficulty === 'medium' && (
                            <View style={[styles.hardBadge, { backgroundColor: '#F59E0B' }]}>
                                <Text style={[styles.hardBadgeText, { color: '#FFF' }]}>MID</Text>
                            </View>
                        )}
                    </View>

                    <ScrollView style={styles.quizScroll} showsVerticalScrollIndicator={false}>
                        <Text style={styles.questionText}>{quizQueue[qIndex].q}</Text>

                        <View style={styles.optionsContainer}>
                            {quizQueue[qIndex].options.map((opt, idx) => {
                                const isSelected = selected === idx;
                                const isCorrect = idx === quizQueue[qIndex].correct;
                                const showCorrect = showResult && isCorrect;
                                const showWrong = showResult && isSelected && !isCorrect;

                                return (
                                    <Pressable
                                        key={idx}
                                        style={[
                                            styles.option,
                                            isSelected && !showResult && styles.optionSelected,
                                            showCorrect && styles.optionCorrect,
                                            showWrong && styles.optionWrong,
                                        ]}
                                        onPress={() => handleAnswer(idx)}
                                        disabled={showResult}
                                    >
                                        <View style={[
                                            styles.optionLetter,
                                            showCorrect && { backgroundColor: '#22C55E' },
                                            showWrong && { backgroundColor: '#EF4444' },
                                        ]}>
                                            <Text style={[
                                                styles.optionLetterText,
                                                (showCorrect || showWrong) && { color: '#FFF' },
                                            ]}>
                                                {String.fromCharCode(65 + idx)}
                                            </Text>
                                        </View>

                                        <Text style={[
                                            styles.optionText,
                                            showCorrect && { color: '#166534' },
                                            showWrong && { color: '#991B1B' },
                                        ]}>{opt}</Text>

                                        {showCorrect && <Check size={22} color="#22C55E" strokeWidth={3.5} />}
                                        {showWrong && <X size={22} color="#EF4444" strokeWidth={3.5} />}
                                    </Pressable>
                                );
                            })}
                        </View>

                        {/* Feedback Banner */}
                        {showResult && (
                            <View style={[
                                styles.feedback,
                                selected === quizQueue[qIndex].correct
                                    ? styles.feedbackCorrect
                                    : styles.feedbackWrong,
                            ]}>
                                <Text style={[
                                    styles.feedbackTitle,
                                    selected === quizQueue[qIndex].correct ? { color: '#166534' } : { color: '#991B1B' }
                                ]}>
                                    {selected === quizQueue[qIndex].correct ? 'Correct.' : 'Incorrect.'}
                                </Text>
                                <Text style={[
                                    styles.feedbackText,
                                    selected === quizQueue[qIndex].correct ? { color: '#166534' } : { color: '#991B1B' }
                                ]}>
                                    {quizQueue[qIndex].explanation}
                                </Text>
                                {selected === quizQueue[qIndex].correct ? (
                                    <View style={styles.xpGainTextCont}>
                                        <Text style={styles.xpGainText}>+{quizQueue[qIndex].xp} XP BOOST</Text>
                                    </View>
                                ) : (
                                    <Text style={styles.retryHint}>We'll revisit this one later.</Text>
                                )}
                            </View>
                        )}
                    </ScrollView>

                    {showResult && (
                        <Pressable
                            style={({ pressed }) => [
                                styles.mainButton,
                                selected !== quizQueue[qIndex].correct && styles.retryBtn,
                                pressed && styles.mainButtonPressed,
                            ]}
                            onPress={handleNextQuestion}
                        >
                            <Text style={[
                                styles.mainButtonText,
                                selected !== quizQueue[qIndex].correct && { color: '#FFF' }
                            ]}>
                                CONTINUE
                            </Text>
                            <ArrowRight
                                size={20}
                                color={selected !== quizQueue[qIndex].correct ? '#FFF' : Colors.secondary}
                                strokeWidth={3}
                            />
                        </Pressable>
                    )}
                </Animated.View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    center: { alignItems: 'center', justifyContent: 'center' },
    topBar: {
        flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
        paddingVertical: 12, gap: 12, borderBottomWidth: 3, borderBottomColor: Colors.secondary,
        backgroundColor: Colors.white,
    },
    closeBtn: {
        width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.white,
        borderWidth: 2, borderColor: Colors.secondary,
        alignItems: 'center', justifyContent: 'center',
    },
    progressBarBg: {
        flex: 1, height: 16, backgroundColor: Colors.white, borderRadius: 8, overflow: 'hidden',
        borderWidth: 2, borderColor: Colors.secondary,
    },
    progressBarFill: {
        height: '100%', backgroundColor: Colors.neonGreen, borderRadius: 4,
    },
    xpMini: {
        flexDirection: 'row', alignItems: 'center', gap: 3,
        paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
        backgroundColor: Colors.secondary,
    },
    xpMiniText: { fontFamily: Typography.fontFamily.extraBold, fontSize: 13, color: Colors.neonGreen },
    phaseContainer: { flex: 1, paddingHorizontal: 20 },
    phaseHeader: { marginTop: 20, marginBottom: 10 },
    phaseLabel: {
        fontFamily: Typography.fontFamily.black, fontSize: 24, color: Colors.secondary,
        letterSpacing: -1,
    },
    phaseSubtitle: {
        fontFamily: Typography.fontFamily.bold, fontSize: 16, color: Colors.textSecondary, marginTop: 4,
    },
    // ── Flashcard ──
    cardContainer: { flex: 1, justifyContent: 'center', marginVertical: 20 },
    cardOuter: { width: '100%', height: 340 },
    cardPosition: { position: 'absolute', width: '100%', height: '100%' },
    card: {
        borderRadius: 24, backgroundColor: Colors.white,
        borderWidth: 4, borderColor: Colors.secondary, overflow: 'hidden',
        shadowColor: Colors.secondary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 1,
        shadowRadius: 0, elevation: 4,
    },
    cardBackBg: { backgroundColor: Colors.neonGreen },
    cardFront: {
        flex: 1, padding: 32, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.white,
    },
    conceptBadge: {
        position: 'absolute', top: 24, backgroundColor: Colors.secondary, paddingHorizontal: 16, paddingVertical: 6,
        borderRadius: 12, borderWidth: 2, borderColor: Colors.secondary,
    },
    conceptBadgeText: { fontFamily: Typography.fontFamily.black, fontSize: 10, color: Colors.white, letterSpacing: 1 },
    cardFrontText: {
        fontFamily: Typography.fontFamily.black, fontSize: 32, color: Colors.secondary,
        textAlign: 'center', lineHeight: 36, letterSpacing: -1,
    },
    tapHint: {
        flexDirection: 'row', alignItems: 'center', gap: 6, position: 'absolute', bottom: 24,
    },
    tapHintText: { fontFamily: Typography.fontFamily.black, fontSize: 13, color: Colors.secondary, letterSpacing: 1 },
    cardBack: {
        flex: 1, padding: 32, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.neonGreen,
    },
    revealBadge: {
        position: 'absolute', top: 24, backgroundColor: Colors.secondary, paddingHorizontal: 16, paddingVertical: 6,
        borderRadius: 12, borderWidth: 2, borderColor: Colors.secondary,
    },
    revealBadgeText: { fontFamily: Typography.fontFamily.black, fontSize: 10, color: Colors.neonGreen, letterSpacing: 1 },
    cardBackText: {
        fontFamily: Typography.fontFamily.bold, fontSize: 22, color: Colors.secondary,
        textAlign: 'center', lineHeight: 30, letterSpacing: -0.5,
    },
    mainButton: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        backgroundColor: Colors.neonGreen, height: 64, borderRadius: 32, gap: 10,
        marginBottom: 40, borderWidth: 3, borderColor: Colors.secondary,
        shadowColor: Colors.secondary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 1,
        shadowRadius: 0, elevation: 4,
    },
    mainButtonPressed: { marginTop: 6, marginBottom: 14, shadowOffset: { width: 0, height: 0 } },
    mainButtonText: { fontFamily: Typography.fontFamily.black, fontSize: 18, color: Colors.secondary, letterSpacing: 1 },
    retryBtn: { backgroundColor: Colors.error },
    // ── Quiz ──
    quizHeader: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12,
    },
    hardBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.secondary,
        paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12,
    },
    hardBadgeText: { fontFamily: Typography.fontFamily.black, fontSize: 11, color: Colors.neonGreen, letterSpacing: 0.5 },
    quizScroll: { flex: 1, marginTop: 24 },
    questionText: {
        fontFamily: Typography.fontFamily.black, fontSize: 24, color: Colors.secondary,
        lineHeight: 32, marginBottom: 32, letterSpacing: -0.5,
    },
    optionsContainer: { gap: 16, marginBottom: 20 },
    option: {
        flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: Colors.white,
        borderRadius: 20, borderWidth: 3, borderColor: Colors.secondary, gap: 14,
        shadowColor: Colors.secondary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 0,
    },
    optionSelected: { backgroundColor: Colors.pastelPurple, shadowOffset: { width: 0, height: 0 }, marginTop: 4, marginBottom: -4 },
    optionCorrect: { borderColor: Colors.neonGreen, backgroundColor: '#DCFCE7' },
    optionWrong: { borderColor: Colors.error, backgroundColor: '#FEE2E2' },
    optionLetter: {
        width: 32, height: 32, borderRadius: 8, backgroundColor: Colors.secondary,
        alignItems: 'center', justifyContent: 'center',
    },
    optionLetterText: { fontFamily: Typography.fontFamily.black, fontSize: 14, color: Colors.white },
    optionText: { flex: 1, fontFamily: Typography.fontFamily.bold, fontSize: 18, color: Colors.secondary },
    feedback: {
        padding: 24, borderRadius: 20, marginBottom: 20, borderWidth: 3, borderColor: Colors.secondary,
        backgroundColor: Colors.white, marginTop: 10,
    },
    feedbackCorrect: { backgroundColor: '#BBF7D0' },
    feedbackWrong: { backgroundColor: '#FECACA' },
    feedbackTitle: { fontFamily: Typography.fontFamily.black, fontSize: 20, marginBottom: 8 },
    feedbackText: { fontFamily: Typography.fontFamily.bold, fontSize: 16, lineHeight: 24 },
    xpGainTextCont: {
        marginTop: 14, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: Colors.secondary,
        alignSelf: 'flex-start', borderRadius: 10,
    },
    xpGainText: { fontFamily: Typography.fontFamily.black, fontSize: 15, color: Colors.neonGreen, letterSpacing: 0.5 },
    retryHint: {
        fontFamily: Typography.fontFamily.black, fontSize: 14, marginTop: 14, color: '#991B1B', textDecorationLine: 'underline',
    },
    // ── Result ──
    resultContainer: {
        flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28,
    },
    resultIcon: {
        width: 120, height: 120, borderRadius: 60, backgroundColor: Colors.white,
        alignItems: 'center', justifyContent: 'center', marginBottom: 24,
        borderWidth: 4, borderColor: Colors.secondary,
        shadowColor: Colors.secondary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 1, shadowRadius: 0,
    },
    resultTitle: { fontFamily: Typography.fontFamily.black, fontSize: 36, color: Colors.secondary, textAlign: 'center', letterSpacing: -1 },
    resultSubtitle: { fontFamily: Typography.fontFamily.bold, fontSize: 18, color: Colors.textSecondary, marginTop: 8 },
    resultStats: {
        flexDirection: 'row', gap: 12, marginTop: 40, marginBottom: 20,
    },
    statCard: {
        flex: 1, alignItems: 'center', padding: 16, backgroundColor: Colors.white,
        borderRadius: 20, borderWidth: 3, borderColor: Colors.secondary, gap: 6,
        shadowColor: Colors.secondary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 0,
    },
    statValue: { fontFamily: Typography.fontFamily.black, fontSize: 28, color: Colors.secondary },
    statLabel: { fontFamily: Typography.fontFamily.black, fontSize: 11, color: Colors.textSecondary, letterSpacing: 0.5 },
    resultDiffBadge: {
        paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, marginBottom: 30,
    },
    resultDiffText: {
        fontFamily: Typography.fontFamily.black, fontSize: 14, letterSpacing: 1,
    },
    bonusBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: Colors.secondary, paddingHorizontal: 20, paddingVertical: 10,
        borderRadius: 14, marginBottom: 30, borderWidth: 2, borderColor: Colors.neonGreen,
    },
    bonusBadgeText: {
        fontFamily: Typography.fontFamily.black, fontSize: 14, color: Colors.white, letterSpacing: 0.5,
    },
    continueBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        backgroundColor: Colors.neonGreen, height: 64, borderRadius: 32, gap: 10,
        width: '100%', borderWidth: 3, borderColor: Colors.secondary,
        shadowColor: Colors.secondary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 1, shadowRadius: 0,
    },
    continueBtnText: { fontFamily: Typography.fontFamily.black, fontSize: 20, color: Colors.secondary, letterSpacing: 1 },
    // ── Empty State ──
    emptyText: {
        fontFamily: Typography.fontFamily.bold, fontSize: 18, color: Colors.textSecondary, marginBottom: 20, textAlign: 'center',
    },
    emptyBtn: {
        backgroundColor: Colors.secondary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 16,
    },
    emptyBtnText: {
        fontFamily: Typography.fontFamily.black, fontSize: 16, color: Colors.white,
    },
});
