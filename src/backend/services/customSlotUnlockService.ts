/**
 * CustomSlotUnlockService – manages paid custom question slots.
 * Slot 0 is free; slots 1–9 require coins to unlock (one-time purchase).
 */

import { doc, getDoc, updateDoc, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { db } from './firebase';
import { COLLECTIONS } from '../utils/constants';
import { CoinService } from './CoinService';
import { logger } from '../utils/logger';
import { AppError } from '../../shared/errors';

const FREE_SLOTS_COUNT = 1;
const PAID_SLOT_START_INDEX = 1;

/** Slot pricing: 0=free, 1=450, 2=500, 3=600, 4=700, 5=850, 6=1000, 7=1200, 8=1400, 9=1600. Total 8,300 coins. */
const SLOT_COSTS = [0, 450, 500, 600, 700, 850, 1000, 1200, 1400, 1600] as const;

export function getSlotUnlockCost(slotIndex: number): number {
  if (slotIndex < 0 || slotIndex >= SLOT_COSTS.length) return 0;
  return SLOT_COSTS[slotIndex];
}

function ensureAuthenticated(userId: string): void {
  if (!userId || typeof userId !== 'string') {
    throw new AppError({
      code: 'AUTH_REQUIRED',
      message: 'User must be authenticated to unlock slots',
      userMessage: 'Please sign in to unlock more slots.',
    });
  }
}

async function ensureAuthenticatedAndOwn(userId: string): Promise<void> {
  ensureAuthenticated(userId);
  const { auth } = await import('./firebase');
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new AppError({
      code: 'AUTH_REQUIRED',
      message: 'User must be authenticated',
      userMessage: 'Please sign in to continue.',
    });
  }
  if (currentUser.uid !== userId) {
    logger.error('CustomSlotUnlockService: Unauthorized access', { requested: userId, auth: currentUser.uid });
    throw new AppError({
      code: 'UNAUTHORIZED_UPDATE',
      message: 'Users can only access their own slots',
      userMessage: 'You can only manage your own slots.',
    });
  }
}

/**
 * Get list of unlocked paid slot indices (1–9). Slot 0 is always free.
 * Returns [] for guests or if no slots unlocked.
 */
export async function getUnlockedSlots(userId: string | null | undefined): Promise<number[]> {
  if (!userId) return [];
  try {
    await ensureAuthenticatedAndOwn(userId);
    const userRef = doc(db, COLLECTIONS.USER_PROFILES, userId);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return [];
    const data = snap.data();
    const arr = data?.unlockedCustomSlots;
    if (!Array.isArray(arr)) return [];
    return arr.filter((n) => typeof n === 'number' && n >= PAID_SLOT_START_INDEX && n <= 9);
  } catch (e) {
    logger.warn('CustomSlotUnlockService: getUnlockedSlots failed', e);
    return [];
  }
}

/**
 * Check if a slot is usable (free, unlocked, or has existing content - grandfather existing users).
 */
export function isSlotUsable(slotIndex: number, unlockedSlots: number[], slotHasContent?: boolean): boolean {
  if (slotIndex < 0 || slotIndex >= 10) return false;
  if (slotIndex < FREE_SLOTS_COUNT) return true; // Slot 0 is free
  if (unlockedSlots.includes(slotIndex)) return true;
  if (slotHasContent) return true; // Grandfather: existing content remains accessible
  return false;
}

/**
 * Unlock a paid slot by spending coins. Returns true if unlocked, false if insufficient coins or already unlocked.
 */
export async function unlockSlot(userId: string, slotIndex: number): Promise<boolean> {
  await ensureAuthenticatedAndOwn(userId);
  if (slotIndex < PAID_SLOT_START_INDEX || slotIndex >= 10) {
    throw new AppError({
      code: 'INVALID_SLOT',
      message: `Slot index ${slotIndex} cannot be unlocked (only 1–9 are paid).`,
      userMessage: 'Invalid slot.',
    });
  }

  const current = await getUnlockedSlots(userId);
  if (current.includes(slotIndex)) {
    logger.log(`CustomSlotUnlockService: Slot ${slotIndex + 1} already unlocked`);
    return true;
  }

  const cost = getSlotUnlockCost(slotIndex);
  const coinService = CoinService.getInstance();
  const deducted = await coinService.deductCoins(
    userId,
    cost,
    `Custom slot ${slotIndex + 1} unlock`
  );

  if (!deducted) return false;

  const userRef = doc(db, COLLECTIONS.USER_PROFILES, userId);
  await updateDoc(userRef, {
    unlockedCustomSlots: arrayUnion(slotIndex),
    lastUpdated: serverTimestamp(),
  });

  logger.log('Slot unlocked', { userId, slotIndex: slotIndex + 1, cost });
  return true;
}

export const FREE_SLOT_INDEX = 0;
