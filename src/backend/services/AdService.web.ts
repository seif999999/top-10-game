/**
 * AdService – web stub. No native AdMob on web; all ad actions no-op or fail gracefully.
 * This file is used when building for web so react-native-google-mobile-ads is never imported.
 */

import type { AdLoadState, AdError, AdReward } from '../../shared/types/ads';
import { logger } from '../utils/logger';

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

export class AdService {
  private static instance: AdService | null = null;

  private initialized = true;
  private initPromise: Promise<void> = Promise.resolve();
  private rewardedLoadState: AdLoadState = 'idle';
  private interstitialLoadState: AdLoadState = 'idle';
  private frequencyCapMs = 60 * 1000;

  private constructor() {
    logger.log('AdService (web): stub loaded');
  }

  public static getInstance(): AdService {
    if (!AdService.instance) {
      AdService.instance = new AdService();
    }
    return AdService.instance;
  }

  public async initialize(): Promise<void> {
    return this.initPromise;
  }

  public loadRewardedAd(): Promise<void> {
    return Promise.resolve();
  }

  public loadInterstitialAd(): Promise<void> {
    return Promise.resolve();
  }

  public async showRewardedAd(callbacks: ShowRewardedCallbacks = {}): Promise<void> {
    callbacks.onAdFailedToShow?.({
      code: 'unknown',
      message: 'Ads are not available on web',
    });
  }

  public async showInterstitialAd(callbacks: ShowInterstitialCallbacks = {}): Promise<void> {
    callbacks.onAdFailedToShow?.({
      code: 'unknown',
      message: 'Ads are not available on web',
    });
  }

  public getRewardedLoadState(): AdLoadState {
    return this.rewardedLoadState;
  }

  public getInterstitialLoadState(): AdLoadState {
    return this.interstitialLoadState;
  }

  public getImpressionCount(): { rewarded: number; interstitial: number } {
    return { rewarded: 0, interstitial: 0 };
  }

  public getErrorCount(): { rewarded: number; interstitial: number } {
    return { rewarded: 0, interstitial: 0 };
  }

  public setFrequencyCapMs(_ms: number): void {
    // no-op
  }

  public isInitialized(): boolean {
    return this.initialized;
  }
}

export default AdService.getInstance();
