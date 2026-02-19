/**
 * Progressive rewarded ad tracking.
 * 5 ads per hour with increasing rewards: 10 → 15 → 20 → 25 → 30 coins.
 * Resets every hour based on hour bucket.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../utils/logger';

const PROGRESSIVE_REWARDS = [10, 15, 20, 25, 30] as const;
const MAX_ADS_PER_HOUR = 5;
const HOUR_MS = 60 * 60 * 1000;

export function getHourBucket(): number {
  return Math.floor(Date.now() / HOUR_MS);
}

const STORAGE_PREFIX = 'progressive_ad_count_';

export interface ProgressiveAdInfo {
  adsWatchedThisHour: number;
  nextAdCoins: number;
  maxReached: boolean;
  timeUntilResetMs: number;
}

/**
 * Get current hour bucket storage key.
 */
export function getStorageKey(): string {
  return STORAGE_PREFIX + getHourBucket();
}

/**
 * Get current ads watched this hour.
 */
export async function getAdsWatchedThisHour(): Promise<number> {
  try {
    const key = getStorageKey();
    const raw = await AsyncStorage.getItem(key);
    if (raw == null) return 0;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) && n >= 0 ? Math.min(n, MAX_ADS_PER_HOUR) : 0;
  } catch {
    return 0;
  }
}

/**
 * Increment ads watched this hour. Call after successful ad completion.
 */
export async function incrementProgressiveAdCount(): Promise<number> {
  try {
    const key = getStorageKey();
    const current = await getAdsWatchedThisHour();
    const next = Math.min(current + 1, MAX_ADS_PER_HOUR);
    await AsyncStorage.setItem(key, String(next));
    if (next >= MAX_ADS_PER_HOUR) {
      logger.log('Progressive ad: hourly cap reached', { count: next });
    }
    return next;
  } catch (e) {
    logger.warn('coinAdCooldown: incrementProgressiveAdCount failed', e);
    return 0;
  }
}

/**
 * Get coins for the Nth ad (0-indexed: 0=1st ad, 4=5th ad).
 */
export function getProgressiveReward(adIndex: number): number {
  if (adIndex < 0 || adIndex >= MAX_ADS_PER_HOUR) return 0;
  return PROGRESSIVE_REWARDS[adIndex];
}

/**
 * Get milliseconds until next hour boundary (reset).
 */
export function getTimeUntilReset(): number {
  const now = Date.now();
  const nextHourStart = (getHourBucket() + 1) * HOUR_MS;
  return Math.max(0, nextHourStart - now);
}

/**
 * Get progressive ad info for UI.
 */
export async function getProgressiveAdInfo(): Promise<ProgressiveAdInfo> {
  const count = await getAdsWatchedThisHour();
  const maxReached = count >= MAX_ADS_PER_HOUR;
  const nextAdCoins = maxReached ? 0 : PROGRESSIVE_REWARDS[count];
  const timeUntilResetMs = getTimeUntilReset();
  return {
    adsWatchedThisHour: count,
    nextAdCoins,
    maxReached,
    timeUntilResetMs,
  };
}

/**
 * Check if user can watch another ad this hour.
 */
export async function canWatchProgressiveAd(): Promise<boolean> {
  const count = await getAdsWatchedThisHour();
  return count < MAX_ADS_PER_HOUR;
}
