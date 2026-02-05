/**
 * Animation utilities for GameScreen
 * Extracts animation logic from the main component
 */

import { Animated, Easing } from 'react-native';

/**
 * Animation configuration constants
 */
export const ANIMATION_CONFIG = {
  SHAKE_DURATION: 500,
  PULSE_DURATION: 1000,
  FLASH_DURATION: 300,
  BOUNCE_TENSION: 120,
  BOUNCE_FRICTION: 14,
  SCALE_UP: 1.1,
  SCALE_DOWN: 0.9,
} as const;

/**
 * Shake animation for incorrect answers
 */
export function shakeAnimation(animatedValue: Animated.Value): void {
  const shakeSequence = Animated.sequence([
    Animated.timing(animatedValue, {
      toValue: 10,
      duration: 50,
      useNativeDriver: true,
    }),
    Animated.timing(animatedValue, {
      toValue: -10,
      duration: 50,
      useNativeDriver: true,
    }),
    Animated.timing(animatedValue, {
      toValue: 10,
      duration: 50,
      useNativeDriver: true,
    }),
    Animated.timing(animatedValue, {
      toValue: -10,
      duration: 50,
      useNativeDriver: true,
    }),
    Animated.timing(animatedValue, {
      toValue: 0,
      duration: 50,
      useNativeDriver: true,
    }),
  ]);
  shakeSequence.start();
}

/**
 * Pulse animation for correct answers
 */
export function pulseAnimation(animatedValue: Animated.Value): void {
  Animated.sequence([
    Animated.timing(animatedValue, {
      toValue: ANIMATION_CONFIG.SCALE_UP,
      duration: 150,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }),
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 150,
      easing: Easing.in(Easing.ease),
      useNativeDriver: true,
    }),
  ]).start();
}

/**
 * Bounce animation for button press
 */
export function bounceAnimation(animatedValue: Animated.Value): void {
  Animated.sequence([
    Animated.timing(animatedValue, {
      toValue: ANIMATION_CONFIG.SCALE_DOWN,
      duration: 100,
      useNativeDriver: true,
    }),
    Animated.spring(animatedValue, {
      toValue: 1,
      tension: ANIMATION_CONFIG.BOUNCE_TENSION,
      friction: ANIMATION_CONFIG.BOUNCE_FRICTION,
      useNativeDriver: true,
    }),
  ]).start();
}

/**
 * Glow animation for input focus
 */
export function glowAnimation(animatedValue: Animated.Value, toValue: number): void {
  Animated.timing(animatedValue, {
    toValue,
    duration: 200,
    useNativeDriver: true,
  }).start();
}

/**
 * Flash animation for timer warning
 */
export function flashAnimation(animatedValue: Animated.Value): Animated.CompositeAnimation {
  return Animated.loop(
    Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: ANIMATION_CONFIG.FLASH_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: ANIMATION_CONFIG.FLASH_DURATION,
        useNativeDriver: true,
      }),
    ])
  );
}

/**
 * Fade in animation
 */
export function fadeInAnimation(
  animatedValue: Animated.Value,
  duration: number = 300
): Animated.CompositeAnimation {
  return Animated.timing(animatedValue, {
    toValue: 1,
    duration,
    easing: Easing.out(Easing.ease),
    useNativeDriver: true,
  });
}

/**
 * Fade out animation
 */
export function fadeOutAnimation(
  animatedValue: Animated.Value,
  duration: number = 300
): Animated.CompositeAnimation {
  return Animated.timing(animatedValue, {
    toValue: 0,
    duration,
    easing: Easing.in(Easing.ease),
    useNativeDriver: true,
  });
}

/**
 * Slide in animation
 */
export function slideInAnimation(
  animatedValue: Animated.Value,
  fromValue: number,
  duration: number = 300
): void {
  animatedValue.setValue(fromValue);
  Animated.timing(animatedValue, {
    toValue: 0,
    duration,
    easing: Easing.out(Easing.cubic),
    useNativeDriver: true,
  }).start();
}

/**
 * Scale animation with spring physics
 */
export function springScaleAnimation(
  animatedValue: Animated.Value,
  toValue: number
): void {
  Animated.spring(animatedValue, {
    toValue,
    tension: ANIMATION_CONFIG.BOUNCE_TENSION,
    friction: ANIMATION_CONFIG.BOUNCE_FRICTION,
    useNativeDriver: true,
  }).start();
}

/**
 * Create staggered entrance animations for a list of items
 */
export function staggeredEntranceAnimation(
  animatedValues: Animated.Value[],
  staggerDelay: number = 50
): Animated.CompositeAnimation {
  const animations = animatedValues.map((animatedValue, index) =>
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 300,
      delay: index * staggerDelay,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    })
  );
  return Animated.parallel(animations);
}

/**
 * Timer pulse animation (for low time warning)
 */
export function timerPulseAnimation(animatedValue: Animated.Value): Animated.CompositeAnimation {
  return Animated.loop(
    Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: 1.2,
        duration: 500,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 500,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ])
  );
}

/**
 * Success celebration animation
 */
export function celebrationAnimation(
  scaleValue: Animated.Value,
  rotateValue: Animated.Value
): void {
  Animated.parallel([
    Animated.sequence([
      Animated.timing(scaleValue, {
        toValue: 1.3,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleValue, {
        toValue: 1,
        tension: 50,
        friction: 5,
        useNativeDriver: true,
      }),
    ]),
    Animated.sequence([
      Animated.timing(rotateValue, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(rotateValue, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]),
  ]).start();
}

export default {
  ANIMATION_CONFIG,
  shakeAnimation,
  pulseAnimation,
  bounceAnimation,
  glowAnimation,
  flashAnimation,
  fadeInAnimation,
  fadeOutAnimation,
  slideInAnimation,
  springScaleAnimation,
  staggeredEntranceAnimation,
  timerPulseAnimation,
  celebrationAnimation,
};
