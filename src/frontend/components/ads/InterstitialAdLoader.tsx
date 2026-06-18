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
  /**
   * When true, call onAdClosed if the ad cannot be shown (SDK not ready, load failed, frequency cap).
   * Use for pre-game gates so the app does not wait when no creative is available.
   */
  completeIfCannotShow?: boolean;
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
  completeIfCannotShow = false,
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
    if (isPremium || gameplayActive) {
      if (trigger) {
        logger.log('InterstitialAdLoader: skip (premium or gameplay active)');
      }
      return;
    }

    if (!isAdReady) {
      if (completeIfCannotShow) {
        triggerAttemptedRef.current = true;
        logger.log('InterstitialAdLoader: completeIfCannotShow (SDK not ready)');
        onAdClosed?.();
      }
      return;
    }

    const now = Date.now();
    if (
      lastInterstitialShownAt != null &&
      now - lastInterstitialShownAt < minimumInterval
    ) {
      logger.log('InterstitialAdLoader: skip (frequency cap)');
      if (completeIfCannotShow) {
        triggerAttemptedRef.current = true;
        onAdClosed?.();
      }
      return;
    }

    if (interstitialLoadState !== 'loaded') {
      if (completeIfCannotShow && interstitialLoadState === 'failed') {
        triggerAttemptedRef.current = true;
        logger.log('InterstitialAdLoader: completeIfCannotShow (load failed)');
        onAdClosed?.();
      }
      return;
    }

    triggerAttemptedRef.current = true;
    logger.log('InterstitialAdLoader: showing interstitial');
    showInterstitialAd({ onAdClosed }).catch(() => {
      logger.warn('InterstitialAdLoader: show failed (silent)');
      if (completeIfCannotShow) {
        onAdClosed?.();
      } else {
        triggerAttemptedRef.current = false;
      }
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
    completeIfCannotShow,
  ]);

  // Creative stuck in loading/unloaded — unblock after a short wait without cutting off a successful load
  useEffect(() => {
    if (!completeIfCannotShow || !trigger || isPremium || gameplayActive) return;
    if (!isAdReady || interstitialLoadState === 'failed' || interstitialLoadState === 'loaded') return;

    const t = setTimeout(() => {
      if (triggerAttemptedRef.current) return;
      triggerAttemptedRef.current = true;
      logger.log('InterstitialAdLoader: completeIfCannotShow (load timeout)');
      onAdClosed?.();
    }, 2000);
    return () => clearTimeout(t);
  }, [
    completeIfCannotShow,
    trigger,
    isPremium,
    gameplayActive,
    isAdReady,
    interstitialLoadState,
    onAdClosed,
  ]);

  return null;
};

export default InterstitialAdLoader;
