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
import { Mail, Lock, Eye, EyeOff, Globe, ArrowLeft, User } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from '@/components/Toast';
import { ScrollView } from 'react-native';

export default function SignUpScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { signUp, signIn, signInWithGoogle } = useAuth();
    const [displayName, setDisplayName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
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
        if (!displayName.trim()) {
            errors.displayName = 'Full name is required';
        }
        if (!email.trim()) {
            errors.email = 'Email is required';
        } else if (!validateEmail(email.trim())) {
            errors.email = 'Please enter a valid email address';
        }
        if (!password) {
            errors.password = 'Password is required';
        } else if (password.length < 6) {
            errors.password = 'Password must be at least 6 characters';
        }
        if (!confirmPassword) {
            errors.confirmPassword = 'Please confirm your password';
        } else if (password !== confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
        }
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSignUp = async () => {
        if (!validate()) {
            try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); } catch { }
            triggerShake();
            const firstError = Object.values(fieldErrors)[0] || 'Please fix the errors above';
            showToast(firstError, 'error');
            return;
        }
        setIsLoading(true);
        try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch { }
        const { data, error: signUpError } = await signUp(email.trim(), password, displayName.trim());
        setIsLoading(false);
        if (signUpError) {
            // Check for duplicate email
            if (signUpError.toLowerCase().includes('already registered') ||
                signUpError.toLowerCase().includes('already been registered') ||
                signUpError.toLowerCase().includes('duplicate')) {
                showToast('An account with this email already exists. Try logging in!', 'warning');
            } else {
                showToast(signUpError, 'error');
            }
            triggerShake();
            return;
        }
        // Check if email verification is needed (no session returned)
        if (data && (!data.session || !data.session.access_token)) {
            showToast('Account created! Please check your email to verify your account.', 'success');
            // Don't auto-login; user needs to verify email first
            return;
        }
        showToast('Account created successfully! 🎉', 'success');
        // Auto sign-in after successful sign-up (if email verification is off)
        setTimeout(async () => {
            const { error: loginError, onboardingCompleted } = await signIn(email.trim(), password);
            if (loginError) {
                showToast(loginError, 'error');
                return;
            }
            // New signups always go to onboarding
            // @ts-ignore
            router.replace('/onboarding');
        }, 1200);
    };

    const handleGoogleSignUp = async () => {
        try {
            const { error: googleError } = await signInWithGoogle();
            if (googleError) {
                showToast(googleError, 'error');
                return;
            }
        } catch (e) {
            showToast('Google sign-up failed. Please try again.', 'error');
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
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={[styles.container, { paddingTop: Math.max(insets.top, 20), paddingBottom: Math.max(insets.bottom, 20) }]}>
                <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
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
                        <Text style={styles.title}>Create Account</Text>
                        <Text style={styles.subtitle}>Join the Pedestal community.</Text>
                    </View>

                    {/* Name */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Full Name</Text>
                        <View style={[styles.inputWrapper, fieldErrors.displayName && styles.inputWrapperError]}>
                            <User size={20} color={fieldErrors.displayName ? Colors.error : Colors.textMuted} strokeWidth={2.5} />
                            <TextInput
                                style={styles.input}
                                placeholder="Abhiman Raj"
                                placeholderTextColor={Colors.textMuted}
                                value={displayName}
                                onChangeText={(t) => { setDisplayName(t); clearFieldError('displayName'); }}
                                autoCapitalize="words"
                            />
                        </View>
                        {fieldErrors.displayName && <Text style={styles.fieldErrorText}>{fieldErrors.displayName}</Text>}
                    </View>

                    {/* Email */}
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

                    {/* Password */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Password</Text>
                        <View style={[styles.inputWrapper, fieldErrors.password && styles.inputWrapperError]}>
                            <Lock size={20} color={fieldErrors.password ? Colors.error : Colors.textMuted} strokeWidth={2.5} />
                            <TextInput
                                style={styles.input}
                                placeholder="Min 6 characters"
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

                    {/* Confirm Password */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Confirm Password</Text>
                        <View style={[styles.inputWrapper, fieldErrors.confirmPassword && styles.inputWrapperError]}>
                            <Lock size={20} color={fieldErrors.confirmPassword ? Colors.error : Colors.textMuted} strokeWidth={2.5} />
                            <TextInput
                                style={styles.input}
                                placeholder="Repeat password"
                                placeholderTextColor={Colors.textMuted}
                                value={confirmPassword}
                                onChangeText={(t) => { setConfirmPassword(t); clearFieldError('confirmPassword'); }}
                                secureTextEntry={!showPassword}
                            />
                            <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={10}>
                                {showPassword ? <EyeOff size={20} color={Colors.textMuted} strokeWidth={2} /> : <Eye size={20} color={Colors.textMuted} strokeWidth={2} />}
                            </Pressable>
                        </View>
                        {fieldErrors.confirmPassword && <Text style={styles.fieldErrorText}>{fieldErrors.confirmPassword}</Text>}
                    </View>

                    {/* Sign Up Button */}
                    <Pressable
                        style={({ pressed }) => [
                            styles.primaryButton,
                            pressed && styles.primaryButtonPressed,
                            isLoading && { opacity: 0.7 },
                        ]}
                        onPress={handleSignUp}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color={Colors.secondary} />
                        ) : (
                            <Text style={styles.primaryButtonText}>CREATE ACCOUNT</Text>
                        )}
                    </Pressable>

                    {/* Google Sign Up */}
                    <Pressable style={styles.googleButton} onPress={handleGoogleSignUp}>
                        <Globe size={20} color={Colors.secondary} strokeWidth={2.5} />
                        <Text style={styles.googleButtonText}>Continue with Google</Text>
                    </Pressable>

                    {/* Switch to Login */}
                    <View style={styles.switchContainer}>
                        <Text style={styles.switchText}>Already have an account? </Text>
                        <Pressable onPress={() => // @ts-ignore
                            router.replace('/login')}>
                            <Text style={styles.switchLink}>Log In</Text>
                        </Pressable>
                    </View>
                </Animated.View>
                </ScrollView>
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
    googleButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.white, borderWidth: 2, borderColor: Colors.secondary, borderRadius: 28, height: 52, marginTop: Spacing.xl, marginBottom: Spacing.sm },
    googleButtonText: { marginLeft: 8, fontFamily: Typography.fontFamily.bold, fontSize: 16, color: Colors.secondary },
    switchContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: Spacing.lg },
    switchText: { fontFamily: Typography.fontFamily.medium, fontSize: 15, color: Colors.textSecondary },
    switchLink: { fontFamily: Typography.fontFamily.extraBold, fontSize: 15, color: Colors.secondary, textDecorationLine: 'underline' },
});
