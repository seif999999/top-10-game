import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { COLORS, SPACING, TYPOGRAPHY, COMPONENT_STYLES } from '../design-system';
import { logger } from '../../backend/utils/logger';
import useAppTranslation from '../../hooks/useTranslation';
import type { ErrorType } from '../contexts/GlobalUIContext';

// ============================================================================
// Error config — maps error type → icon (text is now translated)
// ============================================================================

const ERROR_ICONS: Record<ErrorType, string> = {
  network: '📡',
  '401': '🔒',
  '403': '🚫',
  '404': '🔍',
  '5xx': '🛠️',
  unknown: '⚠️',
};

// ============================================================================
// Props
// ============================================================================

interface ErrorPageProps {
  /** The category of error to display */
  errorType?: ErrorType;
  /** Callback when the user taps "Retry" */
  onRetry?: () => void;
  /** Callback when the user taps "Go Home" (defaults to navigation reset) */
  onGoHome?: () => void;
  /** Raw error for logging only — never shown to users */
  rawError?: unknown;
}

// ============================================================================
// Component
// ============================================================================

/**
 * ErrorPage — full-screen, user-friendly error state.
 *
 * - Displays a translated message based on the error category.
 * - Never shows technical details to users.
 * - Logs the real error via the app logger.
 * - Provides "Retry" (primary) and "Go Home" (secondary) actions.
 * - Accessible: announces itself as an alert to screen readers.
 */
const ErrorPage: React.FC<ErrorPageProps> = ({
  errorType = 'unknown',
  onRetry,
  onGoHome,
  rawError,
}) => {
  const navigation = useNavigation();
  const { t } = useAppTranslation('errors');
  const { t: tCommon } = useAppTranslation('common');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const icon = ERROR_ICONS[errorType] ?? ERROR_ICONS.unknown;
  const tDynamic = t as (key: string, options?: { defaultValue?: string }) => string;
  const title = tDynamic(`page.${errorType}.title`, { defaultValue: t('page.unknown.title') });
  const message = tDynamic(`page.${errorType}.message`, { defaultValue: t('page.unknown.message') });

  // Log the real error on mount (never shown to user)
  useEffect(() => {
    if (rawError) {
      logger.error(`[ErrorPage] type=${errorType}`, rawError);
    }
  }, [rawError, errorType]);

  useEffect(() => {
    // Fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
      easing: Easing.out(Easing.ease),
    }).start();

    // Small shake on the icon
    Animated.sequence([
      Animated.delay(300),
      Animated.timing(shakeAnim, { toValue: 10, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, shakeAnim]);

  const handleGoHome = () => {
    if (onGoHome) {
      onGoHome();
      return;
    }
    // Default: reset the navigation stack to Home
    try {
      navigation.dispatch(
        CommonActions.reset({ index: 0, routes: [{ name: 'Home' }] }),
      );
    } catch {
      // If navigation fails (e.g. not logged in), try Login
      try {
        navigation.dispatch(
          CommonActions.reset({ index: 0, routes: [{ name: 'Login' }] }),
        );
      } catch {
        // Silently ignore — we're already on an error page
      }
    }
  };

  const retryLabel = tCommon('retry');
  const goHomeLabel = tCommon('goHome');

  return (
    <Animated.View
      style={[styles.container, { opacity: fadeAnim }]}
      accessibilityRole="alert"
      accessibilityLabel={`${title}. ${message}`}
      accessibilityLiveRegion="assertive"
    >
      {/* Icon */}
      <Animated.Text
        style={[styles.icon, { transform: [{ translateX: shakeAnim }] }]}
      >
        {icon}
      </Animated.Text>

      {/* Title */}
      <Text style={styles.title}>{title}</Text>

      {/* Message */}
      <Text style={styles.message}>{message}</Text>

      {/* Action Buttons */}
      <View style={styles.actions}>
        {onRetry && (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={onRetry}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={retryLabel}
            accessibilityHint={retryLabel}
          >
            <Text style={styles.primaryButtonText}>🔄  {retryLabel}</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.secondaryButton, !onRetry && styles.secondaryButtonAlone]}
          onPress={handleGoHome}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={goHomeLabel}
          accessibilityHint={goHomeLabel}
        >
          <Text style={styles.secondaryButtonText}>🏠  {goHomeLabel}</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9998,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING['2xl'],
  },
  icon: {
    fontSize: 64,
    marginBottom: SPACING.xl,
  },
  title: {
    color: COLORS.text,
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  message: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.regular,
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.fontSize.base * TYPOGRAPHY.lineHeight.relaxed,
    marginBottom: SPACING['3xl'],
    maxWidth: 320,
  },
  actions: {
    width: '100%',
    maxWidth: 300,
    gap: SPACING.md,
  },
  primaryButton: {
    ...COMPONENT_STYLES.button.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  secondaryButton: {
    ...COMPONENT_STYLES.button.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonAlone: {
    // When there's no retry button, make Go Home the primary style
    ...COMPONENT_STYLES.button.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: COLORS.text,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
});

export default ErrorPage;
