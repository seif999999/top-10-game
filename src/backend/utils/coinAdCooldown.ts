/**
 * Progressive rewarded ad tracking.
 * 3 ads per cycle with rewards: 20 → 30 → 50 coins (100 total per cycle).
 * No hourly cap — after 3 ads the cycle resets and the user can start again.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../utils/logger';

/** Rewards per ad in cycle (1st = 20, 2nd = 30, 3rd = 50). Total 100. Export for UI. */
export const PROGRESSIVE_REWARDS = [20, 30, 50] as const;
const CYCLE_LENGTH = 3;

const STORAGE_KEY = 'progressive_ad_cycle_count';

export function getHourBucket(): number {
  return Math.floor(Date.now() / (60 * 60 * 1000));
}

export interface ProgressiveAdInfo {
  adsWatchedThisHour: number;
  nextAdCoins: number;
  maxReached: boolean;
  timeUntilResetMs: number;
}

/**
 * Get current ads watched in the current cycle (0, 1, or 2).
 */
export function getStorageKey(): string {
  return STORAGE_KEY;
}

/**
 * Get ads watched in current cycle.
 */
export async function getAdsWatchedThisHour(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw == null) return 0;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) && n >= 0 ? Math.min(n, CYCLE_LENGTH) % CYCLE_LENGTH : 0;
  } catch {
    return 0;
  }
}

/**
 * Increment ads watched this cycle. After 3rd ad, resets to 0 (no cap).
 */
export async function incrementProgressiveAdCount(): Promise<number> {
  try {
    const current = await getAdsWatchedThisHour();
    const next = (current + 1) % CYCLE_LENGTH;
    await AsyncStorage.setItem(STORAGE_KEY, String(next));
    if (current === CYCLE_LENGTH - 1) {
      logger.log('Progressive ad: cycle completed, reset for next cycle');
    }
    return next;
  } catch (e) {
    logger.warn('coinAdCooldown: incrementProgressiveAdCount failed', e);
    return 0;
  }
}

/**
 * Get coins for the Nth ad in cycle (0-indexed: 0=1st, 1=2nd, 2=3rd).
 */
export function getProgressiveReward(adIndex: number): number {
  if (adIndex < 0 || adIndex >= CYCLE_LENGTH) return 0;
  return PROGRESSIVE_REWARDS[adIndex] as number;
}

/**
 * No time-based reset; cycle resets after 3 ads.
 */
export function getTimeUntilReset(): number {
  return 0;
}

/**
 * Get progressive ad info for UI.
 */
export async function getProgressiveAdInfo(): Promise<ProgressiveAdInfo> {
  const count = await getAdsWatchedThisHour();
  const maxReached = false; // No cap — user can always start/continue a cycle
  const nextAdCoins = PROGRESSIVE_REWARDS[count];
  return {
    adsWatchedThisHour: count,
    nextAdCoins,
    maxReached,
    timeUntilResetMs: 0,
  };
}

/**
 * User can always watch another ad (no hourly cap).
 */
export async function canWatchProgressiveAd(): Promise<boolean> {
  return true;
}
