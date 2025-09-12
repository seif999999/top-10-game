import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const DISPLAY_NAME_STORAGE_KEY = 'user_display_name';

/**
 * Local Display Name Storage Service
 * Handles display name persistence independently of server authentication
 */
export class LocalDisplayNameStorage {
  private static instance: LocalDisplayNameStorage | null = null;

  private constructor() {}

  public static getInstance(): LocalDisplayNameStorage {
    if (!LocalDisplayNameStorage.instance) {
      LocalDisplayNameStorage.instance = new LocalDisplayNameStorage();
    }
    return LocalDisplayNameStorage.instance;
  }

  /**
   * Save display name locally
   */
  public async saveDisplayName(displayName: string): Promise<void> {
    try {
      console.log('💾 LocalDisplayNameStorage: Saving display name locally:', displayName);
      
      const displayNameData = {
        displayName,
        timestamp: Date.now()
      };

      const storage = Platform.OS === 'web' ? localStorage : AsyncStorage;
      await storage.setItem(DISPLAY_NAME_STORAGE_KEY, JSON.stringify(displayNameData));
      
      console.log('✅ LocalDisplayNameStorage: Display name saved successfully');
    } catch (error) {
      console.error('❌ LocalDisplayNameStorage: Error saving display name:', error);
      throw new Error('Failed to save display name locally');
    }
  }

  /**
   * Get stored display name
   */
  public async getDisplayName(): Promise<string | null> {
    try {
      console.log('🔍 LocalDisplayNameStorage: Retrieving display name...');
      
      const storage = Platform.OS === 'web' ? localStorage : AsyncStorage;
      const storedData = await storage.getItem(DISPLAY_NAME_STORAGE_KEY);
      
      if (storedData) {
        const displayNameData = JSON.parse(storedData);
        console.log('✅ LocalDisplayNameStorage: Found stored display name:', displayNameData.displayName);
        return displayNameData.displayName;
      }
      
      console.log('ℹ️ LocalDisplayNameStorage: No stored display name found');
      return null;
    } catch (error) {
      console.error('❌ LocalDisplayNameStorage: Error retrieving display name:', error);
      return null;
    }
  }

  /**
   * Clear stored display name
   */
  public async clearDisplayName(): Promise<void> {
    try {
      console.log('🗑️ LocalDisplayNameStorage: Clearing display name...');
      
      const storage = Platform.OS === 'web' ? localStorage : AsyncStorage;
      await storage.removeItem(DISPLAY_NAME_STORAGE_KEY);
      
      console.log('✅ LocalDisplayNameStorage: Display name cleared successfully');
    } catch (error) {
      console.error('❌ LocalDisplayNameStorage: Error clearing display name:', error);
    }
  }
}

export default LocalDisplayNameStorage;

