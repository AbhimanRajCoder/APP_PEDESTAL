import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { Colors, Typography } from '@/constants/theme';
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
    visible: boolean;
    message: string;
    type?: ToastType;
    duration?: number;
    onHide?: () => void;
}

const ICONS = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertTriangle,
    info: Info,
};

const BG_COLORS: Record<ToastType, string> = {
    success: '#ECFDF5',
    error: '#FEF2F2',
    warning: '#FFFBEB',
    info: '#EFF6FF',
};

const BORDER_COLORS: Record<ToastType, string> = {
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6',
};

const ICON_COLORS: Record<ToastType, string> = {
    success: '#059669',
    error: '#DC2626',
    warning: '#D97706',
    info: '#2563EB',
};

const TEXT_COLORS: Record<ToastType, string> = {
    success: '#065F46',
    error: '#991B1B',
    warning: '#92400E',
    info: '#1E40AF',
};

export default function Toast({ visible, message, type = 'error', duration = 3500, onHide }: ToastProps) {
    const translateY = useRef(new Animated.Value(-120)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(translateY, {
                    toValue: 0,
                    friction: 8,
                    tension: 60,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();

            const timer = setTimeout(() => {
                Animated.parallel([
                    Animated.timing(translateY, {
                        toValue: -120,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                    Animated.timing(opacity, {
                        toValue: 0,
                        duration: 250,
                        useNativeDriver: true,
                    }),
                ]).start(() => {
                    onHide?.();
                });
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [visible, message]);

    if (!visible) return null;

    const Icon = ICONS[type];

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    backgroundColor: BG_COLORS[type],
                    borderLeftColor: BORDER_COLORS[type],
                    transform: [{ translateY }],
                    opacity,
                },
            ]}
        >
            <Icon size={22} color={ICON_COLORS[type]} strokeWidth={2.5} />
            <Text style={[styles.message, { color: TEXT_COLORS[type] }]}>{message}</Text>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 60,
        left: 16,
        right: 16,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderLeftWidth: 4,
        zIndex: 9999,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
    },
    message: {
        flex: 1,
        marginLeft: 12,
        fontFamily: Typography.fontFamily.bold,
        fontSize: 14,
        lineHeight: 20,
    },
});
