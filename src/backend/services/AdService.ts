/**
 * AdService – singleton service for AdMob (rewarded, interstitial).
 * Initializes SDK on app startup, preloads ads, handles show callbacks and frequency capping.
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';
import {
  type AdError,
  type AdReward,
  type AdFormat,
  type AdLoadState,
} from '../../shared/types/ads';
import { logger } from '../utils/logger';

// Lazy-load native module so web and unsupported environments don't break at import time
let mobileAdsModule: typeof import('react-native-google-mobile-ads') | null = null;
let RewardedAdClass: typeof import('react-native-google-mobile-ads').RewardedAd | null = null;
let InterstitialAdClass: typeof import('react-native-google-mobile-ads').InterstitialAd | null = null;
let TestIds: typeof import('react-native-google-mobile-ads').TestIds | null = null;
let AdEventType: typeof import('react-native-google-mobile-ads').AdEventType | null = null;
let RewardedAdEventType: typeof import('react-native-google-mobile-ads').RewardedAdEventType | null = null;

function getAdMobModule(): typeof import('react-native-google-mobile-ads') | null {
  if (mobileAdsModule !== null) return mobileAdsModule;
  if (Platform.OS === 'web') return null;
  // Expo Go does not include native AdMob; skip to avoid TurboModuleRegistry error
  if (typeof Constants !== 'undefined' && Constants.appOwnership === 'expo') return null;
  try {
    mobileAdsModule = require('react-native-google-mobile-ads');
    RewardedAdClass = mobileAdsModule.RewardedAd;
    InterstitialAdClass = mobileAdsModule.InterstitialAd;
    TestIds = mobileAdsModule.TestIds;
    AdEventType = mobileAdsModule.AdEventType;
    RewardedAdEventType = mobileAdsModule.RewardedAdEventType;
    return mobileAdsModule;
  } catch (e) {
    logger.warn('AdService: react-native-google-mobile-ads not available', e);
    return null;
  }
}

/** Ad unit IDs from env; use TestIds in __DEV__ when available. */
function getRewardedAdUnitId(): string {
  if (__DEV__ && TestIds) return TestIds.REWARDED;
  return Platform.select({
    ios: process.env.EXPO_PUBLIC_ADMOB_IOS_REWARDED_ID ?? '',
    android: process.env.EXPO_PUBLIC_ADMOB_ANDROID_REWARDED_ID ?? '',
    default: '',
  });
}

function getInterstitialAdUnitId(): string {
  if (__DEV__ && TestIds) return TestIds.INTERSTITIAL;
  return Platform.select({
    ios: process.env.EXPO_PUBLIC_ADMOB_IOS_INTERSTITIAL_ID ?? '',
    android: process.env.EXPO_PUBLIC_ADMOB_ANDROID_INTERSTITIAL_ID ?? '',
    default: '',
  });
}

export interface ShowRewardedCallbacks {
  onAdShown?: () => void;
  onAdDismissed?: () => void;
  onRewardEarned?: (reward: AdReward) => void;
  onAdFailedToShow?: (error: AdError) => void;
}

export interface ShowInterstitialCallbacks {
  onAdShown?: () => void;
  onAdDismissed?: () => void;
  onAdFailedToShow?: (error: AdError) => void;
}

const DEFAULT_FREQUENCY_CAP_MS = 60 * 1000; // 1 minute between same ad type

function toAdError(e: unknown): AdError {
  if (e && typeof e === 'object' && 'message' in e && typeof (e as { message: string }).message === 'string') {
    return {
      code: 'unknown',
      message: (e as { message: string }).message,
      cause: e,
    };
  }
  return {
    code: 'unknown',
    message: String(e),
    cause: e,
  };
}

export class AdService {
  private static instance: AdService | null = null;

  private initialized = false;
  private initPromise: Promise<void> | null = null;

  private rewardedAd: ReturnType<typeof RewardedAdClass.createForAdRequest> | null = null;
  private interstitialAd: ReturnType<typeof InterstitialAdClass.createForAdRequest> | null = null;

  private rewardedLoadState: AdLoadState = 'idle';
  private interstitialLoadState: AdLoadState = 'idle';

  private rewardedUnsubscribes: Array<() => void> = [];
  private interstitialUnsubscribes: Array<() => void> = [];

  private lastShownAt: Partial<Record<AdFormat, number>> = {};
  private frequencyCapMs = DEFAULT_FREQUENCY_CAP_MS;

  private impressionCount = { rewarded: 0, interstitial: 0 };
  private errorCount = { rewarded: 0, interstitial: 0 };

  private constructor() {}

  public static getInstance(): AdService {
    if (!AdService.instance) {
      AdService.instance = new AdService();
    }
    return AdService.instance;
  }

  /** Call once at app startup (e.g. in root component or App.tsx). */
  public async initialize(): Promise<void> {
    if (this.initPromise !== null) return this.initPromise;
    if (Platform.OS === 'web') {
      this.initPromise = Promise.resolve();
      logger.log('AdService: skipped (web)');
      return this.initPromise;
    }
    const mod = getAdMobModule();
    if (!mod) {
      this.initPromise = Promise.resolve();
      logger.log('AdService: skipped (module not available)');
      return this.initPromise;
    }
    this.initPromise = mod
      .default()
      .initialize()
      .then(() => {
        this.initialized = true;
        logger.log('AdService: SDK initialized');
        this.createRewardedAd();
        this.createInterstitialAd();
        this.loadRewardedAd();
        this.loadInterstitialAd();
      })
      .catch((e) => {
        logger.error('AdService: initialize failed', e);
      });
    return this.initPromise;
  }

  private createRewardedAd(): void {
    if (!RewardedAdClass) return;
    this.clearRewardedListeners();
    const unitId = getRewardedAdUnitId();
    if (!unitId) {
      logger.warn('AdService: rewarded ad unit ID missing');
      return;
    }
    this.rewardedAd = RewardedAdClass.createForAdRequest(unitId);

    const unload = this.rewardedAd.addAdEventListener(
      RewardedAdEventType!.LOADED,
      () => {
        this.rewardedLoadState = 'loaded';
        logger.log('AdService: rewarded ad loaded');
      }
    );
    this.rewardedUnsubscribes.push(unload);

    const unloadErr = this.rewardedAd.addAdEventListener(
      AdEventType!.ERROR,
      (error: { message?: string; code?: number }) => {
        this.rewardedLoadState = 'failed';
        this.errorCount.rewarded += 1;
        logger.error('AdService: rewarded ad load failed', error);
      }
    );
    this.rewardedUnsubscribes.push(unloadErr);

    const unEarned = this.rewardedAd.addAdEventListener(
      RewardedAdEventType!.EARNED_REWARD,
      (reward: { amount: number; type: string }) => {
        logger.log('AdService: rewarded ad earned', reward);
      }
    );
    this.rewardedUnsubscribes.push(unEarned);
  }

  private createInterstitialAd(): void {
    if (!InterstitialAdClass || !AdEventType) return;
    this.clearInterstitialListeners();
    const unitId = getInterstitialAdUnitId();
    if (!unitId) {
      logger.warn('AdService: interstitial ad unit ID missing');
      return;
    }
    this.interstitialAd = InterstitialAdClass.createForAdRequest(unitId);

    const unload = this.interstitialAd.addAdEventListener(AdEventType.LOADED, () => {
      this.interstitialLoadState = 'loaded';
      logger.log('AdService: interstitial ad loaded');
    });
    this.interstitialUnsubscribes.push(unload);

    const unloadErr = this.interstitialAd.addAdEventListener(
      AdEventType.ERROR,
      (error: { message?: string; code?: number }) => {
        this.interstitialLoadState = 'failed';
        this.errorCount.interstitial += 1;
        logger.error('AdService: interstitial ad load failed', error);
      }
    );
    this.interstitialUnsubscribes.push(unloadErr);
  }

  private clearRewardedListeners(): void {
    this.rewardedUnsubscribes.forEach((u) => u());
    this.rewardedUnsubscribes = [];
  }

  private clearInterstitialListeners(): void {
    this.interstitialUnsubscribes.forEach((u) => u());
    this.interstitialUnsubscribes = [];
  }

  private canShowByFrequency(format: AdFormat): boolean {
    const last = this.lastShownAt[format];
    if (last == null) return true;
    return Date.now() - last >= this.frequencyCapMs;
  }

  private recordShown(format: AdFormat): void {
    this.lastShownAt[format] = Date.now();
    if (format === 'rewarded') this.impressionCount.rewarded += 1;
    else if (format === 'interstitial') this.impressionCount.interstitial += 1;
  }

  /** Load rewarded ad (idempotent; preloads next after show). */
  public loadRewardedAd(): Promise<void> {
    if (Platform.OS === 'web' || !this.rewardedAd) return Promise.resolve();
    if (this.rewardedLoadState === 'loading' || this.rewardedLoadState === 'loaded') {
      return Promise.resolve();
    }
    this.rewardedLoadState = 'loading';
    return this.rewardedAd.load().then(
      () => {
        this.rewardedLoadState = 'loaded';
        logger.log('AdService: rewarded ad preloaded');
      },
      (e) => {
        this.rewardedLoadState = 'failed';
        this.errorCount.rewarded += 1;
        logger.error('AdService: rewarded ad load error', e);
      }
    );
  }

  /** Load interstitial ad (idempotent; preloads next after show). */
  public loadInterstitialAd(): Promise<void> {
    if (Platform.OS === 'web' || !this.interstitialAd) return Promise.resolve();
    if (this.interstitialLoadState === 'loading' || this.interstitialLoadState === 'loaded') {
      return Promise.resolve();
    }
    this.interstitialLoadState = 'loading';
    return this.interstitialAd.load().then(
      () => {
        this.interstitialLoadState = 'loaded';
        logger.log('AdService: interstitial ad preloaded');
      },
      (e) => {
        this.interstitialLoadState = 'failed';
        this.errorCount.interstitial += 1;
        logger.error('AdService: interstitial ad load error', e);
      }
    );
  }

  /** Show rewarded ad; invokes callbacks and preloads next after dismiss. */
  public async showRewardedAd(callbacks: ShowRewardedCallbacks = {}): Promise<void> {
    if (Platform.OS === 'web' || !getAdMobModule()) {
      callbacks.onAdFailedToShow?.(toAdError(new Error('Ads not available')));
      return;
    }
    if (!this.canShowByFrequency('rewarded')) {
      callbacks.onAdFailedToShow?.({
        code: 'internal',
        message: 'Rewarded ad is in frequency cap cooldown',
      });
      return;
    }
    if (this.rewardedLoadState !== 'loaded' || !this.rewardedAd) {
      callbacks.onAdFailedToShow?.({
        code: this.rewardedLoadState === 'failed' ? 'no-fill' : 'ad-already-loaded',
        message: this.rewardedLoadState === 'loaded' ? 'Ad not ready' : 'Rewarded ad not loaded',
      });
      return;
    }

    const { onAdShown, onAdDismissed, onRewardEarned, onAdFailedToShow } = callbacks;

    const unOpened = this.rewardedAd.addAdEventListener(AdEventType!.OPENED, () => {
      this.rewardedLoadState = 'showing';
      this.recordShown('rewarded');
      onAdShown?.();
    });
    const unClosed = this.rewardedAd.addAdEventListener(AdEventType!.CLOSED, () => {
      this.rewardedLoadState = 'closed';
      unOpened();
      unClosed();
      unEarned();
      onAdDismissed?.();
      this.rewardedLoadState = 'idle';
      this.createRewardedAd();
      this.loadRewardedAd();
    });
    const unEarned = this.rewardedAd.addAdEventListener(
      RewardedAdEventType!.EARNED_REWARD,
      (reward: { amount: number; type: string }) => {
        onRewardEarned?.({ type: reward.type, amount: reward.amount });
      }
    );

    try {
      await this.rewardedAd.show();
    } catch (e) {
      this.rewardedLoadState = 'loaded';
      unOpened();
      unClosed();
      unEarned();
      this.errorCount.rewarded += 1;
      onAdFailedToShow?.(toAdError(e));
    }
  }

  /** Show interstitial ad; invokes callbacks and preloads next after dismiss. */
  public async showInterstitialAd(callbacks: ShowInterstitialCallbacks = {}): Promise<void> {
    if (Platform.OS === 'web' || !getAdMobModule()) {
      callbacks.onAdFailedToShow?.(toAdError(new Error('Ads not available')));
      return;
    }
    if (!this.canShowByFrequency('interstitial')) {
      callbacks.onAdFailedToShow?.({
        code: 'internal',
        message: 'Interstitial ad is in frequency cap cooldown',
      });
      return;
    }
    if (this.interstitialLoadState !== 'loaded' || !this.interstitialAd) {
      callbacks.onAdFailedToShow?.({
        code: this.interstitialLoadState === 'failed' ? 'no-fill' : 'ad-already-loaded',
        message: this.interstitialLoadState === 'loaded' ? 'Ad not ready' : 'Interstitial ad not loaded',
      });
      return;
    }

    const { onAdShown, onAdDismissed, onAdFailedToShow } = callbacks;

    const unOpened = this.interstitialAd.addAdEventListener(AdEventType!.OPENED, () => {
      this.interstitialLoadState = 'showing';
      this.recordShown('interstitial');
      onAdShown?.();
    });
    const unClosed = this.interstitialAd.addAdEventListener(AdEventType!.CLOSED, () => {
      this.interstitialLoadState = 'closed';
      unOpened();
      unClosed();
      onAdDismissed?.();
      this.interstitialLoadState = 'idle';
      this.createInterstitialAd();
      this.loadInterstitialAd();
    });

    try {
      await this.interstitialAd.show();
    } catch (e) {
      this.interstitialLoadState = 'loaded';
      unOpened();
      unClosed();
      this.errorCount.interstitial += 1;
      onAdFailedToShow?.(toAdError(e));
    }
  }

  public getRewardedLoadState(): AdLoadState {
    return this.rewardedLoadState;
  }

  public getInterstitialLoadState(): AdLoadState {
    return this.interstitialLoadState;
  }

  public getImpressionCount(): { rewarded: number; interstitial: number } {
    return { ...this.impressionCount };
  }

  public getErrorCount(): { rewarded: number; interstitial: number } {
    return { ...this.errorCount };
  }

  /** Set minimum ms between showing the same ad type (default 60000). */
  public setFrequencyCapMs(ms: number): void {
    this.frequencyCapMs = Math.max(0, ms);
  }

  public isInitialized(): boolean {
    return this.initialized;
  }
}

export default AdService.getInstance();
