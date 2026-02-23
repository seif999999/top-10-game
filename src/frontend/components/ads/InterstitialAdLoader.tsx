import React, { useEffect, useRef } from 'react';
import { useAd } from '../../contexts/AdContext';
import { logger } from '../../../backend/utils/logger';

const DEFAULT_MINIMUM_INTERVAL_MS = 90 * 1000; // 90 seconds (minimum between interstitials)

export interface InterstitialAdLoaderProps {
  /** When true, attempt to show an interstitial ad (if conditions are met). */
  trigger: boolean;
  /** Optional callback after the ad is closed. */
  onAdClosed?: () => void;
  /** Minimum ms between interstitials (default 300000 = 5 min). */
  minimumInterval?: number;
  /** When true, never show (e.g. during active gameplay). */
  gameplayActive?: boolean;
}

/**
 * Utility component that preloads interstitial ads and shows them when trigger
 * is true. Renders nothing. Respects premium, frequency cap, and gameplay.
 */
const InterstitialAdLoader: React.FC<InterstitialAdLoaderProps> = ({
  trigger,
  onAdClosed,
  minimumInterval = DEFAULT_MINIMUM_INTERVAL_MS,
  gameplayActive = false,
}) => {
  const {
    isPremium,
    isAdReady,
    interstitialLoadState,
    lastInterstitialShownAt,
    loadInterstitialAd,
    showInterstitialAd,
  } = useAd();

  const triggerAttemptedRef = useRef(false);
  const prevTriggerRef = useRef(false);

  // Preload on mount and when ad is dismissed (context preloads next; we also load if not yet loaded)
  useEffect(() => {
    if (isPremium || !isAdReady) return;
    if (interstitialLoadState !== 'idle' && interstitialLoadState !== 'failed') return;
    loadInterstitialAd().catch(() => {
      // Silently ignore; don't block user flow
      logger.warn('InterstitialAdLoader: preload failed (silent)');
    });
  }, [isPremium, isAdReady, interstitialLoadState, loadInterstitialAd]);

  // When trigger becomes true: attempt to show once per trigger, respecting cap and gameplay
  useEffect(() => {
    if (!trigger) {
      prevTriggerRef.current = false;
      triggerAttemptedRef.current = false;
      return;
    }

    if (prevTriggerRef.current === false) {
      prevTriggerRef.current = true;
      triggerAttemptedRef.current = false;
    }

    if (triggerAttemptedRef.current) return;
    if (isPremium || gameplayActive || !isAdReady) {
      if (trigger && (isPremium || gameplayActive)) {
        logger.log('InterstitialAdLoader: skip (premium or gameplay active)');
      }
      return;
    }

    const now = Date.now();
    if (
      lastInterstitialShownAt != null &&
      now - lastInterstitialShownAt < minimumInterval
    ) {
      logger.log('InterstitialAdLoader: skip (frequency cap)');
      return;
    }

    if (interstitialLoadState !== 'loaded') {
      return;
    }

    triggerAttemptedRef.current = true;
    logger.log('InterstitialAdLoader: showing interstitial');
    showInterstitialAd({ onAdClosed }).catch(() => {
      triggerAttemptedRef.current = false;
      logger.warn('InterstitialAdLoader: show failed (silent)');
    });
  }, [
    trigger,
    isPremium,
    gameplayActive,
    isAdReady,
    lastInterstitialShownAt,
    minimumInterval,
    interstitialLoadState,
    showInterstitialAd,
    onAdClosed,
  ]);

  return null;
};

export default InterstitialAdLoader;
