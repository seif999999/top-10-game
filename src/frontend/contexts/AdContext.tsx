import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { AdLoadState } from '../../shared/types/ads';
import type { AdReward } from '../../shared/types/ads';
import AdService from '../../backend/services/AdService';
import AdConsentService from '../../backend/services/AdConsentService';
import { CoinService } from '../../backend/services/CoinService';
import { logger } from '../../backend/utils/logger';
import * as CoinAdCooldown from '../../backend/utils/coinAdCooldown';
import { useAuth } from './AuthContext';

const INTERSTITIAL_FREQUENCY_CAP_MS = 5 * 60 * 1000; // 5 minutes

const REWARD_REASON = 'Watched ad';

export type CoinAdPackageId = CoinAdCooldown.CoinAdPackageId;

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
  showInterstitialAd: (callbacks?: { onAdClosed?: () => void }) => Promise<void>;

  // Coin rewarded ad: amount-based API and full reward flow
  showRewardedAdForCoins: (coinAmount: number, onSuccess: () => void) => Promise<void>;
  isCoinAdAvailable: (coinAmountOrPackageId: number | CoinAdPackageId) => Promise<boolean>;
  getCoinAdCooldownRemaining: (coinAmountOrPackageId: number | CoinAdPackageId) => Promise<number>;
  recordCoinAdClaim: (packageId: CoinAdPackageId) => Promise<void>;

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
    async (callbacks?: { onAdClosed?: () => void }) => {
      if (isPremium) {
        logger.log('AdContext: skipped interstitial ad (premium)');
        return;
      }
      const now = Date.now();
      if (lastInterstitialShownAt != null && now - lastInterstitialShownAt < INTERSTITIAL_FREQUENCY_CAP_MS) {
        logger.log('AdContext: interstitial frequency cap (5 min)');
        return;
      }
      setAdError(null);
      await AdService.showInterstitialAd({
        onAdShown: () => {
          setInterstitialShownThisSession((c) => c + 1);
          setLastInterstitialShownAt(Date.now());
          setInterstitialLoadState('showing');
        },
        onAdDismissed: () => {
          syncLoadStates();
          callbacks?.onAdClosed?.();
        },
        onAdFailedToShow: (err) => {
          setAdError(err.message);
          syncLoadStates();
        },
      });
    },
    [isPremium, lastInterstitialShownAt, syncLoadStates]
  );

  const isCoinAdAvailable = useCallback(
    async (coinAmountOrPackageId: number | CoinAdCooldown.CoinAdPackageId): Promise<boolean> => {
      if (typeof coinAmountOrPackageId === 'number') {
        return CoinAdCooldown.isCoinAdAvailableByAmount(coinAmountOrPackageId);
      }
      return CoinAdCooldown.isCoinAdAvailable(coinAmountOrPackageId);
    },
    []
  );

  const getCoinAdCooldownRemaining = useCallback(
    async (coinAmountOrPackageId: number | CoinAdCooldown.CoinAdPackageId): Promise<number> => {
      if (typeof coinAmountOrPackageId === 'number') {
        return CoinAdCooldown.getCoinAdCooldownRemainingByAmount(coinAmountOrPackageId);
      }
      return CoinAdCooldown.getCoinAdCooldownRemaining(coinAmountOrPackageId);
    },
    []
  );

  const recordCoinAdClaim = useCallback((packageId: CoinAdCooldown.CoinAdPackageId) => CoinAdCooldown.setLastClaimTime(packageId), []);

  const showRewardedAdForCoins = useCallback(
    async (coinAmount: number, onSuccess: () => void) => {
      const packageId = CoinAdCooldown.coinAmountToPackageId(coinAmount);
      if (packageId == null) {
        logger.warn('AdContext: showRewardedAdForCoins invalid amount', { coinAmount });
        return;
      }
      if (isPremium) {
        logger.log('AdContext: skipped coin ad (premium)');
        return;
      }
      const userId = user?.id;
      if (!userId) {
        logger.warn('AdContext: showRewardedAdForCoins no user');
        setAdError('Please sign in to earn coins');
        return;
      }
      const available = await CoinAdCooldown.isCoinAdAvailable(packageId);
      if (!available) {
        const remaining = await CoinAdCooldown.getCoinAdCooldownRemaining(packageId);
        logger.log('AdContext: coin ad on cooldown', { coinAmount, remainingMs: remaining });
        setAdError(`Coins available again in ${Math.ceil(remaining / 60000)} min`);
        return;
      }
      setAdError(null);
      let rewardGranted = false;
      await AdService.showRewardedAd({
        onAdShown: () => {
          setRewardedShownThisSession((c) => c + 1);
          setLastRewardedShownAt(Date.now());
          setRewardedLoadState('showing');
        },
        onAdDismissed: () => syncLoadStates(),
        onRewardEarned: async () => {
          rewardGranted = true;
          try {
            await CoinService.getInstance().addCoins(userId, coinAmount, REWARD_REASON);
            await CoinAdCooldown.setLastClaimTime(packageId);
            logger.log('AdContext: coins granted after ad', { userId, coinAmount });
            onSuccess();
          } catch (e) {
            logger.error('AdContext: addCoins failed after ad', e);
            setAdError('Coins could not be added. Please try again.');
          }
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
      lastRewardedShownAt,
      lastInterstitialShownAt,
      adError,
      clearAdError,
      loadRewardedAd,
      loadInterstitialAd,
      showRewardedAd,
      showInterstitialAd,
      showRewardedAdForCoins,
      isCoinAdAvailable,
      getCoinAdCooldownRemaining,
      recordCoinAdClaim,
      isAdReady,
    }),
    [
      isPremium,
      setPremium,
      rewardedLoadState,
      interstitialLoadState,
      rewardedShownThisSession,
      interstitialShownThisSession,
      lastRewardedShownAt,
      lastInterstitialShownAt,
      adError,
      clearAdError,
      loadRewardedAd,
      loadInterstitialAd,
      showRewardedAd,
      showInterstitialAd,
      showRewardedAdForCoins,
      isCoinAdAvailable,
      getCoinAdCooldownRemaining,
      recordCoinAdClaim,
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
