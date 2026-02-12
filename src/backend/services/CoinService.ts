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
const WELCOME_BONUS_AMOUNT = 100;
const MIGRATION_BONUS_AMOUNT = 50;

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
   * Set balance to 100 and record "Welcome bonus" for new users. Idempotent: skips if welcome transaction already exists.
   */
  public async initializeCoins(userId: string): Promise<void> {
    try {
      await ensureAuthenticatedAndOwn(userId);
      const existing = await this.getCoinTransactions(userId, 50);
      const hasWelcome = existing.some((t) => t.reason === 'Welcome bonus' && t.type === 'earned');
      if (hasWelcome) {
        logger.log(`CoinService: initializeCoins skipped, already has Welcome bonus for ${userId}`);
        return;
      }

      const userRef = doc(db, COLLECTIONS.USER_PROFILES, userId);
      const snap = await getDoc(userRef);
      const currentCoins = snap.exists() ? (snap.data()?.coins ?? 0) : 0;
      const newCoins = currentCoins + WELCOME_BONUS_AMOUNT;

      const txCollRef = collection(db, COLLECTIONS.USER_PROFILES, userId, COIN_TRANSACTIONS_SUBCOLLECTION);
      if (snap.exists()) {
        await updateDoc(userRef, { coins: newCoins, lastUpdated: serverTimestamp() });
      } else {
        await setDoc(userRef, { coins: newCoins, lastUpdated: serverTimestamp() }, { merge: true });
      }
      await addDoc(txCollRef, {
        amount: WELCOME_BONUS_AMOUNT,
        type: 'earned',
        reason: 'Welcome bonus',
        timestamp: serverTimestamp(),
      });
      await this.pruneOldTransactions(userId);
      logger.log(`CoinService: initialized coins for ${userId}, balance ${newCoins} (Welcome bonus)`);
    } catch (error) {
      logger.error('CoinService: initializeCoins failed', userId, error);
      throw error;
    }
  }

  /**
   * Grant 50 coins with reason "Account upgrade bonus" once for existing users who have 0 balance and no transactions.
   */
  public async grantMigrationBonusIfNeeded(userId: string): Promise<boolean> {
    try {
      await ensureAuthenticatedAndOwn(userId);
      const balance = await this.getCoinBalance(userId);
      if (balance > 0) return false;
      const transactions = await this.getCoinTransactions(userId, 10);
      const hasMigration = transactions.some((t) => t.reason === 'Account upgrade bonus');
      if (hasMigration) return false;

      await this.addCoins(userId, MIGRATION_BONUS_AMOUNT, 'Account upgrade bonus');
      logger.log(`CoinService: migration bonus granted for ${userId}`);
      return true;
    } catch (error) {
      logger.error('CoinService: grantMigrationBonusIfNeeded failed', userId, error);
      return false;
    }
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
