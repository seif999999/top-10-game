/**
 * 📱 RESPONSIVE UTILITIES
 * 
 * Provides responsive design utilities for different screen sizes
 * and orientations without hardcoded dimensions.
 */

import { Dimensions, PixelRatio } from 'react-native';
import { BREAKPOINTS } from '../design-system';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// ============================================================================
// 📏 RESPONSIVE DIMENSIONS
// ============================================================================

export const RESPONSIVE = {
  // Screen dimensions
  screenWidth,
  screenHeight,
  
  // Responsive width calculations
  width: {
    // Percentage-based widths
    full: '100%',
    half: '50%',
    third: '33.333%',
    quarter: '25%',
    
    // Breakpoint-based widths
    xs: screenWidth < BREAKPOINTS.sm ? '100%' : '90%',
    sm: screenWidth < BREAKPOINTS.md ? '90%' : '80%',
    md: screenWidth < BREAKPOINTS.lg ? '80%' : '70%',
    lg: screenWidth < BREAKPOINTS.xl ? '70%' : '60%',
    xl: '60%',
    
    // Fixed max widths with responsive behavior
    maxXs: Math.min(screenWidth * 0.9, 320),
    maxSm: Math.min(screenWidth * 0.8, 400),
    maxMd: Math.min(screenWidth * 0.7, 500),
    maxLg: Math.min(screenWidth * 0.6, 600),
    maxXl: Math.min(screenWidth * 0.5, 700),
  },
  
  // Responsive height calculations
  height: {
    // Percentage-based heights
    full: '100%',
    half: '50%',
    third: '33.333%',
    quarter: '25%',
    
    // Screen-based heights
    screen: screenHeight,
    safeArea: screenHeight - 100, // Account for status bar and navigation
    
    // Content heights
    content: screenHeight * 0.8,
    card: screenHeight * 0.6,
    modal: screenHeight * 0.7,
    header: 60,
    footer: 80,
    
    // Dynamic heights based on content
    auto: 'auto',
    minContent: 'min-content',
    maxContent: 'max-content',
  },
  
  // Responsive padding and margins
  spacing: {
    // Screen-based spacing
    screen: {
      horizontal: screenWidth < BREAKPOINTS.sm ? 16 : 24,
      vertical: screenHeight < BREAKPOINTS.height.sm ? 16 : 24,
    },
    
    // Content spacing
    content: {
      horizontal: screenWidth < BREAKPOINTS.sm ? 12 : 16,
      vertical: screenHeight < BREAKPOINTS.height.sm ? 12 : 16,
    },
    
    // Card spacing
    card: {
      horizontal: screenWidth < BREAKPOINTS.sm ? 8 : 12,
      vertical: screenHeight < BREAKPOINTS.height.sm ? 8 : 12,
    }
  },
  
  // Responsive font sizes
  fontSize: {
    // Scale based on screen size with iPhone-specific adjustments
    scale: (baseSize: number) => {
      let scale = Math.min(screenWidth / 375, screenHeight / 667); // iPhone 8 as base
      
      // iPhone-specific adjustments
      if (screenWidth < 375) { // iPhone SE
        scale *= 0.9;
      } else if (screenWidth < 390) { // iPhone mini
        scale *= 0.95;
      } else if (screenWidth > 414) { // iPhone Pro Max
        scale *= 1.05;
      }
      
      return Math.max(baseSize * scale, baseSize * 0.8); // Minimum 80% of base size
    },
    
    // Responsive text sizes
    responsive: {
      xs: screenWidth < BREAKPOINTS.sm ? 10 : 12,
      sm: screenWidth < BREAKPOINTS.sm ? 12 : 14,
      base: screenWidth < BREAKPOINTS.sm ? 14 : 16,
      lg: screenWidth < BREAKPOINTS.sm ? 16 : 18,
      xl: screenWidth < BREAKPOINTS.sm ? 18 : 20,
      '2xl': screenWidth < BREAKPOINTS.sm ? 20 : 24,
      '3xl': screenWidth < BREAKPOINTS.sm ? 24 : 30,
      '4xl': screenWidth < BREAKPOINTS.sm ? 30 : 36,
    }
  },
  
  // Responsive grid layouts
  grid: {
    // Columns based on screen size
    columns: {
      xs: 1,
      sm: screenWidth < BREAKPOINTS.md ? 1 : 2,
      md: screenWidth < BREAKPOINTS.lg ? 2 : 3,
      lg: screenWidth < BREAKPOINTS.xl ? 3 : 4,
      xl: 4,
    },
    
    // Gap between grid items
    gap: {
      xs: 8,
      sm: screenWidth < BREAKPOINTS.md ? 8 : 12,
      md: screenWidth < BREAKPOINTS.lg ? 12 : 16,
      lg: 16,
    }
  },
  
  // Responsive breakpoint checks
  isSmallScreen: screenWidth < BREAKPOINTS.sm,
  isMediumScreen: screenWidth >= BREAKPOINTS.sm && screenWidth < BREAKPOINTS.lg,
  isLargeScreen: screenWidth >= BREAKPOINTS.lg,
  isTablet: screenWidth >= BREAKPOINTS.lg,
  isPhone: screenWidth < BREAKPOINTS.lg,
  
  // Orientation checks
  isPortrait: screenHeight > screenWidth,
  isLandscape: screenWidth > screenHeight,
  
  // Aspect ratio
  aspectRatio: screenWidth / screenHeight,
  
  // Safe area calculations
  safeArea: {
    top: 44, // Status bar height
    bottom: 34, // Home indicator height
    left: 0,
    right: 0,
  },
  
  // iPhone-specific fixes
  iphone: {
    // Minimum touch target size for iPhone
    minTouchTarget: 44,
    
    // iPhone SE specific adjustments
    se: {
      fontSize: 0.9, // Slightly smaller text
      padding: 0.8,  // Reduced padding
      margin: 0.8,   // Reduced margins
    },
    
    // iPhone mini specific adjustments
    mini: {
      fontSize: 0.95,
      padding: 0.9,
      margin: 0.9,
    },
    
    // iPhone Pro Max specific adjustments
    proMax: {
      fontSize: 1.1,
      padding: 1.1,
      margin: 1.1,
    }
  }
};

// ============================================================================
// 🎨 RESPONSIVE STYLE HELPERS
// ============================================================================

type ResponsiveStyles = Record<string, unknown> & {
  smallScreen?: Record<string, unknown>;
  mediumScreen?: Record<string, unknown>;
  largeScreen?: Record<string, unknown>;
};

export const createResponsiveStyle = (styles: ResponsiveStyles) => {
  return {
    ...styles,
    // Add responsive adjustments
    ...(RESPONSIVE.isSmallScreen && styles.smallScreen),
    ...(RESPONSIVE.isMediumScreen && styles.mediumScreen),
    ...(RESPONSIVE.isLargeScreen && styles.largeScreen),
  };
};

// ============================================================================
// 📐 LAYOUT HELPERS
// ============================================================================

export const LAYOUT = {
  // Flex layouts
  flex: {
    center: {
      flex: 1,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    row: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
    },
    column: {
      flexDirection: 'column' as const,
    },
    spaceBetween: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
    },
    spaceAround: {
      flexDirection: 'row' as const,
      justifyContent: 'space-around' as const,
      alignItems: 'center' as const,
    },
  },
  
  // Container styles
  container: {
    flex: 1,
    paddingHorizontal: RESPONSIVE.spacing.screen.horizontal,
    paddingVertical: RESPONSIVE.spacing.screen.vertical,
  },
  
  content: {
    flex: 1,
    paddingHorizontal: RESPONSIVE.spacing.content.horizontal,
  },
  
  card: {
    paddingHorizontal: RESPONSIVE.spacing.card.horizontal,
    paddingVertical: RESPONSIVE.spacing.card.vertical,
    borderRadius: 12,
  },
  
  // Responsive text
  text: {
    xs: { fontSize: RESPONSIVE.fontSize.responsive.xs },
    sm: { fontSize: RESPONSIVE.fontSize.responsive.sm },
    base: { fontSize: RESPONSIVE.fontSize.responsive.base },
    lg: { fontSize: RESPONSIVE.fontSize.responsive.lg },
    xl: { fontSize: RESPONSIVE.fontSize.responsive.xl },
    '2xl': { fontSize: RESPONSIVE.fontSize.responsive['2xl'] },
    '3xl': { fontSize: RESPONSIVE.fontSize.responsive['3xl'] },
    '4xl': { fontSize: RESPONSIVE.fontSize.responsive['4xl'] },
  }
};

// ============================================================================
// 🎯 COMPONENT-SPECIFIC RESPONSIVE HELPERS
// ============================================================================

export const COMPONENT_RESPONSIVE = {
  // Button sizes
  button: {
    small: {
      paddingHorizontal: RESPONSIVE.isSmallScreen ? 12 : 16,
      paddingVertical: RESPONSIVE.isSmallScreen ? 8 : 12,
      minHeight: 44, // iPhone accessibility minimum
      minWidth: 44,  // iPhone accessibility minimum
    },
    medium: {
      paddingHorizontal: RESPONSIVE.isSmallScreen ? 16 : 20,
      paddingVertical: RESPONSIVE.isSmallScreen ? 12 : 16,
      minHeight: 48,
      minWidth: 44,
    },
    large: {
      paddingHorizontal: RESPONSIVE.isSmallScreen ? 20 : 24,
      paddingVertical: RESPONSIVE.isSmallScreen ? 16 : 20,
      minHeight: 52,
      minWidth: 44,
    }
  },
  
  // Card sizes
  card: {
    small: {
      padding: RESPONSIVE.isSmallScreen ? 8 : 12,
      borderRadius: 8,
    },
    medium: {
      padding: RESPONSIVE.isSmallScreen ? 12 : 16,
      borderRadius: 12,
    },
    large: {
      padding: RESPONSIVE.isSmallScreen ? 16 : 20,
      borderRadius: 16,
    }
  },
  
  // Input sizes
  input: {
    small: {
      paddingHorizontal: RESPONSIVE.isSmallScreen ? 12 : 16,
      paddingVertical: RESPONSIVE.isSmallScreen ? 8 : 12,
      minHeight: 40,
    },
    medium: {
      paddingHorizontal: RESPONSIVE.isSmallScreen ? 16 : 20,
      paddingVertical: RESPONSIVE.isSmallScreen ? 12 : 16,
      minHeight: 44,
    },
    large: {
      paddingHorizontal: RESPONSIVE.isSmallScreen ? 20 : 24,
      paddingVertical: RESPONSIVE.isSmallScreen ? 16 : 20,
      minHeight: 48,
    }
  }
};

export default RESPONSIVE;
