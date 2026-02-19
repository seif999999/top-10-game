/**
 * CoinService – singleton for coin balance and transaction history.
 * Coins stored on userProfiles/{userId}.coins; history in userProfiles/{userId}/coinTransactions.
 */

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  runTransaction,
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import type { CoinTransaction } from '../../shared/types';
import { logger } from '../utils/logger';
import { AppError } from '../../shared/errors';
import { COLLECTIONS } from '../utils/constants';

const COIN_TRANSACTIONS_SUBCOLLECTION = 'coinTransactions';
const MAX_TRANSACTIONS_PER_USER = 100;

/** Cost in coins to purchase ad-free (one-time) */
export const AD_FREE_COST = 500;

async function ensureAuthenticatedAndOwn(userId: string): Promise<void> {
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
    logger.error('CoinService: Unauthorized access', { requested: userId, auth: currentUser.uid });
    throw new AppError({
      code: 'UNAUTHORIZED_ACCESS',
      message: 'Users can only access their own coin data',
      userMessage: 'You can only access your own data.',
    });
  }
}

function toTransaction(docId: string, data: { amount: number; type: string; reason: string; timestamp: unknown }): CoinTransaction {
  return {
    amount: data.amount,
    type: data.type as 'earned' | 'spent',
    reason: data.reason,
    timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toDate() : new Date(data.timestamp as string | number),
  };
}

export class CoinService {
  private static instance: CoinService | null = null;

  private constructor() {}

  public static getInstance(): CoinService {
    if (!CoinService.instance) {
      CoinService.instance = new CoinService();
    }
    return CoinService.instance;
  }

  /**
   * Get current coin balance for a user. Returns 0 if profile or coins missing.
   */
  public async getCoinBalance(userId: string): Promise<number> {
    try {
      await ensureAuthenticatedAndOwn(userId);
      const userRef = doc(db, COLLECTIONS.USER_PROFILES, userId);
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        logger.log(`CoinService: No profile for ${userId}, balance 0`);
        return 0;
      }
      const data = snap.data();
      const balance = data?.coins ?? 0;
      return typeof balance === 'number' && balance >= 0 ? balance : 0;
    } catch (error) {
      logger.error('CoinService: getCoinBalance failed', error);
      throw error;
    }
  }

  /**
   * Add coins and record an earned transaction. Uses a Firestore transaction.
   */
  public async addCoins(userId: string, amount: number, reason: string): Promise<void> {
    if (amount <= 0) {
      logger.warn('CoinService: addCoins called with non-positive amount', { amount, reason });
      return;
    }
    try {
      await ensureAuthenticatedAndOwn(userId);
      const userRef = doc(db, COLLECTIONS.USER_PROFILES, userId);
      const txCollRef = collection(db, COLLECTIONS.USER_PROFILES, userId, COIN_TRANSACTIONS_SUBCOLLECTION);

      await runTransaction(db, async (tx) => {
        const userSnap = await tx.get(userRef);
        const currentCoins = userSnap.exists() ? (userSnap.data()?.coins ?? 0) : 0;
        const newCoins = currentCoins + amount;

        if (userSnap.exists()) {
          tx.update(userRef, { coins: newCoins, lastUpdated: serverTimestamp() });
        } else {
          tx.set(userRef, { coins: newCoins, lastUpdated: serverTimestamp() }, { merge: true });
        }
        const newTxRef = doc(txCollRef);
        tx.set(newTxRef, {
          amount,
          type: 'earned',
          reason,
          timestamp: serverTimestamp(),
        });
      });

      logger.log(`CoinService: added ${amount} coins for ${userId}, reason: ${reason}`);
    } catch (error) {
      logger.error('CoinService: addCoins failed', { userId, amount, reason }, error);
      throw error;
    }
  }

  /**
   * Deduct coins if balance is sufficient. Returns true if deducted, false if insufficient. Uses a Firestore transaction.
   */
  public async deductCoins(userId: string, amount: number, reason: string): Promise<boolean> {
    if (amount <= 0) {
      logger.warn('CoinService: deductCoins called with non-positive amount', { amount, reason });
      return false;
    }
    try {
      await ensureAuthenticatedAndOwn(userId);
      const userRef = doc(db, COLLECTIONS.USER_PROFILES, userId);
      const txCollRef = collection(db, COLLECTIONS.USER_PROFILES, userId, COIN_TRANSACTIONS_SUBCOLLECTION);

      let deducted = false;
      await runTransaction(db, async (tx) => {
        const userSnap = await tx.get(userRef);
        const currentCoins = userSnap.exists() ? (userSnap.data()?.coins ?? 0) : 0;
        if (currentCoins < amount) {
          logger.log(`CoinService: insufficient balance for ${userId}, have ${currentCoins}, need ${amount}`);
          return;
        }
        const newCoins = currentCoins - amount;
        if (userSnap.exists()) {
          tx.update(userRef, { coins: newCoins, lastUpdated: serverTimestamp() });
        } else {
          tx.set(userRef, { coins: newCoins, lastUpdated: serverTimestamp() }, { merge: true });
        }
        const newTxRef = doc(txCollRef);
        tx.set(newTxRef, {
          amount: -amount,
          type: 'spent',
          reason,
          timestamp: serverTimestamp(),
        });
        deducted = true;
      });
      if (deducted) await this.pruneOldTransactions(userId);
      if (deducted) {
        logger.log(`CoinService: deducted ${amount} coins for ${userId}, reason: ${reason}`);
      }
      return deducted;
    } catch (error) {
      logger.error('CoinService: deductCoins failed', { userId, amount, reason }, error);
      throw error;
    }
  }

  /**
   * Purchase ad-free for coins. Deducts AD_FREE_COST and sets adFree: true on the user profile.
   * Returns true if purchase succeeded, false if already ad-free or insufficient balance.
   */
  public async purchaseAdFree(userId: string): Promise<{ success: boolean; reason?: string }> {
    try {
      await ensureAuthenticatedAndOwn(userId);
      const userRef = doc(db, COLLECTIONS.USER_PROFILES, userId);
      const txCollRef = collection(db, COLLECTIONS.USER_PROFILES, userId, COIN_TRANSACTIONS_SUBCOLLECTION);

      let purchased = false;
      await runTransaction(db, async (tx) => {
        const userSnap = await tx.get(userRef);
        const data = userSnap.exists() ? userSnap.data() : {};
        const currentCoins = data?.coins ?? 0;
        const alreadyAdFree = data?.adFree === true;

        if (alreadyAdFree) {
          logger.log(`CoinService: purchaseAdFree skipped, user ${userId} already ad-free`);
          return;
        }
        if (currentCoins < AD_FREE_COST) {
          logger.log(`CoinService: purchaseAdFree insufficient balance for ${userId}, have ${currentCoins}`);
          return;
        }

        const newCoins = currentCoins - AD_FREE_COST;
        if (userSnap.exists()) {
          tx.update(userRef, {
            coins: newCoins,
            adFree: true,
            lastUpdated: serverTimestamp(),
          });
        } else {
          tx.set(
            userRef,
            { coins: newCoins, adFree: true, lastUpdated: serverTimestamp() },
            { merge: true }
          );
        }
        const newTxRef = doc(txCollRef);
        tx.set(newTxRef, {
          amount: -AD_FREE_COST,
          type: 'spent',
          reason: 'Remove ads',
          timestamp: serverTimestamp(),
        });
        purchased = true;
      });

      if (purchased) {
        await this.pruneOldTransactions(userId);
        logger.log(`CoinService: purchased ad-free for ${userId}`);
        return { success: true };
      }

      const userSnap = await getDoc(userRef);
      const data = userSnap.exists() ? userSnap.data() : {};
      if (data?.adFree === true) return { success: false, reason: 'already_ad_free' };
      return { success: false, reason: 'insufficient_coins' };
    } catch (error) {
      logger.error('CoinService: purchaseAdFree failed', userId, error);
      throw error;
    }
  }

  /**
   * Initialize coins for new users. No welcome bonus - new users start with 0 coins.
   * Idempotent: skips if profile already has coins; otherwise ensures coins: 0.
   */
  public async initializeCoins(userId: string): Promise<void> {
    try {
      await ensureAuthenticatedAndOwn(userId);
      const userRef = doc(db, COLLECTIONS.USER_PROFILES, userId);
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        await setDoc(userRef, { coins: 0, lastUpdated: serverTimestamp() }, { merge: true });
        logger.log(`CoinService: initialized coins for new user ${userId}, balance 0`);
        return;
      }
      const data = snap.data();
      if (data && typeof data.coins === 'number') {
        logger.log(`CoinService: initializeCoins skipped, profile has coins for ${userId}`);
        return;
      }
      await updateDoc(userRef, { coins: 0, lastUpdated: serverTimestamp() });
      logger.log(`CoinService: set coins to 0 for ${userId}`);
    } catch (error) {
      logger.error('CoinService: initializeCoins failed', userId, error);
      throw error;
    }
  }

  /**
   * Migration bonus disabled. Returns false without granting coins.
   */
  public async grantMigrationBonusIfNeeded(_userId: string): Promise<boolean> {
    return false;
  }

  /**
   * Get recent coin transactions, newest first. Default limit 100.
   */
  public async getCoinTransactions(userId: string, limitCount: number = 100): Promise<CoinTransaction[]> {
    try {
      await ensureAuthenticatedAndOwn(userId);
      const txCollRef = collection(db, COLLECTIONS.USER_PROFILES, userId, COIN_TRANSACTIONS_SUBCOLLECTION);
      const q = query(
        txCollRef,
        orderBy('timestamp', 'desc'),
        limit(Math.min(limitCount, MAX_TRANSACTIONS_PER_USER))
      );
      const snapshot = await getDocs(q);
      const list: CoinTransaction[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        list.push(toTransaction(d.id, { ...data, timestamp: data.timestamp }));
      });
      return list;
    } catch (error) {
      logger.error('CoinService: getCoinTransactions failed', userId, error);
      throw error;
    }
  }

  /**
   * Keep only the last MAX_TRANSACTIONS_PER_USER transactions. Call after adding a new one if needed.
   */
  private async pruneOldTransactions(userId: string): Promise<void> {
    try {
      const txCollRef = collection(db, COLLECTIONS.USER_PROFILES, userId, COIN_TRANSACTIONS_SUBCOLLECTION);
      const q = query(txCollRef, orderBy('timestamp', 'desc'), limit(MAX_TRANSACTIONS_PER_USER + 50));
      const snapshot = await getDocs(q);
      if (snapshot.docs.length <= MAX_TRANSACTIONS_PER_USER) return;
      const toDelete = snapshot.docs.slice(MAX_TRANSACTIONS_PER_USER);
      const batch = writeBatch(db);
      toDelete.forEach((d) => batch.delete(d.ref));
      await batch.commit();
      logger.log(`CoinService: pruned ${toDelete.length} old transactions for ${userId}`);
    } catch (error) {
      logger.warn('CoinService: pruneOldTransactions failed (non-fatal)', userId, error);
    }
  }
}

export default CoinService.getInstance();
