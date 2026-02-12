/**
 * Persists and reads last-claim time for coin rewarded ad packages.
 * Storage keys: coin_ad_cooldown_50, coin_ad_cooldown_100, coin_ad_cooldown_200.
 * Used by AdContext for isCoinAdAvailable, getCoinAdCooldownRemaining, and reward flow.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export type CoinAdPackageId = '25' | '50' | '100' | '200';

const COOLDOWN_MS: Record<CoinAdPackageId, number> = {
  '25': 0,
  '50': 0,
  '100': 2 * 60 * 60 * 1000,   // 2 hours (7200000 ms)
  '200': 24 * 60 * 60 * 1000,   // 24 hours (86400000 ms)
};

const STORAGE_PREFIX = 'coin_ad_cooldown_';

const VALID_AMOUNTS: CoinAdPackageId[] = ['25', '50', '100', '200'];

export function coinAmountToPackageId(coinAmount: number): CoinAdPackageId | null {
  const s = String(coinAmount);
  if (s === '25' || s === '50' || s === '100' || s === '200') return s as CoinAdPackageId;
  return null;
}

export function getCoinAdCooldownMs(packageId: CoinAdPackageId): number {
  return COOLDOWN_MS[packageId];
}

export async function getLastClaimTime(packageId: CoinAdPackageId): Promise<number | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_PREFIX + packageId);
    if (raw == null) return null;
    const t = parseInt(raw, 10);
    return Number.isFinite(t) ? t : null;
  } catch {
    return null;
  }
}

export async function setLastClaimTime(packageId: CoinAdPackageId): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_PREFIX + packageId, String(Date.now()));
  } catch {
    // non-fatal
  }
}

export async function getCoinAdCooldownRemaining(packageId: CoinAdPackageId): Promise<number> {
  const cooldownMs = COOLDOWN_MS[packageId];
  if (cooldownMs <= 0) return 0;
  const last = await getLastClaimTime(packageId);
  if (last == null) return 0;
  const elapsed = Date.now() - last;
  return Math.max(0, cooldownMs - elapsed);
}

export async function isCoinAdAvailable(packageId: CoinAdPackageId): Promise<boolean> {
  const remaining = await getCoinAdCooldownRemaining(packageId);
  return remaining === 0;
}

export async function isCoinAdAvailableByAmount(coinAmount: number): Promise<boolean> {
  const id = coinAmountToPackageId(coinAmount);
  return id != null ? isCoinAdAvailable(id) : false;
}

export async function getCoinAdCooldownRemainingByAmount(coinAmount: number): Promise<number> {
  const id = coinAmountToPackageId(coinAmount);
  return id != null ? getCoinAdCooldownRemaining(id) : 0;
}

export async function setLastClaimTimeByAmount(coinAmount: number): Promise<void> {
  const id = coinAmountToPackageId(coinAmount);
  if (id != null) await setLastClaimTime(id);
}
