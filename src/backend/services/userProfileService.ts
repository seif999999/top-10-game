import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { User } from '../../shared/types';
import { logger } from '../utils/logger';
import { AppError } from '../../shared/errors';
import { COLLECTIONS } from '../utils/constants';

/**
 * Service for managing user profile data in Firestore
 * Handles avatar selection and other profile customizations
 */
export class UserProfileService {
  private static instance: UserProfileService | null = null;

  private constructor() {}

  /**
   * Get the singleton instance
   */
  public static getInstance(): UserProfileService {
    if (!UserProfileService.instance) {
      UserProfileService.instance = new UserProfileService();
    }
    return UserProfileService.instance;
  }

  /**
   * Get user profile data from Firestore
   * ✅ SECURITY: Validates userId matches authenticated user (defense-in-depth)
   */
  public async getUserProfile(userId: string): Promise<User | null> {
    try {
      if (!userId || typeof userId !== 'string') {
        logger.error('❌ UserProfileService: Invalid userId provided');
        throw new AppError({
          code: 'USER_PROFILE_INVALID_ID',
          message: 'UserId missing from session. Ensure session stores Firebase UID.',
          userMessage: 'User session is invalid. Please sign in again.'
        });
      }
      
      // ✅ SECURITY: Validate userId matches authenticated user (defense-in-depth)
      const { auth } = await import('./firebase');
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        throw new AppError({
          code: 'AUTH_REQUIRED',
          message: 'User must be authenticated to access profile',
          userMessage: 'Please sign in to access your profile.'
        });
      }
      
      if (currentUser.uid !== userId) {
        logger.error('❌ SECURITY: Unauthorized profile access attempt', {
          authenticatedUserId: currentUser.uid,
          requestedUserId: userId
        });
        throw new AppError({
          code: 'UNAUTHORIZED_ACCESS',
          message: 'Users can only access their own profile',
          userMessage: 'You can only access your own profile.'
        });
      }
      
      const userRef = doc(db, COLLECTIONS.USER_PROFILES, userId);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        logger.log(`User profile not found for userId: ${userId}`);
        return null;
      }

      const userData = userSnap.data();
      return {
        id: userId,
        email: userData.email || '',
        displayName: userData.displayName || undefined,
        createdAt: userData.createdAt?.toDate(),
        stats: userData.stats,
        selectedAvatar: userData.selectedAvatar,
        avatarUrl: userData.avatarUrl,
        coins: userData.coins ?? 0, // Default to 0 if not set
        adFree: userData.adFree ?? false,
        premiumType: userData.premiumType,
        premiumExpiresAt: userData.premiumExpiresAt,
        premiumPurchasedAt: userData.premiumPurchasedAt,
        dailyRewardMultiplier: userData.dailyRewardMultiplier ?? 1,
        hasVIPBadge: userData.hasVIPBadge ?? false,
        // Daily streak fields
        lastLoginDate: userData.lastLoginDate?.toDate(),
        currentStreak: userData.currentStreak ?? 0,
        currentWeek: userData.currentWeek ?? 1,
      } as User;
    } catch (error) {
      logger.error('Error getting user profile:', error);
      throw error;
    }
  }

  /**
   * Create or update user profile in Firestore
   * ✅ SECURITY: Validates user.id matches authenticated user (defense-in-depth)
   */
  public async updateUserProfile(user: User): Promise<void> {
    try {
      // ✅ SECURITY: Validate user.id matches authenticated user (defense-in-depth)
      const { auth } = await import('./firebase');
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        throw new AppError({
          code: 'AUTH_REQUIRED',
          message: 'User must be authenticated to update profile',
          userMessage: 'Please sign in to update your profile.'
        });
      }
      
      if (currentUser.uid !== user.id) {
        logger.error('❌ SECURITY: Unauthorized profile update attempt', {
          authenticatedUserId: currentUser.uid,
          requestedUserId: user.id
        });
        throw new AppError({
          code: 'UNAUTHORIZED_UPDATE',
          message: 'Users can only update their own profile',
          userMessage: 'You can only update your own profile.'
        });
      }
      
      const userRef = doc(db, COLLECTIONS.USER_PROFILES, user.id);
      
      const profileData = {
        email: user.email,
        displayName: user.displayName,
        createdAt: user.createdAt ? user.createdAt : serverTimestamp(),
        stats: user.stats,
        selectedAvatar: user.selectedAvatar,
        avatarUrl: user.avatarUrl,
        coins: user.coins ?? 0, // Include coins in profile data
        adFree: user.adFree ?? false,
        premiumType: user.premiumType,
        premiumExpiresAt: user.premiumExpiresAt,
        premiumPurchasedAt: user.premiumPurchasedAt,
        dailyRewardMultiplier: user.dailyRewardMultiplier ?? 1,
        hasVIPBadge: user.hasVIPBadge ?? false,
        lastUpdated: serverTimestamp(),
      };

      // Remove undefined values for Firestore compatibility
      const sanitizedData = Object.fromEntries(
        Object.entries(profileData).filter(([_, value]) => value !== undefined)
      );

      await setDoc(userRef, sanitizedData, { merge: true });
      logger.log(`User profile updated for userId: ${user.id}`);
    } catch (error) {
      logger.error('Error updating user profile:', error);
      throw error;
    }
  }

  /**
   * Update only avatar selection
   * ✅ SECURITY: Validates userId matches authenticated user (defense-in-depth)
   */
  public async updateUserAvatar(userId: string, selectedAvatar: string | undefined): Promise<void> {
    try {
      const { auth } = await import('./firebase');
      const currentUser = auth.currentUser;
      if (!currentUser || currentUser.uid !== userId) {
        logger.error('UserProfileService: Unauthorized updateUserAvatar', { requested: userId, auth: currentUser?.uid });
        throw new AppError({
          code: 'UNAUTHORIZED_UPDATE',
          message: 'Users can only update their own profile',
          userMessage: 'You can only update your own profile.',
        });
      }
      const userRef = doc(db, COLLECTIONS.USER_PROFILES, userId);
      
      const updateData: Record<string, unknown> = {
        selectedAvatar: selectedAvatar,
        lastUpdated: serverTimestamp(),
      };

      // If no avatar selected, clear the avatarUrl as well
      if (!selectedAvatar) {
        updateData.avatarUrl = null;
      }

      // Use setDoc with merge: true to create document if it doesn't exist
      await setDoc(userRef, updateData, { merge: true });
      logger.log(`User avatar updated for userId: ${userId}, avatar: ${selectedAvatar}`);
    } catch (error) {
      logger.error('Error updating user avatar:', error);
      throw error;
    }
  }

  /**
   * Set premium subscription status (Option 1: Subscription model)
   * Monthly 60 EGP, Quarterly 150 EGP, Yearly 500 EGP
   */
  public async setPremiumStatus(
    userId: string,
    type: 'monthly' | 'quarterly' | 'yearly'
  ): Promise<void> {
    try {
      const { auth } = await import('./firebase');
      const currentUser = auth.currentUser;
      if (!currentUser || currentUser.uid !== userId) {
        throw new AppError({
          code: 'UNAUTHORIZED_UPDATE',
          message: 'Users can only update their own profile',
          userMessage: 'You can only update your own profile.',
        });
      }
      const now = Date.now();
      let expiresAt: number;
      if (type === 'monthly') {
        expiresAt = now + 30 * 24 * 60 * 60 * 1000;
      } else if (type === 'quarterly') {
        expiresAt = now + 90 * 24 * 60 * 60 * 1000;
      } else {
        expiresAt = now + 365 * 24 * 60 * 60 * 1000;
      }
      const userRef = doc(db, COLLECTIONS.USER_PROFILES, userId);
      await updateDoc(userRef, {
        premiumType: type,
        premiumExpiresAt: expiresAt,
        premiumPurchasedAt: now,
        dailyRewardMultiplier: 2,
        hasVIPBadge: true,
        lastUpdated: serverTimestamp(),
      });
      logger.log(`Premium status set for ${userId}, type: ${type}, expiresAt: ${new Date(expiresAt).toISOString()}`);
    } catch (error) {
      logger.error('Error setting premium status:', error);
      throw error;
    }
  }

  /**
   * Check if premium subscription is still active. Returns false if expired.
   */
  public async checkPremiumExpiration(userId: string): Promise<boolean> {
    const profile = await this.getUserProfile(userId);
    if (!profile) return false;
    if (profile.adFree) return true; // Legacy coin purchase
    if (!profile.premiumType || !profile.premiumExpiresAt) return false;
    if (Date.now() > profile.premiumExpiresAt) {
      const userRef = doc(db, COLLECTIONS.USER_PROFILES, userId);
      await updateDoc(userRef, {
        premiumType: null,
        premiumExpiresAt: null,
        premiumPurchasedAt: null,
        dailyRewardMultiplier: 1,
        hasVIPBadge: false,
        lastUpdated: serverTimestamp(),
      });
      logger.log(`Premium expired for ${userId}`);
      return false;
    }
    return true;
  }

  /**
   * Grant bonus perks on premium purchase: +500 coins
   */
  public async grantPremiumBonuses(userId: string): Promise<void> {
    const { CoinService } = await import('./CoinService');
    await CoinService.getInstance().addCoins(userId, 500, 'Premium purchase bonus');
    logger.log(`Premium bonuses granted for ${userId}`);
  }

  /**
   * Update ad-free status (e.g. after coin purchase - legacy)
   */
  public async updateAdFree(userId: string, adFree: boolean): Promise<void> {
    try {
      const { auth } = await import('./firebase');
      const currentUser = auth.currentUser;
      if (!currentUser || currentUser.uid !== userId) {
        throw new AppError({
          code: 'UNAUTHORIZED_UPDATE',
          message: 'Users can only update their own profile',
          userMessage: 'You can only update your own profile.',
        });
      }
      const userRef = doc(db, COLLECTIONS.USER_PROFILES, userId);
      await updateDoc(userRef, { adFree, lastUpdated: serverTimestamp() });
      logger.log(`User ad-free updated for userId: ${userId}, adFree: ${adFree}`);
    } catch (error) {
      logger.error('Error updating ad-free status:', error);
      throw error;
    }
  }

  /**
   * Update avatar URL (for caching)
   * ✅ SECURITY: Validates userId matches authenticated user (defense-in-depth)
   */
  public async updateAvatarUrl(userId: string, avatarUrl: string | null): Promise<void> {
    try {
      const { auth } = await import('./firebase');
      const currentUser = auth.currentUser;
      if (!currentUser || currentUser.uid !== userId) {
        logger.error('UserProfileService: Unauthorized updateAvatarUrl', { requested: userId, auth: currentUser?.uid });
        throw new AppError({
          code: 'UNAUTHORIZED_UPDATE',
          message: 'Users can only update their own profile',
          userMessage: 'You can only update your own profile.',
        });
      }
      const userRef = doc(db, COLLECTIONS.USER_PROFILES, userId);
      
      await updateDoc(userRef, {
        avatarUrl: avatarUrl,
        lastUpdated: serverTimestamp(),
      });
      
      logger.log(`Avatar URL updated for userId: ${userId}`);
    } catch (error) {
      logger.error('Error updating avatar URL:', error);
      throw error;
    }
  }

  /**
   * Check if user profile exists
   */
  public async userProfileExists(userId: string): Promise<boolean> {
    try {
      const userRef = doc(db, COLLECTIONS.USER_PROFILES, userId);
      const userSnap = await getDoc(userRef);
      return userSnap.exists();
    } catch (error) {
      logger.error('Error checking user profile existence:', error);
      return false;
    }
  }
}

// Export singleton instance
export default UserProfileService.getInstance();
