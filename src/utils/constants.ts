export const APP_NAME = 'Top10Game';

export const COLORS = {
  primary: '#4F46E5',
  background: '#0A0A0A',
  card: '#1C1C1E',
  text: '#FFFFFF',
  muted: '#8E8E93',
  accent: '#FF6B6B',
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
  successGlow: 'rgba(16, 185, 129, 0.3)',
  errorGlow: 'rgba(239, 68, 68, 0.3)',
  progressBg: '#1F2937',
  progressFill: '#8B5CF6'
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24
};

export const TYPOGRAPHY = {
  fontFamily: {
    primary: 'System',
    secondary: 'System',
    display: 'System'
  },
  fontWeight: {
    light: '300',
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900'
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
    loose: 1.8
  }
};

// Accessibility constants
export const ACCESSIBILITY = {
  minTouchTarget: 44, // Minimum touch target size in pixels
  contrastRatio: {
    normal: 4.5, // WCAG AA standard
    large: 3.0   // WCAG AA for large text
  },
  colors: {
    // High contrast colors for better accessibility
    primary: '#4F46E5',
    primaryDark: '#3730A3',
    primaryLight: '#6366F1',
    text: '#FFFFFF',
    textSecondary: '#E5E7EB',
    textMuted: '#9CA3AF',
    background: '#0A0A0A',
    backgroundSecondary: '#1C1C1E',
    border: '#374151',
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6'
  }
};

export const ANIMATIONS = {
  duration: {
    fast: 150,
    normal: 300,
    slow: 500
  },
  easing: {
    easeOut: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0.0, 1, 1)',
    easeInOut: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
    sharp: 'cubic-bezier(0.4, 0.0, 0.6, 1)'
  }
};


