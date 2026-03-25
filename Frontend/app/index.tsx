import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Animated,
    Dimensions,
    Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Rect, Path, Defs, Pattern, Circle, G, LinearGradient, Stop, Line } from 'react-native-svg';
import { ArrowRight, TrendingUp } from 'lucide-react-native';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function WelcomeScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    // Animations
    const floatAnim1 = useRef(new Animated.Value(0)).current;
    const floatAnim2 = useRef(new Animated.Value(0)).current;
    const slideUpAnim = useRef(new Animated.Value(50)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Entrance Animations
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.spring(slideUpAnim, {
                toValue: 0,
                tension: 40,
                friction: 8,
                useNativeDriver: true,
            }),
        ]).start();

        // Floating cards animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(floatAnim1, {
                    toValue: -15,
                    duration: 2500,
                    useNativeDriver: true,
                }),
                Animated.timing(floatAnim1, {
                    toValue: 0,
                    duration: 2500,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(floatAnim2, {
                    toValue: 10,
                    duration: 3000,
                    useNativeDriver: true,
                }),
                Animated.timing(floatAnim2, {
                    toValue: 0,
                    duration: 3000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const handleGetStarted = () => {
        try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch { }
        router.push('/signup');
    };

    const handleLogin = () => {
        try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch { }
        router.push('/login');
    };

    return (
        <View style={styles.container}>
            {/* Background Pattern */}
            <View style={StyleSheet.absoluteFill}>
                <Svg width="100%" height="100%">
                    <Defs>
                        <Pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                            <Circle cx="2" cy="2" r="1.5" fill={Colors.inputBorder} />
                        </Pattern>
                    </Defs>
                    <Rect x="0" y="0" width="100%" height="100%" fill="url(#dots)" />
                </Svg>
            </View>

            <View style={[styles.content, {
                paddingTop: Math.max(insets.top, 20),
                paddingBottom: Math.max(insets.bottom, 20)
            }]}>
                {/* Top brand */}
                <Animated.View style={[styles.brandContainer, { opacity: fadeAnim }]}>
                    <View style={styles.logoDot} />
                    <Text style={styles.brandText}>pedestal</Text>
                </Animated.View>

                {/* Art Section */}
                <View style={styles.artContainer}>
                    {/* Background Pattern dots for the art area */}
                    <Svg width={200} height={200} style={{ position: 'absolute', top: 50, left: 50, opacity: 0.15 }}>
                        <Defs>
                            <Pattern id="miniDots" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
                                <Circle cx="2" cy="2" r="1.5" fill={Colors.secondary} />
                            </Pattern>
                        </Defs>
                        <Rect width="100%" height="100%" fill="url(#miniDots)" />
                    </Svg>

                    {/* Back Card (Yellow Accent) */}
                    <Animated.View style={[
                        styles.cardBack,
                        { transform: [{ translateY: floatAnim2 }, { rotateZ: '-8deg' }] }
                    ]}>
                        <Svg width="180" height="180">
                            <Rect width="180" height="180" rx="32" fill={Colors.pastelYellow} stroke={Colors.secondary} strokeWidth="4" />
                            {/* Abstract inner shapes */}
                            <Circle cx="40" cy="40" r="12" fill={Colors.secondary} />
                            <Path d="M 40 90 L 140 90 M 40 120 L 100 120" stroke={Colors.secondary} strokeWidth="8" strokeLinecap="round" />
                        </Svg>
                    </Animated.View>

                    {/* Middle Card (Purple Accent) */}
                    <Animated.View style={[
                        styles.cardMiddle,
                        { transform: [{ translateY: floatAnim1 }, { rotateZ: '12deg' }] }
                    ]}>
                        <Svg width="190" height="140">
                            <Rect width="190" height="140" rx="24" fill={Colors.pastelPurple} stroke={Colors.secondary} strokeWidth="4" />
                            <Rect x="20" y="20" width="40" height="40" rx="12" fill={Colors.secondary} />
                            <Path d="M 80 40 L 160 40 M 80 70 L 130 70" stroke={Colors.secondary} strokeWidth="6" strokeLinecap="round" />
                        </Svg>
                    </Animated.View>

                    {/* Front Card (Dark Premium UI) */}
                    <Animated.View style={[
                        styles.cardFront,
                        { transform: [{ translateY: floatAnim2 }, { rotateZ: '-3deg' }] }
                    ]}>
                        <Svg width="220" height="150">
                            {/* Main Card Body */}
                            <Rect width="220" height="150" rx="20" fill={Colors.secondary} stroke={Colors.neonGreen} strokeWidth="2" />

                            {/* Chip */}
                            <Rect x="20" y="25" width="34" height="24" rx="6" fill={Colors.pastelYellow} />
                            <Path d="M 26 31 L 48 31 M 26 37 L 48 37 M 26 43 L 48 43" stroke={Colors.secondary} strokeWidth="2" strokeLinecap="round" />

                            {/* Neon Green Contactless Icon */}
                            <Path d="M 180 25 A 30 30 0 0 1 180 50 M 190 20 A 40 40 0 0 1 190 55" stroke={Colors.neonGreen} strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.8" />

                            {/* Account Balance visual */}
                            <Circle cx="30" cy="115" r="10" fill={Colors.neonGreen} />
                            <Circle cx="50" cy="115" r="10" fill={Colors.pastelPurple} opacity="0.9" />

                            {/* Fake Account Number */}
                            <Path d="M 100 115 L 140 115 M 150 115 L 190 115" stroke={Colors.white} strokeWidth="5" strokeLinecap="round" opacity="0.4" />
                        </Svg>
                    </Animated.View>
                </View>

                {/* Text Section */}
                <Animated.View
                    style={[
                        styles.textSection,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideUpAnim }],
                        },
                    ]}
                >
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>FINANCE FOR GEN-Z</Text>
                    </View>
                    <Text style={styles.title}>
                        Level up your{'\n'}money game.
                    </Text>
                    <Text style={styles.subtitle}>
                        Learn, invest, and dominate your financial future. No boring spreadsheets allowed.
                    </Text>
                </Animated.View>

                {/* Actions */}
                <Animated.View
                    style={[
                        styles.actionSection,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideUpAnim }],
                        },
                    ]}
                >
                    <Pressable
                        style={({ pressed }) => [
                            styles.primaryButton,
                            pressed && styles.primaryButtonPressed,
                        ]}
                        onPress={handleGetStarted}
                    >
                        <Text style={styles.primaryButtonText}>Get Started</Text>
                        <View style={styles.primaryButtonIcon}>
                            <ArrowRight size={20} color={Colors.white} strokeWidth={3} />
                        </View>
                    </Pressable>

                    <Pressable
                        style={({ pressed }) => [
                            styles.secondaryButton,
                            pressed && styles.secondaryButtonPressed,
                        ]}
                        onPress={handleLogin}
                    >
                        <Text style={styles.secondaryButtonText}>I already have an account</Text>
                    </Pressable>
                </Animated.View>

            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    content: {
        flex: 1,
        paddingHorizontal: Spacing.xxl,
        justifyContent: 'space-between',
    },
    brandContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    logoDot: {
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: Colors.neonGreen,
        borderWidth: 2,
        borderColor: Colors.secondary,
    },
    brandText: {
        fontFamily: Typography.fontFamily.black,
        fontSize: 20,
        color: Colors.secondary,
        letterSpacing: -0.5,
    },
    artContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: Spacing.xl,
        position: 'relative',
    },
    cardBack: {
        position: 'absolute',
        top: 20,
        left: '10%',
        shadowColor: '#000',
        shadowOffset: { width: -4, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
    },
    cardMiddle: {
        position: 'absolute',
        top: '25%',
        right: '5%',
        shadowColor: '#000',
        shadowOffset: { width: 6, height: 12 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
    },
    cardFront: {
        position: 'absolute',
        bottom: 30,
        shadowColor: Colors.neonGreen,
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.25,
        shadowRadius: 30,
        elevation: 10,
    },
    textSection: {
        marginTop: Spacing.xxl,
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
    title: {
        fontFamily: Typography.fontFamily.black,
        fontSize: 44,
        lineHeight: 48,
        color: Colors.secondary,
        letterSpacing: -1.5,
        marginBottom: Spacing.md,
    },
    subtitle: {
        fontFamily: Typography.fontFamily.medium,
        fontSize: 16,
        color: Colors.textSecondary,
        lineHeight: 24,
        marginBottom: Spacing.xl,
        paddingRight: Spacing.xl,
    },
    actionSection: {
        gap: Spacing.md,
    },
    primaryButton: {
        backgroundColor: Colors.secondary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
        borderRadius: 36,
    },
    primaryButtonPressed: {
        backgroundColor: '#000000',
        transform: [{ scale: 0.98 }],
    },
    primaryButtonText: {
        fontFamily: Typography.fontFamily.extraBold,
        fontSize: 18,
        color: Colors.white,
        letterSpacing: 0.5,
    },
    primaryButtonIcon: {
        position: 'absolute',
        right: 8,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondaryButton: {
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondaryButtonPressed: {
        opacity: 0.6,
    },
    secondaryButtonText: {
        fontFamily: Typography.fontFamily.bold,
        fontSize: 16,
        color: Colors.secondary,
    },
});
