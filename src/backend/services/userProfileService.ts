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
      logger.log('🔍 UserProfileService: Getting user profile for userId:', userId);
      logger.log('🔍 UserProfileService: userId type:', typeof userId);
      logger.log('🔍 UserProfileService: userId length:', userId ? userId.length : 'undefined');
      
      if (!userId || typeof userId !== 'string') {
        logger.error('❌ UserProfileService: Invalid userId provided:', userId);
        logger.error('❌ UserProfileService: userId type:', typeof userId);
        logger.error('❌ UserProfileService: userId length:', userId ? userId.length : 'undefined');
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
   */
  public async updateUserAvatar(userId: string, selectedAvatar: string | undefined): Promise<void> {
    try {
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
   * Update avatar URL (for caching)
   */
  public async updateAvatarUrl(userId: string, avatarUrl: string | null): Promise<void> {
    try {
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
