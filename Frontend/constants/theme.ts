// pedestal-theme-playbank.ts

export const Colors = {
  // Core Palette
  background: '#F8FAFC',
  primary: '#2563EB',
  primaryDark: '#1E40AF',
  secondary: '#111827',
  secondaryLight: '#4B5563',

  // Inspiration Pastel & Contrast Colors
  pastelPurple: '#DDD6FE',
  pastelYellow: '#FEF3C7',
  pastelRed: '#FECACA',
  pastelGreen: '#BBF7D0',
  neonGreen: '#22C55E',
  darkCard: '#111827',
  darkCardText: '#FFFFFF',

  // UI Colors
  white: '#FFFFFF',
  cardBg: '#FFFFFF',
  inputBg: '#FFFFFF',
  inputBorder: '#E5E7EB',
  inputBorderFocus: '#2563EB',

  // Text Colors
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  textOnPrimary: '#FFFFFF',

  // Status Colors
  error: '#EF4444',
  errorBg: '#FEE2E2',
  success: '#22C55E',
  warning: '#FACC15',

  // Special
  progressBg: '#E5E7EB',
  streak: '#F97316',
  xp: '#FBBF24',
  purple: '#C4B5FD',
  purpleLight: '#EDE9FE',

  // 3D border colors
  border3dGreen: '#1E40AF',
  border3dNavy: '#000000',
  border3dAccent: '#FBBF24',

  // Skill node colors
  nodeLocked: '#E5E7EB',
  nodeComplete: '#2563EB',
  nodeCurrent: '#111827',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
};

export const BorderRadius = {
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  full: 999,
};

export const Typography = {
  fontFamily: {
    regular: 'Nunito_400Regular',
    medium: 'Nunito_500Medium',
    semiBold: 'Nunito_600SemiBold',
    bold: 'Nunito_700Bold',
    extraBold: 'Nunito_800ExtraBold',
    black: 'Nunito_900Black',
  },
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 22,
    xxl: 28,
    xxxl: 34,
    hero: 42,
  },
};

export const Shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
};

export const get3DBorderStyle = (color: string, width: number = 4) => ({
  borderBottomWidth: width,
  borderBottomColor: color,
});