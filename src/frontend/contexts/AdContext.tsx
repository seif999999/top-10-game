import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { AdLoadState } from '../../shared/types/ads';
import type { AdReward } from '../../shared/types/ads';
import AdService from '../../backend/services/AdService';
import AdConsentService from '../../backend/services/AdConsentService';
import { CoinService } from '../../backend/services/CoinService';
import { logger } from '../../backend/utils/logger';
import * as ProgressiveAd from '../../backend/utils/coinAdCooldown';
import { useAuth } from './AuthContext';
import UserProfileService from '../../backend/services/userProfileService';

const INTERSTITIAL_FREQUENCY_CAP_MS = 90 * 1000; // 90 seconds (minimum between interstitials)

export interface ProgressiveAdInfo {
  adsWatchedThisHour: number;
  nextAdCoins: number;
  maxReached: boolean;
  timeUntilResetMs: number;
}

export interface AdContextValue {
  // Premium
  isPremium: boolean;
  setPremium: (premium: boolean) => void;

  // Load states
  rewardedLoadState: AdLoadState;
  interstitialLoadState: AdLoadState;

  // Session counts
  rewardedShownThisSession: number;
  interstitialShownThisSession: number;

  // Session flags
  hasShownGameEnterInterstitial: boolean; // Once per session flag

  // Frequency (last shown timestamps)
  lastRewardedShownAt: number | null;
  lastInterstitialShownAt: number | null;

  // Error
  adError: string | null;
  clearAdError: () => void;

  // Actions
  loadRewardedAd: () => Promise<void>;
  loadInterstitialAd: () => Promise<void>;
  showRewardedAd: (onRewardEarned?: (reward: AdReward) => void) => Promise<void>;
  showInterstitialAd: (callbacks?: { onAdClosed?: () => void; markAsGameEnter?: boolean }) => Promise<void>;

  // Progressive rewarded ad: 20→30→50 coins per cycle (100 total), no hourly cap
  showProgressiveRewardedAd: (onSuccess: (coinsEarned: number) => void) => Promise<void>;
  getProgressiveAdInfo: () => Promise<ProgressiveAdInfo>;
  getTimeUntilReset: () => number;

  // Initialization
  isAdReady: boolean;
}

const AdContext = createContext<AdContextValue | undefined>(undefined);

export const AdProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [isPremium, setIsPremiumState] = useState(false);
  const [rewardedLoadState, setRewardedLoadState] = useState<AdLoadState>('idle');
  const [interstitialLoadState, setInterstitialLoadState] = useState<AdLoadState>('idle');
  const [rewardedShownThisSession, setRewardedShownThisSession] = useState(0);
  const [interstitialShownThisSession, setInterstitialShownThisSession] = useState(0);
  const [hasShownGameEnterInterstitial, setHasShownGameEnterInterstitial] = useState(false);
  const [lastRewardedShownAt, setLastRewardedShownAt] = useState<number | null>(null);
  const [lastInterstitialShownAt, setLastInterstitialShownAt] = useState<number | null>(null);
  const [adError, setAdError] = useState<string | null>(null);
  const [isAdReady, setIsAdReady] = useState(false);

  const syncLoadStates = useCallback(() => {
    try {
      setRewardedLoadState(AdService.getRewardedLoadState());
      setInterstitialLoadState(AdService.getInterstitialLoadState());
    } catch (e) {
      logger.warn('AdContext: syncLoadStates failed', e);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const sync = async () => {
      if (!user?.id) {
        setIsPremiumState(false);
        return;
      }
      if (user.adFree) {
        setIsPremiumState(true);
        return;
      }
      try {
        const active = await UserProfileService.checkPremiumExpiration(user.id);
        if (!cancelled) setIsPremiumState(active);
      } catch (e) {
        if (!cancelled) setIsPremiumState(false);
      }
    };
    sync();
    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.adFree]);

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        await AdConsentService.initialize();
        if (cancelled) return;
        await AdService.initialize();
        if (cancelled) return;
        AdService.setFrequencyCapMs(60 * 1000);
        syncLoadStates();
        setIsAdReady(true);
        logger.log('AdContext: AdService and AdConsentService initialized');
      } catch (e) {
        if (!cancelled) {
          logger.error('AdContext: init failed', e);
          setAdError('Ads could not be initialized');
        }
      }
    };
    init();
    return () => {
      cancelled = true;
    };
  }, [syncLoadStates]);

  const setPremium = useCallback((premium: boolean) => {
    setIsPremiumState(premium);
    logger.log('AdContext: premium set', premium);
  }, []);

  const clearAdError = useCallback(() => setAdError(null), []);

  const loadRewardedAd = useCallback(async () => {
    if (isPremium) return;
    try {
      await AdService.loadRewardedAd();
      syncLoadStates();
    } catch (e) {
      logger.error('AdContext: loadRewardedAd failed', e);
      setAdError(e instanceof Error ? e.message : 'Failed to load ad');
    }
  }, [isPremium, syncLoadStates]);

  const loadInterstitialAd = useCallback(async () => {
    if (isPremium) return;
    try {
      await AdService.loadInterstitialAd();
      syncLoadStates();
    } catch (e) {
      logger.error('AdContext: loadInterstitialAd failed', e);
      setAdError(e instanceof Error ? e.message : 'Failed to load ad');
    }
  }, [isPremium, syncLoadStates]);

  const showRewardedAd = useCallback(
    async (onRewardEarned?: (reward: AdReward) => void) => {
      if (isPremium) {
        logger.log('AdContext: skipped rewarded ad (premium)');
        return;
      }
      setAdError(null);
      await AdService.showRewardedAd({
        onAdShown: () => {
          setRewardedShownThisSession((c) => c + 1);
          setLastRewardedShownAt(Date.now());
          setRewardedLoadState('showing');
        },
        onAdDismissed: () => syncLoadStates(),
        onRewardEarned: (reward) => {
          onRewardEarned?.(reward);
        },
        onAdFailedToShow: (err) => {
          setAdError(err.message);
          syncLoadStates();
        },
      });
    },
    [isPremium, syncLoadStates]
  );

  const showInterstitialAd = useCallback(
    async (callbacks?: { onAdClosed?: () => void; markAsGameEnter?: boolean }) => {
      if (isPremium) {
        logger.log('AdContext: skipped interstitial ad (premium)');
        callbacks?.onAdClosed?.();
        return;
      }
      const now = Date.now();
      if (lastInterstitialShownAt != null && now - lastInterstitialShownAt < INTERSTITIAL_FREQUENCY_CAP_MS) {
        logger.log(`AdContext: interstitial frequency cap (${INTERSTITIAL_FREQUENCY_CAP_MS / 1000}s)`);
        callbacks?.onAdClosed?.();
        return;
      }
      setAdError(null);
      await AdService.showInterstitialAd({
        onAdShown: () => {
          setInterstitialShownThisSession((c) => c + 1);
          setLastInterstitialShownAt(Date.now());
          setInterstitialLoadState('showing');
          if (callbacks?.markAsGameEnter) {
            setHasShownGameEnterInterstitial(true);
          }
        },
        onAdDismissed: () => {
          syncLoadStates();
          callbacks?.onAdClosed?.();
        },
        onAdFailedToShow: (err) => {
          setAdError(err.message);
          syncLoadStates();
          callbacks?.onAdClosed?.();
        },
      });
    },
    [isPremium, lastInterstitialShownAt, syncLoadStates]
  );

  const getProgressiveAdInfo = useCallback((): Promise<ProgressiveAdInfo> => ProgressiveAd.getProgressiveAdInfo(), []);
  const getTimeUntilReset = useCallback((): number => ProgressiveAd.getTimeUntilReset(), []);

  const showProgressiveRewardedAd = useCallback(
    async (onSuccess: (coinsEarned: number) => void) => {
      if (isPremium) {
        logger.log('AdContext: skipped progressive ad (premium)');
        return;
      }
      const userId = user?.id;
      if (!userId) {
        logger.warn('AdContext: showProgressiveRewardedAd no user');
        setAdError('Please sign in to earn coins');
        return;
      }
      const info = await ProgressiveAd.getProgressiveAdInfo();
      if (info.maxReached) {
        logger.log('AdContext: max ads reached this hour');
        setAdError('Maximum ads reached for this hour');
        return;
      }
      const coinsToEarn = ProgressiveAd.getProgressiveReward(info.adsWatchedThisHour);
      setAdError(null);
      let rewardGranted = false;

      const grantCoins = async () => {
        if (rewardGranted) return;
        rewardGranted = true;
        try {
          await CoinService.getInstance().addCoins(userId, coinsToEarn, `Rewarded ad (${coinsToEarn} coins)`);
          await ProgressiveAd.incrementProgressiveAdCount();
          logger.log('Progressive ad watched', {
            userId,
            adCount: info.adsWatchedThisHour + 1,
            coinsEarned: coinsToEarn,
            totalThisHour: coinsToEarn,
          });
          onSuccess(coinsToEarn);
        } catch (e) {
          logger.error('AdContext: addCoins failed after ad', e);
          setAdError('Coins could not be added. Please try again.');
        }
      };

      await AdService.showRewardedAd({
        onAdShown: () => {
          setRewardedShownThisSession((c) => c + 1);
          setLastRewardedShownAt(Date.now());
          setRewardedLoadState('showing');
        },
        onAdDismissed: () => {
          syncLoadStates();
          // Fallback: some SDKs don't fire onRewardEarned; grant when ad is dismissed if not already granted
          void grantCoins();
        },
        onRewardEarned: () => {
          void grantCoins();
        },
        onAdFailedToShow: (err) => {
          if (!rewardGranted) {
            setAdError(err.message);
            syncLoadStates();
          }
        },
      });
      syncLoadStates();
    },
    [isPremium, user?.id, syncLoadStates]
  );

  const value = useMemo<AdContextValue>(
    () => ({
      isPremium,
      setPremium,
      rewardedLoadState,
      interstitialLoadState,
      rewardedShownThisSession,
      interstitialShownThisSession,
      hasShownGameEnterInterstitial,
      lastRewardedShownAt,
      lastInterstitialShownAt,
      adError,
      clearAdError,
      loadRewardedAd,
      loadInterstitialAd,
      showRewardedAd,
      showInterstitialAd,
      showProgressiveRewardedAd,
      getProgressiveAdInfo,
      getTimeUntilReset,
      isAdReady,
    }),
    [
      isPremium,
      setPremium,
      rewardedLoadState,
      interstitialLoadState,
      rewardedShownThisSession,
      interstitialShownThisSession,
      hasShownGameEnterInterstitial,
      lastRewardedShownAt,
      lastInterstitialShownAt,
      adError,
      clearAdError,
      loadRewardedAd,
      loadInterstitialAd,
      showRewardedAd,
      showInterstitialAd,
      showProgressiveRewardedAd,
      getProgressiveAdInfo,
      getTimeUntilReset,
      isAdReady,
    ]
  );

  return <AdContext.Provider value={value}>{children}</AdContext.Provider>;
};

export function useAd(): AdContextValue {
  const ctx = useContext(AdContext);
  if (ctx === undefined) {
    throw new Error('useAd must be used within AdProvider');
  }
  return ctx;
}
