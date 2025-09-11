/**
 * 🎨 UNIFIED DESIGN SYSTEM
 * 
 * This file contains all design tokens, colors, typography, spacing,
 * and component styles for the entire application.
 * 
 * Usage: Import specific tokens instead of hardcoded values
 * Example: import { COLORS, SPACING, TYPOGRAPHY } from '../design-system';
 */

// ============================================================================
// 🎨 COLOR SYSTEM
// ============================================================================

export const COLORS = {
  // Primary Brand Colors
  primary: '#8B5CF6', // Purple - main brand color
  primaryLight: '#A78BFA',
  primaryDark: '#7C3AED',
  primaryMuted: 'rgba(139, 92, 246, 0.1)',
  primaryBorder: 'rgba(139, 92, 246, 0.3)',
  primaryGlow: 'rgba(139, 92, 246, 0.2)',
  
  // Secondary Colors
  secondary: '#4F46E5', // Indigo
  secondaryLight: '#6366F1',
  secondaryDark: '#3730A3',
  
  // Background Colors
  background: '#0A0A0A', // Main background
  backgroundSecondary: '#0F172A', // Header backgrounds
  backgroundTertiary: '#1E1B4B', // Game screen background
  surface: '#1C1C1E', // Card/surface backgrounds
  surfaceSecondary: '#1E293B', // Alternative surface
  surfaceTertiary: '#312E81', // Answer cards
  
  // Text Colors
  text: '#FFFFFF',
  textSecondary: '#E2E8F0',
  textMuted: '#8E8E93',
  textDisabled: '#64748B',
  
  // Status Colors
  success: '#10B981',
  successLight: '#34D399',
  successDark: '#059669',
  successGlow: 'rgba(16, 185, 129, 0.3)',
  successBg: 'rgba(16, 185, 129, 0.2)',
  
  error: '#EF4444',
  errorLight: '#F87171',
  errorDark: '#DC2626',
  errorGlow: 'rgba(239, 68, 68, 0.3)',
  errorBg: 'rgba(239, 68, 68, 0.2)',
  
  warning: '#F59E0B',
  warningLight: '#FBBF24',
  warningDark: '#D97706',
  
  info: '#3B82F6',
  infoLight: '#60A5FA',
  infoDark: '#2563EB',
  
  // Neutral Colors
  white: '#FFFFFF',
  black: '#000000',
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
    950: '#030712'
  },
  
  // Border Colors
  border: '#374151',
  borderLight: '#4B5563',
  borderDark: '#1F2937',
  borderPrimary: 'rgba(139, 92, 246, 0.8)',
  borderSuccess: 'rgba(16, 185, 129, 0.8)',
  
  // Shadow Colors
  shadow: 'rgba(0, 0, 0, 0.1)',
  shadowPrimary: 'rgba(139, 92, 246, 0.1)',
  shadowSuccess: 'rgba(16, 185, 129, 0.1)',
  shadowError: 'rgba(239, 68, 68, 0.1)',
  
  // Overlay Colors
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
  overlayDark: 'rgba(0, 0, 0, 0.7)',
  
  // Transparent Colors
  transparent: 'transparent',
  primaryAlpha: (opacity: number) => `rgba(139, 92, 246, ${opacity})`,
  successAlpha: (opacity: number) => `rgba(16, 185, 129, ${opacity})`,
  errorAlpha: (opacity: number) => `rgba(239, 68, 68, ${opacity})`,
  blackAlpha: (opacity: number) => `rgba(0, 0, 0, ${opacity})`,
  whiteAlpha: (opacity: number) => `rgba(255, 255, 255, ${opacity})`,
};

// ============================================================================
// 📏 SPACING SYSTEM
// ============================================================================

export const SPACING = {
  // Base spacing scale (4px base unit)
  xs: 4,    // 4px
  sm: 8,    // 8px
  md: 12,   // 12px
  lg: 16,   // 16px
  xl: 24,   // 24px
  '2xl': 32, // 32px
  '3xl': 48, // 48px
  '4xl': 64, // 64px
  '5xl': 80, // 80px
  
  // Semantic spacing
  padding: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    '2xl': 32,
  },
  margin: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    '2xl': 32,
  },
  gap: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    '2xl': 32,
  }
};

// ============================================================================
// 📝 TYPOGRAPHY SYSTEM
// ============================================================================

export const TYPOGRAPHY = {
  fontFamily: {
    primary: 'System',
    secondary: 'System',
    display: 'System',
    mono: 'Courier New'
  },
  
  fontWeight: {
    light: '300' as const,
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
    black: '900' as const
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
    '5xl': 48,
    '6xl': 60
  },
  
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
    loose: 1.8
  },
  
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1,
    widest: 2
  }
};

// ============================================================================
// 🎯 COMPONENT STYLES
// ============================================================================

export const COMPONENT_STYLES = {
  // Button Styles
  button: {
    primary: {
      backgroundColor: COLORS.primary,
      borderColor: COLORS.primary,
      color: COLORS.white,
      borderRadius: 12,
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.lg,
      minHeight: 44, // Accessibility minimum
    },
    secondary: {
      backgroundColor: COLORS.surface,
      borderColor: COLORS.border,
      borderWidth: 2,
      color: COLORS.text,
      borderRadius: 12,
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.lg,
      minHeight: 44,
    },
    success: {
      backgroundColor: COLORS.success,
      borderColor: COLORS.success,
      color: COLORS.white,
      borderRadius: 12,
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.lg,
      minHeight: 44,
    },
    error: {
      backgroundColor: COLORS.error,
      borderColor: COLORS.error,
      color: COLORS.white,
      borderRadius: 12,
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.lg,
      minHeight: 44,
    },
    disabled: {
      backgroundColor: COLORS.gray[600],
      borderColor: COLORS.gray[600],
      color: COLORS.gray[400],
      opacity: 0.6,
    }
  },
  
  // Card Styles
  card: {
    default: {
      backgroundColor: COLORS.surface,
      borderRadius: 12,
      padding: SPACING.lg,
      borderWidth: 1,
      borderColor: COLORS.border,
    },
    elevated: {
      backgroundColor: COLORS.surface,
      borderRadius: 12,
      padding: SPACING.lg,
      shadowColor: COLORS.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    selected: {
      backgroundColor: COLORS.primaryMuted,
      borderColor: COLORS.primary,
      borderWidth: 2,
    }
  },
  
  // Outline Styles - Consistent project identity
  outline: {
    // Primary outline for main content areas
    primary: {
      borderWidth: 1,
      borderColor: COLORS.border,
      borderRadius: 12,
    },
    // Secondary outline for sub-sections
    secondary: {
      borderWidth: 1,
      borderColor: COLORS.borderLight,
      borderRadius: 8,
    },
    // Accent outline for highlighted content
    accent: {
      borderWidth: 2,
      borderColor: COLORS.primary,
      borderRadius: 12,
    },
    // Success outline for positive feedback
    success: {
      borderWidth: 2,
      borderColor: COLORS.success,
      borderRadius: 12,
    },
    // Error outline for negative feedback
    error: {
      borderWidth: 2,
      borderColor: COLORS.error,
      borderRadius: 12,
    },
    // Subtle outline for minimal emphasis
    subtle: {
      borderWidth: 1,
      borderColor: COLORS.borderDark,
      borderRadius: 8,
    },
    // Glow outline for interactive elements
    glow: {
      borderWidth: 2,
      borderColor: COLORS.primary,
      borderRadius: 12,
      shadowColor: COLORS.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    }
  },
  
  // Input Styles
  input: {
    default: {
      backgroundColor: COLORS.surface,
      borderColor: COLORS.border,
      borderWidth: 1,
      borderRadius: 8,
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.lg,
      color: COLORS.text,
      fontSize: TYPOGRAPHY.fontSize.base,
      minHeight: 44,
    },
    focused: {
      borderColor: COLORS.primary,
      borderWidth: 2,
    },
    error: {
      borderColor: COLORS.error,
      borderWidth: 2,
    },
    success: {
      borderColor: COLORS.success,
      borderWidth: 2,
    }
  },
  
  // Header Styles
  header: {
    default: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.md,
      backgroundColor: COLORS.backgroundSecondary,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.border,
    }
  },
  
  // Back Button Styles
  backButton: {
    default: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      borderRadius: 22,
      backgroundColor: COLORS.primaryAlpha(0.08),
      borderWidth: 1,
      borderColor: COLORS.primaryBorder,
      shadowColor: COLORS.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    icon: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: COLORS.primaryAlpha(0.2),
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    }
  }
};

// ============================================================================
// 🎭 ANIMATION SYSTEM
// ============================================================================

export const ANIMATIONS = {
  duration: {
    fast: 150,
    normal: 300,
    slow: 500,
    slower: 750
  },
  
  easing: {
    easeOut: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0.0, 1, 1)',
    easeInOut: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
    sharp: 'cubic-bezier(0.4, 0.0, 0.6, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
  },
  
  // Common animation configurations
  fadeIn: {
    duration: 300,
    easing: 'easeOut'
  },
  
  slideIn: {
    duration: 300,
    easing: 'easeOut'
  },
  
  scaleIn: {
    duration: 200,
    easing: 'easeOut'
  },
  
  bounce: {
    duration: 500,
    easing: 'bounce'
  }
};

// ============================================================================
// ♿ ACCESSIBILITY SYSTEM
// ============================================================================

export const ACCESSIBILITY = {
  // Minimum touch target size (WCAG guidelines)
  minTouchTarget: 44,
  
  // Color contrast ratios (WCAG AA)
  contrastRatio: {
    normal: 4.5,
    large: 3.0,
    enhanced: 7.0 // WCAG AAA
  },
  
  // High contrast colors for accessibility
  highContrast: {
    primary: '#4F46E5',
    primaryDark: '#3730A3',
    text: '#FFFFFF',
    textSecondary: '#E5E7EB',
    background: '#000000',
    backgroundSecondary: '#1F2937',
    border: '#FFFFFF',
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B'
  },
  
  // Screen reader labels
  labels: {
    backButton: 'Go back',
    closeButton: 'Close',
    submitButton: 'Submit',
    cancelButton: 'Cancel',
    loading: 'Loading',
    error: 'Error',
    success: 'Success'
  }
};

// ============================================================================
// 📱 RESPONSIVE BREAKPOINTS
// ============================================================================

export const BREAKPOINTS = {
  // Screen width breakpoints
  xs: 320,   // Small phones
  sm: 375,   // Large phones
  md: 414,   // Extra large phones
  lg: 768,   // Tablets
  xl: 1024,  // Large tablets
  '2xl': 1280, // Small desktops
  
  // Height breakpoints
  height: {
    xs: 568,  // iPhone SE
    sm: 667,  // iPhone 8
    md: 812,  // iPhone X
    lg: 896,  // iPhone 11
    xl: 1024, // iPad
  }
};

// ============================================================================
// 🎨 THEME SYSTEM
// ============================================================================

export const THEMES = {
  light: {
    background: '#FFFFFF',
    surface: '#F9FAFB',
    text: '#111827',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
    primary: '#4F46E5',
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B'
  },
  
  dark: {
    background: '#0A0A0A',
    surface: '#1C1C1E',
    text: '#FFFFFF',
    textSecondary: '#8E8E93',
    border: '#374151',
    primary: '#8B5CF6',
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B'
  }
};

// ============================================================================
// 📦 EXPORTS
// ============================================================================

export default {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  COMPONENT_STYLES,
  ANIMATIONS,
  ACCESSIBILITY,
  BREAKPOINTS,
  THEMES
};
