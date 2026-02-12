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

const SLOT_UNLOCK_COST = 100;
const FREE_SLOTS_COUNT = 1;
const PAID_SLOT_START_INDEX = 1;

function ensureAuthenticated(userId: string): void {
  if (!userId || typeof userId !== 'string') {
    throw new AppError({
      code: 'AUTH_REQUIRED',
      message: 'User must be authenticated to unlock slots',
      userMessage: 'Please sign in to unlock more slots.',
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
    ensureAuthenticated(userId);
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
  ensureAuthenticated(userId);
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

  const coinService = CoinService.getInstance();
  const deducted = await coinService.deductCoins(
    userId,
    SLOT_UNLOCK_COST,
    `Custom slot ${slotIndex + 1} unlock`
  );

  if (!deducted) return false;

  const userRef = doc(db, COLLECTIONS.USER_PROFILES, userId);
  await updateDoc(userRef, {
    unlockedCustomSlots: arrayUnion(slotIndex),
    lastUpdated: serverTimestamp(),
  });

  logger.log(`CustomSlotUnlockService: Unlocked slot ${slotIndex + 1} for user ${userId}`);
  return true;
}

export const SLOT_UNLOCK_COINS = SLOT_UNLOCK_COST;
export const FREE_SLOT_INDEX = 0;
