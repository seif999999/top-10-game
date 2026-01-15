import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { logger } from '../utils/logger';

const AVATAR_STORAGE_KEY = 'user_selected_avatar';

/**
 * Local Avatar Storage Service
 * Handles avatar persistence independently of server authentication
 */
export class LocalAvatarStorage {
  private static instance: LocalAvatarStorage | null = null;

  private constructor() {}

  public static getInstance(): LocalAvatarStorage {
    if (!LocalAvatarStorage.instance) {
      LocalAvatarStorage.instance = new LocalAvatarStorage();
    }
    return LocalAvatarStorage.instance;
  }

  /**
   * Save selected avatar locally
   */
  public async saveSelectedAvatar(avatarId: string): Promise<void> {
    try {
      logger.log('💾 LocalAvatarStorage: Saving avatar locally:', avatarId);
      
      const avatarData = {
        avatarId,
        timestamp: Date.now(),
        userId: 'current_user' // We'll update this with actual user ID when available
      };

      if (Platform.OS === 'web') {
        localStorage.setItem(AVATAR_STORAGE_KEY, JSON.stringify(avatarData));
        logger.log('✅ LocalAvatarStorage: Avatar saved to localStorage');
      } else {
        await AsyncStorage.setItem(AVATAR_STORAGE_KEY, JSON.stringify(avatarData));
        logger.log('✅ LocalAvatarStorage: Avatar saved to AsyncStorage');
      }
    } catch (error) {
      logger.error('❌ LocalAvatarStorage: Error saving avatar:', error);
      throw error;
    }
  }

  /**
   * Get selected avatar from local storage
   */
  public async getSelectedAvatar(): Promise<string | null> {
    try {
      logger.log('🔍 LocalAvatarStorage: Retrieving avatar from local storage...');
      
      let avatarData: string | null = null;
      
      if (Platform.OS === 'web') {
        avatarData = localStorage.getItem(AVATAR_STORAGE_KEY);
      } else {
        avatarData = await AsyncStorage.getItem(AVATAR_STORAGE_KEY);
      }

      if (!avatarData) {
        logger.log('🚪 LocalAvatarStorage: No avatar found in local storage');
        return null;
      }

      const parsed = JSON.parse(avatarData);
      
      // Check if avatar data is not too old (30 days)
      const avatarAge = Date.now() - parsed.timestamp;
      const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
      
      if (avatarAge > maxAge) {
        logger.log('⏰ LocalAvatarStorage: Stored avatar is too old, clearing...');
        await this.clearSelectedAvatar();
        return null;
      }

      logger.log('✅ LocalAvatarStorage: Avatar retrieved from local storage:', parsed.avatarId);
      return parsed.avatarId;
    } catch (error) {
      logger.error('❌ LocalAvatarStorage: Error retrieving avatar:', error);
      return null;
    }
  }

  /**
   * Clear selected avatar from local storage
   */
  public async clearSelectedAvatar(): Promise<void> {
    try {
      logger.log('🧹 LocalAvatarStorage: Clearing avatar from local storage...');
      
      if (Platform.OS === 'web') {
        localStorage.removeItem(AVATAR_STORAGE_KEY);
      } else {
        await AsyncStorage.removeItem(AVATAR_STORAGE_KEY);
      }
      
      logger.log('✅ LocalAvatarStorage: Avatar cleared from local storage');
    } catch (error) {
      logger.error('❌ LocalAvatarStorage: Error clearing avatar:', error);
    }
  }

  /**
   * Update user ID in stored avatar data
   */
  public async updateUserId(userId: string): Promise<void> {
    try {
      const avatarData = await this.getSelectedAvatar();
      if (avatarData) {
        const data = {
          avatarId: avatarData,
          timestamp: Date.now(),
          userId
        };

        if (Platform.OS === 'web') {
          localStorage.setItem(AVATAR_STORAGE_KEY, JSON.stringify(data));
        } else {
          await AsyncStorage.setItem(AVATAR_STORAGE_KEY, JSON.stringify(data));
        }
        
        logger.log('✅ LocalAvatarStorage: User ID updated in stored avatar data');
      }
    } catch (error) {
      logger.error('❌ LocalAvatarStorage: Error updating user ID:', error);
    }
  }
}

export default LocalAvatarStorage;
