import React, { useEffect, useRef } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Animated, Easing } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../design-system';

interface LoadingPageProps {
  /** Message displayed below the spinner */
  message?: string;
}

/**
 * LoadingPage — full-screen blocking loading overlay.
 *
 * - Centered spinner with a short message.
 * - Blocks all user interaction (pointerEvents="none" on content behind).
 * - Accessible: announces itself as busy to screen readers.
 * - Subtle fade-in animation so it doesn't flash on fast loads.
 */
const LoadingPage: React.FC<LoadingPageProps> = ({ message = 'Loading… Please wait.' }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
      easing: Easing.out(Easing.ease),
    }).start();

    // Gentle pulse on the icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ]),
    ).start();
  }, [fadeAnim, pulseAnim]);

  return (
    <Animated.View
      style={[styles.overlay, { opacity: fadeAnim }]}
      accessibilityRole="alert"
      accessibilityLabel={message}
      accessibilityLiveRegion="assertive"
      // @ts-ignore — React Native supports aria-busy on Views
      aria-busy={true}
      // Block interaction with anything behind the overlay
      pointerEvents="auto"
    >
      <View style={styles.card}>
        <Animated.Text style={[styles.icon, { transform: [{ scale: pulseAnim }] }]}>
          🎮
        </Animated.Text>

        <ActivityIndicator size="large" color={COLORS.primary} style={styles.spinner} />

        <Text style={styles.message}>{message}</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    alignItems: 'center',
    paddingHorizontal: SPACING['2xl'],
    paddingVertical: SPACING['3xl'],
    gap: SPACING.lg,
  },
  icon: {
    fontSize: 48,
    marginBottom: SPACING.sm,
  },
  spinner: {
    marginVertical: SPACING.md,
  },
  message: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.fontSize.base * TYPOGRAPHY.lineHeight.relaxed,
  },
});

export default LoadingPage;
