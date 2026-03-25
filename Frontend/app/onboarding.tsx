import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Animated,
    Dimensions,
    Platform,
    Easing,
    ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Check, TrendingUp, AlertTriangle, Scale, Target, Shield, Zap } from 'lucide-react-native';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const QUESTIONS = [
    {
        id: 'persona',
        title: 'Where are you in your money journey?',
        subtitle: 'Your starting point shapes your strategy.',
        options: [
            { id: 'student', title: 'Student', subtitle: 'Just getting started, limited income', icon: Target },
            { id: 'early_career', title: 'Early Career', subtitle: 'Earning, figuring out structure', icon: TrendingUp },
            { id: 'independent', title: 'Independent Earner', subtitle: 'Freelancer, side hustle, variable income', icon: Zap },
            { id: 'explorer', title: 'Curious Explorer', subtitle: 'Learning before committing', icon: Scale },
        ],
    },
    {
        id: 'behavior',
        title: 'How do you move with money?',
        subtitle: 'Be honest. This shapes your game plan.',
        options: [
            { id: 'planner', title: 'Planner Mode', subtitle: 'Structured and tracking everything', icon: Shield },
            { id: 'casual', title: 'Casual Tracker', subtitle: 'I check occasionally', icon: Target },
            { id: 'impulse', title: 'Impulse Operator', subtitle: 'I spend first, think later', icon: Zap },
            { id: 'unstructured', title: 'Unstructured', subtitle: 'I have no system at all', icon: AlertTriangle },
        ],
    },
    {
        id: 'friction',
        title: 'What creates friction for you?',
        subtitle: 'Identify the roadblock.',
        options: [
            { id: 'fear', title: 'Loss Aversion', subtitle: 'Fear of losing money', icon: AlertTriangle },
            { id: 'saving', title: 'Savings Gap', subtitle: 'Not saving enough', icon: TrendingUp },
            { id: 'complexity', title: 'The Maze', subtitle: 'Complexity and taxes', icon: Scale },
            { id: 'spending', title: 'Leakage', subtitle: 'Overspending habits', icon: Zap },
        ],
    },
    {
        id: 'scenario',
        title: 'You wake up. ₹50,000 hits your account.',
        subtitle: 'What is your immediate move?',
        options: [
            { id: 'multiply', title: 'Multiply It', subtitle: 'Invest it immediately', icon: TrendingUp },
            { id: 'lock', title: 'Lock It Away', subtitle: 'Put it in safe savings', icon: Shield },
            { id: 'upgrade', title: 'Upgrade Lifestyle', subtitle: 'Spend it on experiences/items', icon: Zap },
            { id: 'freeze', title: 'Freeze', subtitle: 'No plan yet, leave it there', icon: AlertTriangle },
        ],
    },
    {
        id: 'stability',
        title: 'How stable are you right now?',
        subtitle: 'Assessing your safety net.',
        options: [
            { id: 'covered', title: 'Covered (3+ Months)', subtitle: 'Full emergency fund ready', icon: Shield },
            { id: 'some', title: 'Some Cushion', subtitle: 'A little saved, but not enough', icon: Scale },
            { id: 'none', title: 'No Backup', subtitle: 'Living edge-to-edge', icon: AlertTriangle },
            { id: 'unknown', title: 'Unknown', subtitle: 'I don’t know what that means', icon: Target },
        ],
    },
    {
        id: 'outcome',
        title: 'What are we optimizing for?',
        subtitle: 'Defining your ultimate win condition.',
        options: [
            { id: 'safety', title: 'Safety First', subtitle: 'Build an unbreakable safety net', icon: Shield },
            { id: 'investing', title: 'Confident Investor', subtitle: 'Start investing systematically', icon: TrendingUp },
            { id: 'spending', title: 'Fix Spending Leaks', subtitle: 'Master the cash flow', icon: Target },
            { id: 'markets', title: 'Market Mastery', subtitle: 'Deep dive into advanced wealth', icon: Zap },
        ],
    },
];

export default function OnboardingScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { session, refreshProfile } = useAuth();
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [isBuilding, setIsBuilding] = useState(false);
    const [buildSubtitle, setBuildSubtitle] = useState('Analyzing risk profile...');

    // Animations
    const slideAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const loadingPulse = useRef(new Animated.Value(1)).current;
    const progressAnim = useRef(new Animated.Value(0)).current;
    const buildProgressAnim = useRef(new Animated.Value(0)).current;

    const currentQuestion = QUESTIONS[currentStep];
    const isLastStep = currentStep === QUESTIONS.length - 1;
    const hasSelected = !!answers[currentQuestion.id];

    // Progress calculation
    const progressPercentage = Math.round(((currentStep + (hasSelected ? 1 : 0)) / QUESTIONS.length) * 100);

    useEffect(() => {
        Animated.timing(progressAnim, {
            toValue: progressPercentage,
            duration: 300,
            useNativeDriver: false,
        }).start();
    }, [progressPercentage]);

    useEffect(() => {
        if (isBuilding) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(loadingPulse, { toValue: 1.15, duration: 800, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
                    Animated.timing(loadingPulse, { toValue: 1, duration: 800, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
                ])
            ).start();

            Animated.timing(buildProgressAnim, {
                toValue: 100,
                duration: 2500,
                useNativeDriver: false,
                easing: Easing.inOut(Easing.ease),
            }).start();

            const t1 = setTimeout(() => setBuildSubtitle('Generating custom pathways...'), 850);
            const t2 = setTimeout(() => setBuildSubtitle('Finalizing your blueprint...'), 1700);

            return () => {
                clearTimeout(t1);
                clearTimeout(t2);
            };
        }
    }, [isBuilding]);

    const handleSelect = (optionId: string) => {
        try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch { }
        setAnswers((prev) => ({ ...prev, [currentQuestion.id]: optionId }));
    };

    const executeTransition = (forward: boolean) => {
        const slideOutTo = forward ? -SCREEN_WIDTH : SCREEN_WIDTH;
        const slideInFrom = forward ? SCREEN_WIDTH : -SCREEN_WIDTH;

        Animated.parallel([
            Animated.timing(slideAnim, {
                toValue: slideOutTo,
                duration: 250,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            })
        ]).start(() => {
            setCurrentStep((prev) => forward ? prev + 1 : prev - 1);
            slideAnim.setValue(slideInFrom);

            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 300,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 250,
                    useNativeDriver: true,
                })
            ]).start();
        });
    };

    const handleNext = () => {
        if (!hasSelected) return;
        try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch { }

        if (isLastStep) {
            setIsBuilding(true);
            // Save onboarding to Supabase in the background
            const saveOnboarding = async () => {
                try {
                    const userId = session?.user?.id;
                    if (userId) {
                        // Save to onboarding_responses table
                        await supabase.from('onboarding_responses').upsert({
                            user_id: userId,
                            responses: answers,
                            computed_scores: {
                                risk_score: 50,
                                discipline_score: 50,
                                knowledge_score: 50,
                                stability_score: 50,
                            },
                        }, { onConflict: 'user_id' });
                        // Mark profile as onboarded
                        await supabase.from('user_profiles').update({
                            onboarding_completed: true,
                        }).eq('auth_uid', userId);
                        // Refresh global auth profile state
                        await refreshProfile();
                    }
                } catch (err) {
                    console.warn('Failed to save onboarding to DB:', err);
                }
                await AsyncStorage.setItem('pedestal.onboarded', 'true');
            };
            saveOnboarding();
            setTimeout(() => {
                router.replace('/(tabs)/home');
            }, 2500); // loading animation time
        } else {
            executeTransition(true);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            try { Haptics.selectionAsync(); } catch { }
            executeTransition(false);
        } else {
            if (router.canGoBack()) {
                router.back();
            } else {
                // Should not normally happen unless directly deep linked, but handle safely
                router.replace('/');
            }
        }
    };

    if (isBuilding) {
        return (
            <View style={styles.buildContainer}>
                <Animated.View style={[styles.buildIconContainer, { transform: [{ scale: loadingPulse }] }]}>
                    <Zap size={44} color={Colors.primary} strokeWidth={2.5} />
                </Animated.View>

                <Text style={styles.buildTitle}>Crafting Your Blueprint</Text>
                <Text style={styles.buildSubtitle}>{buildSubtitle}</Text>

                <View style={styles.buildProgressContainer}>
                    <Animated.View
                        style={[
                            styles.buildProgressBar,
                            {
                                width: buildProgressAnim.interpolate({
                                    inputRange: [0, 100],
                                    outputRange: ['0%', '100%']
                                })
                            }
                        ]}
                    />
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, {
            paddingTop: Math.max(insets.top, 20),
            paddingBottom: Math.max(insets.bottom, 20)
        }]}>
            {/* Dynamic Energy Bar Header */}
            <View style={styles.header}>
                <Pressable onPress={handleBack} style={styles.backButton} hitSlop={15}>
                    <ArrowLeft size={24} color={Colors.secondary} strokeWidth={2.5} />
                </Pressable>
                <View style={styles.progressContainer}>
                    <Text style={styles.progressText}>Identity: {progressPercentage}% Defined</Text>
                    <View style={styles.progressBarBg}>
                        <Animated.View
                            style={[
                                styles.progressBarFill,
                                {
                                    width: progressAnim.interpolate({
                                        inputRange: [0, 100],
                                        outputRange: ['0%', '100%'],
                                    })
                                }
                            ]}
                        />
                    </View>
                </View>
            </View>

            <Animated.View
                style={[
                    styles.content,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateX: slideAnim }],
                    },
                ]}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    style={{ flex: 1 }}
                    contentContainerStyle={styles.scrollContent}
                >
                    <View style={styles.questionSection}>
                        <Text style={styles.title}>{currentQuestion.title}</Text>
                        <Text style={styles.subtitle}>{currentQuestion.subtitle}</Text>
                    </View>

                    <View style={styles.optionsGrid}>
                        {currentQuestion.options.map((option) => {
                            const isSelected = answers[currentQuestion.id] === option.id;
                            const Icon = option.icon;

                            return (
                                <Pressable
                                    key={option.id}
                                    style={[
                                        styles.optionCard,
                                        isSelected && styles.optionCardSelected,
                                    ]}
                                    onPress={() => handleSelect(option.id)}
                                >
                                    <View style={[styles.iconBox, isSelected && styles.iconBoxSelected]}>
                                        <Icon size={22} color={isSelected ? Colors.white : Colors.secondary} strokeWidth={2.5} />
                                    </View>
                                    <View style={styles.optionTextContainer}>
                                        <Text style={[styles.optionTitle, isSelected && styles.optionTitleSelected]}>
                                            {option.title}
                                        </Text>
                                        <Text style={[styles.optionSubtitle, isSelected && styles.optionSubtitleSelected]}>
                                            {option.subtitle}
                                        </Text>
                                    </View>
                                    {isSelected && (
                                        <View style={styles.checkmarkIcon}>
                                            <Check size={16} color={Colors.neonGreen} strokeWidth={3} />
                                        </View>
                                    )}
                                </Pressable>
                            );
                        })}

                        {currentQuestion.id === 'stability' && answers[currentQuestion.id] === 'unknown' && (
                            <Animated.View style={styles.tooltip}>
                                <Text style={styles.tooltipText}>An emergency fund is 3-6 months of living expenses saved in cash.</Text>
                            </Animated.View>
                        )}
                    </View>
                </ScrollView>
            </Animated.View>

            <View style={styles.footer}>
                <Animated.View style={{ opacity: hasSelected ? 1 : 0.4, transform: [{ scale: hasSelected ? 1 : 0.98 }] }}>
                    <Pressable
                        style={[
                            styles.continueButton,
                            hasSelected && styles.continueButtonActive,
                        ]}
                        onPress={handleNext}
                        disabled={!hasSelected}
                    >
                        <Text style={[styles.continueButtonText, hasSelected && styles.continueButtonTextActive]}>
                            {isLastStep ? 'Finalize Blueprint' : 'Continue'}
                        </Text>
                    </Pressable>
                </Animated.View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAFA', // Soft off-white
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.xl,
        gap: Spacing.lg,
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    progressContainer: {
        flex: 1,
        gap: 8,
    },
    progressText: {
        fontFamily: Typography.fontFamily.bold,
        fontSize: 13,
        color: Colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    progressBarBg: {
        height: 6,
        backgroundColor: '#EDEDED',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#B5F44A', // Muted neon green
        borderRadius: 3,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.lg,
        paddingBottom: Spacing.xxl + 40,
    },
    questionSection: {
        marginBottom: Spacing.xxxl,
    },
    title: {
        fontFamily: Typography.fontFamily.black,
        fontSize: 34,
        color: '#111111',
        lineHeight: 40,
        letterSpacing: -1,
        marginBottom: 12,
    },
    subtitle: {
        fontFamily: Typography.fontFamily.medium,
        fontSize: 16,
        color: '#666666',
        lineHeight: 24,
    },
    optionsGrid: {
        gap: Spacing.md,
    },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: '#EEEEEE',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
        elevation: 2,
    },
    optionCardSelected: {
        borderColor: '#B5F44A',
        backgroundColor: '#111111',
        transform: [{ scale: 1.02 }],
        shadowColor: '#B5F44A',
        shadowOpacity: 0.15,
        shadowRadius: 15,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: '#F5F5F5',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.lg,
    },
    iconBoxSelected: {
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    optionTextContainer: {
        flex: 1,
    },
    optionTitle: {
        fontFamily: Typography.fontFamily.bold,
        fontSize: 17,
        color: '#111111',
        marginBottom: 4,
    },
    optionTitleSelected: {
        color: '#FFFFFF',
    },
    optionSubtitle: {
        fontFamily: Typography.fontFamily.medium,
        fontSize: 13,
        color: '#888888',
    },
    optionSubtitleSelected: {
        color: '#AAAAAA',
    },
    checkmarkIcon: {
        marginLeft: 16,
    },
    tooltip: {
        marginTop: 8,
        padding: 16,
        backgroundColor: '#F0F0F0',
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#B5F44A',
    },
    tooltipText: {
        fontFamily: Typography.fontFamily.medium,
        fontSize: 13,
        color: '#555',
        lineHeight: 20,
    },
    footer: {
        padding: Spacing.xxl,
    },
    continueButton: {
        backgroundColor: '#E5E5E5',
        paddingVertical: 18,
        borderRadius: 30,
        alignItems: 'center',
    },
    continueButtonActive: {
        backgroundColor: '#111111',
    },
    continueButtonText: {
        fontFamily: Typography.fontFamily.bold,
        fontSize: 16,
        color: '#999999',
    },
    continueButtonTextActive: {
        color: '#B5F44A',
    },
    // Build Screen Styles
    buildContainer: {
        flex: 1,
        backgroundColor: Colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.xxl,
    },
    buildIconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: Colors.primary + '15',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.xxl,
        borderWidth: 2,
        borderColor: Colors.primary + '30',
    },
    buildTitle: {
        fontFamily: Typography.fontFamily.extraBold,
        fontSize: 26,
        color: Colors.secondary,
        textAlign: 'center',
        marginBottom: 8,
    },
    buildSubtitle: {
        fontFamily: Typography.fontFamily.medium,
        fontSize: 15,
        color: Colors.textSecondary,
        textAlign: 'center',
        marginBottom: Spacing.xxxl,
    },
    buildProgressContainer: {
        width: '70%',
        height: 6,
        backgroundColor: Colors.inputBorder,
        borderRadius: 3,
        overflow: 'hidden',
    },
    buildProgressBar: {
        height: '100%',
        backgroundColor: Colors.primary,
        borderRadius: 3,
    },
});
