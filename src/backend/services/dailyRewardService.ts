import { doc, getDoc, setDoc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import { User } from '../../shared/types';
import { COLLECTIONS } from '../utils/constants';
import { logger } from '../utils/logger';
import { missionService } from './missionService';

export interface DailyRewardResult {
  success: boolean;
  alreadyClaimed: boolean;
  reward: number;
  currentStreak: number;
  currentWeek: number;
  streakBroken: boolean;
  message: string;
}

export interface StreakInfo {
  canClaim: boolean;
  currentStreak: number;
  currentWeek: number;
  nextReward: number;
  lastClaimDate: Date | null;
  streakWillBreak: boolean; // True if more than 24 hours since last claim
}

/**
 * Check if two dates are the same calendar day (in local timezone)
 */
const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

/**
 * Check if date1 is exactly one day before date2 (consecutive days)
 */
const isConsecutiveDay = (lastDate: Date, currentDate: Date): boolean => {
  // Create date objects at midnight for comparison
  const last = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());
  const current = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
  
  // Calculate difference in days
  const diffTime = current.getTime() - last.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays === 1;
};

/**
 * Calculate reward based on current week
 * Week 1: 1 coin, Week 2: 2 coins, Week 3: 4 coins, Week 4: 8 coins, etc.
 */
const calculateReward = (week: number): number => {
  return Math.pow(2, week - 1); // 1, 2, 4, 8, 16...
};

/**
 * Get user's streak information without claiming
 */
export const getStreakInfo = async (userId: string): Promise<StreakInfo> => {
  try {
    const ref = doc(db, COLLECTIONS.USER_PROFILES, userId);
    const snap = await getDoc(ref);
    
    if (!snap.exists()) {
      return {
        canClaim: true,
        currentStreak: 0,
        currentWeek: 1,
        nextReward: 1,
        lastClaimDate: null,
        streakWillBreak: false,
      };
    }
    
    const data = snap.data();
    const now = new Date();
    
    // Handle Firestore Timestamp conversion
    let lastLoginDate: Date | null = null;
    if (data.lastLoginDate) {
      if (data.lastLoginDate instanceof Timestamp) {
        lastLoginDate = data.lastLoginDate.toDate();
      } else if (data.lastLoginDate.toDate) {
        lastLoginDate = data.lastLoginDate.toDate();
      } else if (data.lastLoginDate instanceof Date) {
        lastLoginDate = data.lastLoginDate;
      }
    }
    
    const currentStreak = data.currentStreak ?? 0;
    const currentWeek = data.currentWeek ?? 1;
    
    // Check if already claimed today
    if (lastLoginDate && isSameDay(lastLoginDate, now)) {
      return {
        canClaim: false,
        currentStreak,
        currentWeek,
        nextReward: calculateReward(currentWeek),
        lastClaimDate: lastLoginDate,
        streakWillBreak: false,
      };
    }
    
    // Check if streak will be broken (more than 1 day since last claim)
    let streakWillBreak = false;
    let nextWeek = currentWeek;
    let nextStreak = currentStreak;
    
    if (lastLoginDate) {
      const isConsecutive = isConsecutiveDay(lastLoginDate, now);
      if (!isConsecutive) {
        streakWillBreak = true;
        nextWeek = 1;
        nextStreak = 0;
      }
    }
    
    return {
      canClaim: true,
      currentStreak: nextStreak,
      currentWeek: nextWeek,
      nextReward: calculateReward(nextWeek),
      lastClaimDate: lastLoginDate,
      streakWillBreak,
    };
  } catch (error) {
    logger.error('Error getting streak info:', error);
    return {
      canClaim: false,
      currentStreak: 0,
      currentWeek: 1,
      nextReward: 1,
      lastClaimDate: null,
      streakWillBreak: false,
    };
  }
};

/**
 * Claim daily reward - updates streak and adds coins
 */
export const claimDailyReward = async (userId: string): Promise<DailyRewardResult> => {
  try {
    const ref = doc(db, COLLECTIONS.USER_PROFILES, userId);
    let snap = await getDoc(ref);
    
    // If profile doesn't exist, create it with default values
    if (!snap.exists()) {
      logger.log('Creating user profile for daily reward:', userId);
      await setDoc(ref, {
        createdAt: serverTimestamp(),
        coins: 0,
        currentStreak: 0,
        currentWeek: 1,
      }, { merge: true });
      
      // Re-fetch after creation
      snap = await getDoc(ref);
    }
    
    const data = snap.data() || {};
    const now = new Date();
    
    // Handle Firestore Timestamp conversion
    let lastLoginDate: Date | null = null;
    if (data.lastLoginDate) {
      if (data.lastLoginDate instanceof Timestamp) {
        lastLoginDate = data.lastLoginDate.toDate();
      } else if (data.lastLoginDate.toDate) {
        lastLoginDate = data.lastLoginDate.toDate();
      } else if (data.lastLoginDate instanceof Date) {
        lastLoginDate = data.lastLoginDate;
      }
    }
    
    // Check if already claimed today
    if (lastLoginDate && isSameDay(lastLoginDate, now)) {
      logger.log('Daily reward already claimed today');
      return {
        success: false,
        alreadyClaimed: true,
        reward: 0,
        currentStreak: data.currentStreak ?? 1,
        currentWeek: data.currentWeek ?? 1,
        streakBroken: false,
        message: 'You already claimed your daily reward today!',
      };
    }
    
    let currentStreak = data.currentStreak ?? 0;
    let currentWeek = data.currentWeek ?? 1;
    let streakBroken = false;
    
    // Check if this is a consecutive login
    if (lastLoginDate) {
      const isConsecutive = isConsecutiveDay(lastLoginDate, now);
      
      if (isConsecutive) {
        // Continue streak
        currentStreak++;
        
        // After 7 days, move to next week
        if (currentStreak > 7) {
          currentStreak = 1;
          currentWeek++;
          logger.log(`🎉 Week ${currentWeek} started! Rewards doubled!`);
        }
      } else {
        // Streak broken - reset
        streakBroken = currentStreak > 0 || currentWeek > 1;
        currentStreak = 1;
        currentWeek = 1;
        logger.log('😢 Streak broken, resetting to Week 1');
      }
    } else {
      // First time claiming
      currentStreak = 1;
      currentWeek = 1;
    }
    
    // Calculate reward
    const reward = calculateReward(currentWeek);
    const currentCoins = data.coins ?? 0;
    const newCoins = currentCoins + reward;
    
    // Update user profile
    await updateDoc(ref, {
      lastLoginDate: serverTimestamp(),
      currentStreak,
      currentWeek,
      coins: newCoins,
    });
    
    logger.log(`✅ Daily reward claimed: +${reward} coins (Week ${currentWeek}, Day ${currentStreak})`);
    
    // Update daily streak mission progress
    try {
      await missionService.updateDailyStreak(userId, currentStreak);
    } catch (missionError) {
      logger.error('Error updating daily streak mission:', missionError);
      // Don't fail the reward claim if mission update fails
    }
    
    return {
      success: true,
      alreadyClaimed: false,
      reward,
      currentStreak,
      currentWeek,
      streakBroken,
      message: streakBroken 
        ? `Streak reset! You earned ${reward} coin${reward > 1 ? 's' : ''}.`
        : `Day ${currentStreak} of Week ${currentWeek}! You earned ${reward} coin${reward > 1 ? 's' : ''}.`,
    };
  } catch (error) {
    logger.error('Error claiming daily reward:', error);
    return {
      success: false,
      alreadyClaimed: false,
      reward: 0,
      currentStreak: 0,
      currentWeek: 1,
      streakBroken: false,
      message: 'Failed to claim daily reward. Please try again.',
    };
  }
};

export default {
  getStreakInfo,
  claimDailyReward,
};
