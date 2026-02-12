/**
 * AdMob integration type definitions.
 * Use these types across the app for ad loading, display, and event handling.
 */

// ---------------------------------------------------------------------------
// Ad formats
// ---------------------------------------------------------------------------

export type AdFormat = 'rewarded' | 'interstitial' | 'banner';

export const AD_FORMATS: readonly AdFormat[] = [
  'rewarded',
  'interstitial',
  'banner',
] as const;

// ---------------------------------------------------------------------------
// Ad loading states
// ---------------------------------------------------------------------------

export type AdLoadState =
  | 'idle'      // Not yet requested
  | 'loading'  // Request in progress
  | 'loaded'    // Ready to show
  | 'failed'    // Load failed
  | 'showing'   // Currently displayed
  | 'closed';   // Was shown and dismissed

export const AD_LOAD_STATES: readonly AdLoadState[] = [
  'idle',
  'loading',
  'loaded',
  'failed',
  'showing',
  'closed',
] as const;

// ---------------------------------------------------------------------------
// Ad error types
// ---------------------------------------------------------------------------

export interface AdError {
  code: AdErrorCode;
  message: string;
  domain?: string;
  cause?: unknown;
}

export type AdErrorCode =
  | 'internal'
  | 'invalid-request'
  | 'network'
  | 'no-fill'
  | 'load-in-progress'
  | 'ad-already-loaded'
  | 'app-not-foreground'
  | 'unknown';

// ---------------------------------------------------------------------------
// Reward types (rewarded ads)
// ---------------------------------------------------------------------------

export interface AdReward {
  /** Reward type identifier (e.g. "coins", "extra_life") */
  type: string;
  /** Amount granted (e.g. 25 for 25 coins) */
  amount: number;
}

// ---------------------------------------------------------------------------
// Ad configuration interfaces
// ---------------------------------------------------------------------------

/** Base config shared by all ad units (unit IDs typically from env). */
export interface BaseAdConfig {
  /** Ad unit ID for the current platform (Android / iOS). */
  adUnitId: string;
}

/** Config for a rewarded ad (e.g. watch video for coins). */
export interface RewardedAdConfig extends BaseAdConfig {
  format: 'rewarded';
  /** Optional: reward type/amount for UI or validation. */
  reward?: AdReward;
}

/** Config for an interstitial ad. */
export interface InterstitialAdConfig extends BaseAdConfig {
  format: 'interstitial';
}

/** Config for a banner ad. */
export interface BannerAdConfig extends BaseAdConfig {
  format: 'banner';
  /** Banner size. Defaults to adaptive or standard. */
  size?: BannerSize;
}

export type BannerSize =
  | 'banner'        // 320x50
  | 'largeBanner'   // 320x100
  | 'mediumRectangle' // 300x250
  | 'fullBanner'   // 468x60
  | 'leaderboard'   // 728x90
  | 'adaptive';    // Adaptive banner (recommended)

/** Union of all ad config types. */
export type AdConfig = RewardedAdConfig | InterstitialAdConfig | BannerAdConfig;

// ---------------------------------------------------------------------------
// Ad event callback types
// ---------------------------------------------------------------------------

export type AdLoadedCallback = () => void;

export type AdFailedToLoadCallback = (error: AdError) => void;

export type AdOpenedCallback = () => void;

export type AdClosedCallback = () => void;

export type AdClickedCallback = () => void;

export type AdImpressionCallback = () => void;

/** Called when a rewarded ad is earned (user completed the ad). */
export type RewardedAdEarnedRewardCallback = (reward: AdReward) => void;

/** Common callbacks for any full-screen ad (rewarded / interstitial). */
export interface FullScreenAdCallbacks {
  onAdLoaded?: AdLoadedCallback;
  onAdFailedToLoad?: AdFailedToLoadCallback;
  onAdOpened?: AdOpenedCallback;
  onAdClosed?: AdClosedCallback;
  onAdClicked?: AdClickedCallback;
  onAdImpression?: AdImpressionCallback;
}

/** Callbacks specific to rewarded ads. */
export interface RewardedAdCallbacks extends FullScreenAdCallbacks {
  onUserEarnedReward?: RewardedAdEarnedRewardCallback;
}

/** Callbacks for banner ads (subset of events). */
export interface BannerAdCallbacks {
  onAdLoaded?: AdLoadedCallback;
  onAdFailedToLoad?: AdFailedToLoadCallback;
  onAdOpened?: AdOpenedCallback;
  onAdClosed?: AdClosedCallback;
  onAdClicked?: AdClickedCallback;
  onAdImpression?: AdImpressionCallback;
}

// ---------------------------------------------------------------------------
// Ad state / hook-friendly types
// ---------------------------------------------------------------------------

export interface AdState {
  loadState: AdLoadState;
  error: AdError | null;
}

export interface RewardedAdState extends AdState {
  reward: AdReward | null;
}
