import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Image,
  Animated,
  StatusBar,
} from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface CustomSplashScreenProps {
  onFinish: () => void;
}

export default function CustomSplashScreen({ onFinish }: CustomSplashScreenProps) {
  // Animation values
  const logoScale = useRef(new Animated.Value(0.6)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const shimmerTranslate = useRef(new Animated.Value(-SCREEN_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const fadeOut = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Phase 1: Fade in the splash image with a subtle zoom
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Phase 2: Shimmer sweep across the screen
      Animated.timing(shimmerTranslate, {
        toValue: SCREEN_WIDTH * 1.5,
        duration: 800,
        useNativeDriver: true,
      }).start();

      // Phase 3: Pulse the overlay glow
      Animated.sequence([
        Animated.timing(overlayOpacity, {
          toValue: 0.15,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Phase 4: Fade out the entire splash
        Animated.timing(fadeOut, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }).start(() => {
          onFinish();
        });
      });
    });
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: fadeOut }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* Full-screen splash image */}
      <Animated.Image
        source={require('@/assets/images/splash.png')}
        style={[
          styles.splashImage,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          },
        ]}
        resizeMode="cover"
      />

      {/* Shimmer overlay sweep */}
      <Animated.View
        style={[
          styles.shimmer,
          {
            transform: [{ translateX: shimmerTranslate }],
          },
        ]}
      />

      {/* Glow pulse overlay */}
      <Animated.View
        style={[
          styles.glowOverlay,
          { opacity: overlayOpacity },
        ]}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#4338CA', // matches splash.png dominant purple-blue
    zIndex: 9999,
  },
  splashImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_WIDTH * 0.6,
    height: SCREEN_HEIGHT,
    backgroundColor: 'transparent',
    // Diagonal shimmer band
    borderLeftWidth: 0,
    opacity: 0.18,
    // Using a simple white gradient effect via transform + skew workaround
    // We'll use a semi-transparent white strip
    // For a real shimmer, this band sweeps across
    transform: [{ skewX: '-20deg' }],
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 60,
    elevation: 0,
    // Fallback: a visible white band
    borderRightWidth: 80,
    borderRightColor: 'rgba(255, 255, 255, 0.12)',
  },
  glowOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#22C55E', // neonGreen glow
  },
});
