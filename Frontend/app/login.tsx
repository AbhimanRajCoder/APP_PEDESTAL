import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    Pressable,
    Animated,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { ArrowLeft, Mail, Lock, Eye, EyeOff, Globe } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from '@/components/Toast';

export default function LoginScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { signIn, signInWithGoogle } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);
    const shakeAnim = useRef(new Animated.Value(0)).current;

    // Toast state
    const [toastVisible, setToastVisible] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState<'success' | 'error' | 'warning' | 'info'>('error');

    const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'error') => {
        setToastMessage(message);
        setToastType(type);
        setToastVisible(true);
    };

    const triggerShake = () => {
        Animated.sequence([
            Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]).start();
    };

    const validateEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const validate = (): boolean => {
        const errors: Record<string, string> = {};
        if (!email.trim()) {
            errors.email = 'Email is required';
        } else if (!validateEmail(email.trim())) {
            errors.email = 'Please enter a valid email address';
        }
        if (!password) {
            errors.password = 'Password is required';
        }
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleLogin = async () => {
        if (!validate()) {
            try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); } catch { }
            triggerShake();
            const firstError = Object.values(fieldErrors)[0] || 'Please fix the errors above';
            showToast(firstError, 'error');
            return;
        }
        setIsLoading(true);
        try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch { }
        const { error: loginError, onboardingCompleted } = await signIn(email.trim(), password);
        setIsLoading(false);
        if (loginError) {
            // Friendly error messages
            const msg = loginError.toLowerCase();
            if (msg.includes('invalid login') || msg.includes('invalid credentials') || msg.includes('wrong password')) {
                showToast('Incorrect email or password. Please try again.', 'error');
            } else if (msg.includes('email not confirmed') || msg.includes('verify your email')) {
                showToast('Please verify your email address first. Check your inbox!', 'warning');
            } else if (msg.includes('not found') || msg.includes('no user')) {
                showToast('No account found with this email. Sign up first!', 'warning');
            } else {
                showToast(loginError, 'error');
            }
            triggerShake();
            return;
        }
        showToast('Welcome back! 🎉', 'success');
        // Navigate directly — don't rely on reactive auth state listener
        if (onboardingCompleted) {
            router.replace('/(tabs)/home');
        } else {
            // @ts-ignore
            router.replace('/onboarding');
        }
    };

    const handleGoogleLogin = async () => {
        try {
            const { error: googleError } = await signInWithGoogle();
            if (googleError) {
                showToast(googleError, 'error');
                return;
            }
        } catch (e) {
            showToast('Google login failed. Please try again.', 'error');
        }
    };

    const clearFieldError = (field: string) => {
        setFieldErrors((prev) => {
            const next = { ...prev };
            delete next[field];
            return next;
        });
    };

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={[styles.container, { paddingTop: Math.max(insets.top, 20), paddingBottom: Math.max(insets.bottom, 20) }]}>
                <Toast
                    visible={toastVisible}
                    message={toastMessage}
                    type={toastType}
                    onHide={() => setToastVisible(false)}
                />
                <View style={styles.header}>
                    <Pressable onPress={() => {
                        if (router.canGoBack()) {
                            router.back();
                        } else {
                            router.replace('/');
                        }
                    }} style={styles.backButton}>
                        <ArrowLeft size={24} color={Colors.secondary} strokeWidth={3} />
                    </Pressable>
                </View>
                <Animated.View style={[styles.formContainer, { transform: [{ translateX: shakeAnim }] }]}>
                    <View style={styles.titleContainer}>
                        <Text style={styles.title}>Welcome Back</Text>
                        <Text style={styles.subtitle}>Log in to continue your journey.</Text>
                    </View>

                    {/* Email Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Email</Text>
                        <View style={[styles.inputWrapper, fieldErrors.email && styles.inputWrapperError]}>
                            <Mail size={20} color={fieldErrors.email ? Colors.error : Colors.textMuted} strokeWidth={2.5} />
                            <TextInput
                                style={styles.input}
                                placeholder="you@genz.inc"
                                placeholderTextColor={Colors.textMuted}
                                value={email}
                                onChangeText={(t) => { setEmail(t); clearFieldError('email'); }}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>
                        {fieldErrors.email && <Text style={styles.fieldErrorText}>{fieldErrors.email}</Text>}
                    </View>

                    {/* Password Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Password</Text>
                        <View style={[styles.inputWrapper, fieldErrors.password && styles.inputWrapperError]}>
                            <Lock size={20} color={fieldErrors.password ? Colors.error : Colors.textMuted} strokeWidth={2.5} />
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your password"
                                placeholderTextColor={Colors.textMuted}
                                value={password}
                                onChangeText={(t) => { setPassword(t); clearFieldError('password'); }}
                                secureTextEntry={!showPassword}
                            />
                            <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={10}>
                                {showPassword ? <EyeOff size={20} color={Colors.textMuted} strokeWidth={2} /> : <Eye size={20} color={Colors.textMuted} strokeWidth={2} />}
                            </Pressable>
                        </View>
                        {fieldErrors.password && <Text style={styles.fieldErrorText}>{fieldErrors.password}</Text>}
                    </View>

                    {/* Sign In Button */}
                    <Pressable
                        style={({ pressed }) => [
                            styles.primaryButton,
                            pressed && styles.primaryButtonPressed,
                            isLoading && { opacity: 0.7 },
                        ]}
                        onPress={handleLogin}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color={Colors.secondary} />
                        ) : (
                            <Text style={styles.primaryButtonText}>SIGN IN</Text>
                        )}
                    </Pressable>

                    {/* Google Sign In */}
                    <Pressable style={styles.googleButton} onPress={handleGoogleLogin}>
                        <Globe size={20} color={Colors.secondary} strokeWidth={2.5} />
                        <Text style={styles.googleButtonText}>Continue with Google</Text>
                    </Pressable>

                    {/* Switch to Sign Up */}
                    <View style={styles.switchContainer}>
                        <Text style={styles.switchText}>Don't have an account? </Text>
                        <Pressable onPress={() => // @ts-ignore
                            router.replace('/signup')}>
                            <Text style={styles.switchLink}>Create Account</Text>
                        </Pressable>
                    </View>
                </Animated.View>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: { paddingHorizontal: Spacing.xl, marginBottom: Spacing.lg },
    backButton: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: Colors.secondary, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.white },
    formContainer: { flex: 1, paddingHorizontal: Spacing.xxl },
    titleContainer: { marginBottom: Spacing.xxxl },
    title: { fontFamily: Typography.fontFamily.black, fontSize: 44, color: Colors.secondary, letterSpacing: -2, marginTop: Spacing.md, lineHeight: 48 },
    subtitle: { fontFamily: Typography.fontFamily.bold, fontSize: 18, color: Colors.pastelPurple, marginTop: 8 },
    inputGroup: { marginBottom: Spacing.lg },
    inputLabel: { fontFamily: Typography.fontFamily.extraBold, fontSize: 14, color: Colors.secondary, marginBottom: 8, textTransform: 'uppercase' },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderWidth: 3, borderColor: Colors.secondary, borderRadius: 16, paddingHorizontal: 16, height: 60 },
    inputWrapperError: { borderColor: Colors.error },
    input: { flex: 1, fontFamily: Typography.fontFamily.bold, fontSize: 16, color: Colors.secondary, marginLeft: 12, height: '100%' },
    fieldErrorText: { fontFamily: Typography.fontFamily.bold, fontSize: 12, color: Colors.error, marginTop: 6, marginLeft: 4 },
    primaryButton: { backgroundColor: Colors.neonGreen, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: Colors.secondary, shadowColor: Colors.secondary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4, marginTop: Spacing.lg, marginBottom: Spacing.xl },
    primaryButtonPressed: { shadowOffset: { width: 0, height: 0 }, marginTop: Spacing.lg + 6, marginBottom: Spacing.xl - 6 },
    primaryButtonText: { fontFamily: Typography.fontFamily.black, fontSize: 20, color: Colors.secondary, letterSpacing: 1 },
    googleButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.white, borderWidth: 2, borderColor: Colors.secondary, borderRadius: 28, height: 52, marginTop: Spacing.lg },
    googleButtonText: { marginLeft: 8, fontFamily: Typography.fontFamily.bold, fontSize: 16, color: Colors.secondary },
    switchContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: Spacing.lg },
    switchText: { fontFamily: Typography.fontFamily.medium, fontSize: 15, color: Colors.textSecondary },
    switchLink: { fontFamily: Typography.fontFamily.extraBold, fontSize: 15, color: Colors.secondary, textDecorationLine: 'underline' },
});
