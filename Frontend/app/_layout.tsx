import { useEffect, useState, useRef, useCallback } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
} from '@expo-google-fonts/nunito';
import 'react-native-reanimated';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';
import { View, Text, Animated, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, X } from 'lucide-react-native';
import { Colors, BorderRadius, Spacing, Typography } from '@/constants/theme';
import CustomSplashScreen from '@/components/splashscreen';

// Prevent native splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

function RootNavigator({ fontsLoaded }: { fontsLoaded: boolean }) {
  const { session, loading, profileLoading, onboardingCompleted } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const hasNavigated = useRef(false);

  useEffect(() => {
    // Wait until ALL loading states are resolved (Auth + Profile + Fonts)
    if (loading || profileLoading || !fontsLoaded) return;

    const currentRoute = segments[0] as string | undefined;
    // Auth pages = index (Get Started), login, signup
    const isAuthPage = currentRoute === 'login' || currentRoute === 'signup' || !currentRoute;

    if (session) {
      // User is logged in — redirect away from auth pages
      if (isAuthPage) {
        if (!onboardingCompleted) {
          // @ts-ignore
          router.replace('/onboarding');
        } else {
          router.replace('/(tabs)/home');
        }
        hasNavigated.current = true;
      }
    } else {
      // User is NOT logged in — force to Get Started page (no guest access allowed)
      if (!isAuthPage) {
        router.replace('/');
        hasNavigated.current = false;
      }
    }
  }, [session, loading, profileLoading, onboardingCompleted, segments]);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
        <Stack.Screen
          name="onboarding"
          options={{
            gestureEnabled: false,
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="(tabs)"
          options={{
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="learn"
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="paper-trading"
          options={{
            animation: 'slide_from_right',
          }}
        />

      </Stack>
      <StatusBar style="dark" />
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
  });

  const insets = useSafeAreaInsets();
  const [showCustomSplash, setShowCustomSplash] = useState(true);
  const [nativeSplashHidden, setNativeSplashHidden] = useState(false);

  // Custom Toast State
  const [toastTitle, setToastTitle] = useState('');
  const [toastBody, setToastBody] = useState('');
  const toastSlideAnim = useRef(new Animated.Value(-200)).current;

  const hideToast = () => {
    Animated.timing(toastSlideAnim, {
      toValue: -200,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  // Hide native splash immediately once fonts are loaded, then show custom splash
  useEffect(() => {
    if (fontsLoaded && !nativeSplashHidden) {
      SplashScreen.hideAsync();
      setNativeSplashHidden(true);
    }
  }, [fontsLoaded]);

  const handleCustomSplashFinish = useCallback(() => {
    setShowCustomSplash(false);
  }, []);

  // Firebase Messaging Initialization (wrapped in try-catch for iOS safety)
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    async function initFirebaseMessaging() {
      try {
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (enabled) {
          try {
            const token = await messaging().getToken();
            console.log('[Firebase] FCM Token:', token);
          } catch (tokenErr) {
            console.warn('[Firebase] Could not get FCM token:', tokenErr);
          }
        }

        // Listen to foreground messages
        unsubscribe = messaging().onMessage(async remoteMessage => {
          setToastTitle(remoteMessage.notification?.title || 'New Notification');
          setToastBody(remoteMessage.notification?.body || 'You received a new message.');

          // Slide down
          Animated.spring(toastSlideAnim, {
            toValue: insets.top + 10,
            speed: 12,
            bounciness: 6,
            useNativeDriver: true,
          }).start();

          // Auto hide after 4 seconds
          setTimeout(() => {
            hideToast();
          }, 4000);
        });
      } catch (e) {
        console.warn('[Firebase] Messaging init skipped (Firebase not configured):', e);
      }
    }

    initFirebaseMessaging();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [insets.top]);

  if (!fontsLoaded) {
    return null; // native splash still visible
  }

  return (
    <AuthProvider>
      <View style={{ flex: 1 }}>
        <RootNavigator fontsLoaded={fontsLoaded} />

        {/* Foreground In-App Notification Toast */}
        <Animated.View style={[
          styles.toastContainer,
          { transform: [{ translateY: toastSlideAnim }] }
        ]}>
          <View style={styles.toastIconBox}>
            <Bell size={24} color={Colors.white} strokeWidth={2.5} />
          </View>
          <View style={styles.toastContent}>
            <Text style={styles.toastTitle} numberOfLines={1}>{toastTitle}</Text>
            <Text style={styles.toastBody} numberOfLines={2}>{toastBody}</Text>
          </View>
          <Pressable style={styles.toastClose} onPress={hideToast}>
            <X size={20} color={Colors.secondary} strokeWidth={3} />
          </Pressable>
        </Animated.View>

        {/* Custom Animated Splash Screen Overlay */}
        {showCustomSplash && (
          <CustomSplashScreen onFinish={handleCustomSplashFinish} />
        )}
      </View>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 0,
    left: Spacing.xl,
    right: Spacing.xl,
    backgroundColor: Colors.white,
    borderWidth: 3,
    borderColor: Colors.secondary,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
    zIndex: 9999,
  },
  toastIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.neonGreen,
    borderWidth: 2,
    borderColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastContent: {
    flex: 1,
  },
  toastTitle: {
    fontFamily: Typography.fontFamily.black,
    fontSize: 16,
    color: Colors.secondary,
    marginBottom: 2,
  },
  toastBody: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  toastClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.progressBg,
    borderWidth: 2,
    borderColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  }
});
