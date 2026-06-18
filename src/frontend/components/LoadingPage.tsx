import React, { useEffect, useMemo, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, TYPOGRAPHY } from '../design-system';
import useAppTranslation from '../../hooks/useTranslation';

interface LoadingPageProps {
  /** Used for screen readers only (e.g. "Signing you in…"). Visible text is always "Loading". */
  message?: string;
}

const CHAR_LIFT = 44; // ~2.75rem at default density
const STAGGER_MS = 50;
const UP_MS = 600;
const DOWN_MS = 800;
const LOOP_GAP_MS = 1000;

/** Per-character loop inspired by staggered letter loading (native Animated; iOS/Android). */
const AnimatedLoadingChar: React.FC<{
  char: string;
  index: number;
}> = ({ char, index }) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(index * STAGGER_MS),
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -CHAR_LIFT,
            duration: UP_MS,
            useNativeDriver: true,
            easing: Easing.out(Easing.cubic),
          }),
          Animated.timing(rotate, {
            toValue: 1,
            duration: UP_MS,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.circle),
          }),
        ]),
        Animated.timing(translateY, {
          toValue: 0,
          duration: DOWN_MS,
          useNativeDriver: true,
          easing: Easing.out(Easing.bounce),
        }),
        Animated.delay(LOOP_GAP_MS),
        Animated.parallel([
          Animated.timing(translateY, { toValue: 0, duration: 0, useNativeDriver: true }),
          Animated.timing(rotate, { toValue: 0, duration: 0, useNativeDriver: true }),
        ]),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [index, translateY, rotate]);

  const rotateStr = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['-360deg', '0deg'],
  });

  const displayChar = char === ' ' ? '\u00A0' : char;

  return (
    <Animated.Text
      style={[
        styles.char,
        {
          transform: [{ translateY }, { rotate: rotateStr }],
        },
      ]}
      accessibilityElementsHidden
      importantForAccessibility="no"
    >
      {displayChar}
    </Animated.Text>
  );
};

/**
 * LoadingPage — full-screen blocking loading overlay.
 *
 * - Always shows animated purple “Loading” (localized via common.loading).
 * - Contextual `message` is only for accessibility.
 */
const LoadingPage: React.FC<LoadingPageProps> = ({ message }) => {
  const { t } = useAppTranslation();
  const accessibilityLabel = message ?? t('loadingMessage');
  const loadingWord = t('loading');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const chars = useMemo(() => Array.from(loadingWord), [loadingWord]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
      easing: Easing.out(Easing.ease),
    }).start();
  }, [fadeAnim]);

  return (
    <Animated.View
      style={[styles.overlay, { opacity: fadeAnim }]}
      accessibilityRole="alert"
      accessibilityLabel={accessibilityLabel}
      accessibilityLiveRegion="assertive"
      // @ts-expect-error RN web supports aria-busy on Views
      aria-busy={true}
      pointerEvents="auto"
    >
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f0f1e']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.card}>
        <View style={styles.charRow}>
          {chars.map((char, i) => (
            <AnimatedLoadingChar key={`${i}-${char}`} char={char} index={i} />
          ))}
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    alignItems: 'center',
    paddingHorizontal: SPACING['2xl'],
    paddingVertical: SPACING['3xl'],
    maxWidth: '92%',
  },
  charRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  char: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.fontSize['2xl'] ?? 24,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    letterSpacing: 1,
    lineHeight: (TYPOGRAPHY.fontSize['2xl'] ?? 24) * 1.2,
  },
});

export default LoadingPage;
