import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { logger } from '../utils/logger';

export interface PrivacyPolicyAcceptance {
  userId: string;
  acceptedAt: Date;
  version: string;
  ipAddress?: string;
  userAgent?: string;
  deviceInfo?: {
    platform: string;
    version: string;
    model?: string;
  };
}

export interface PrivacyPolicyVersion {
  version: string;
  effectiveDate: Date;
  lastUpdated: Date;
  changes: string[];
}

class PrivacyPolicyService {
  private static readonly STORAGE_KEY = 'privacy_policy_accepted';
  private static readonly CURRENT_VERSION = '1.0.0';
  private static readonly COLLECTION_NAME = 'privacyPolicyAcceptances';

  /**
   * Check if user has accepted the current privacy policy version
   */
  static async hasAcceptedCurrentVersion(userId?: string): Promise<boolean> {
    try {
      if (userId) {
        // Check in Firestore for logged-in users
        const docRef = doc(db, this.COLLECTION_NAME, userId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          return data.version === this.CURRENT_VERSION;
        }
      } else {
        // Check in local storage for anonymous users
        const accepted = await AsyncStorage.getItem(this.STORAGE_KEY);
        if (accepted) {
          try {
            const data = JSON.parse(accepted);
            return data.version === this.CURRENT_VERSION;
          } catch (parseError) {
            logger.error('❌ Error parsing privacy policy acceptance data, clearing corrupted data:', parseError);
            // Clear corrupted data
            await AsyncStorage.removeItem(this.STORAGE_KEY);
            return false;
          }
        }
      }
      
      return false;
    } catch (error) {
      logger.error('Error checking privacy policy acceptance:', error);
      return false;
    }
  }

  /**
   * Record privacy policy acceptance
   */
  static async recordAcceptance(
    userId: string,
    metadata?: {
      ipAddress?: string;
      userAgent?: string;
      deviceInfo?: {
        platform: string;
        version: string;
        model?: string;
      };
    }
  ): Promise<void> {
    try {
      const acceptance: PrivacyPolicyAcceptance = {
        userId,
        acceptedAt: new Date(),
        version: this.CURRENT_VERSION,
        ipAddress: metadata?.ipAddress,
        userAgent: metadata?.userAgent,
        deviceInfo: metadata?.deviceInfo,
      };

      // Store in Firestore for logged-in users
      const docRef = doc(db, this.COLLECTION_NAME, userId);
      await setDoc(docRef, {
        ...acceptance,
        acceptedAt: serverTimestamp(),
      });

      // Also store locally for offline access
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(acceptance));

      logger.log('Privacy policy acceptance recorded for user:', userId);
    } catch (error) {
      logger.error('Error recording privacy policy acceptance:', error);
      throw new Error('Failed to record privacy policy acceptance');
    }
  }

  /**
   * Record acceptance for anonymous users
   */
  static async recordAnonymousAcceptance(
    metadata?: {
      ipAddress?: string;
      userAgent?: string;
      deviceInfo?: {
        platform: string;
        version: string;
        model?: string;
      };
    }
  ): Promise<void> {
    try {
      const acceptance: PrivacyPolicyAcceptance = {
        userId: 'anonymous',
        acceptedAt: new Date(),
        version: this.CURRENT_VERSION,
        ipAddress: metadata?.ipAddress,
        userAgent: metadata?.userAgent,
        deviceInfo: metadata?.deviceInfo,
      };

      // Store locally for anonymous users
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(acceptance));

      logger.log('Privacy policy acceptance recorded for anonymous user');
    } catch (error) {
      logger.error('Error recording anonymous privacy policy acceptance:', error);
      throw new Error('Failed to record privacy policy acceptance');
    }
  }

  /**
   * Get current privacy policy version
   */
  static getCurrentVersion(): string {
    return this.CURRENT_VERSION;
  }

  /**
   * Get privacy policy version history
   */
  static getVersionHistory(): PrivacyPolicyVersion[] {
    return [
      {
        version: '1.0.0',
        effectiveDate: new Date('2024-01-01'),
        lastUpdated: new Date('2024-01-01'),
        changes: [
          'Initial privacy policy implementation',
          'Data collection and usage policies',
          'User rights and data retention policies',
          'Security measures and third-party services',
        ],
      },
    ];
  }

  /**
   * Check if privacy policy needs to be re-accepted
   */
  static async needsReAcceptance(userId?: string): Promise<boolean> {
    try {
      const hasAccepted = await this.hasAcceptedCurrentVersion(userId);
      return !hasAccepted;
    } catch (error) {
      logger.error('Error checking if re-acceptance needed:', error);
      return true; // Default to requiring acceptance on error
    }
  }

  /**
   * Revoke privacy policy acceptance (for account deletion)
   */
  static async revokeAcceptance(userId: string): Promise<void> {
    try {
      // Remove from Firestore
      const docRef = doc(db, this.COLLECTION_NAME, userId);
      await setDoc(docRef, {
        revoked: true,
        revokedAt: serverTimestamp(),
        version: this.CURRENT_VERSION,
      });

      // Remove from local storage
      await AsyncStorage.removeItem(this.STORAGE_KEY);

      logger.log('Privacy policy acceptance revoked for user:', userId);
    } catch (error) {
      logger.error('Error revoking privacy policy acceptance:', error);
      throw new Error('Failed to revoke privacy policy acceptance');
    }
  }

  /**
   * Get acceptance statistics (admin function)
   */
  static async getAcceptanceStats(): Promise<{
    totalAcceptances: number;
    currentVersionAcceptances: number;
    anonymousAcceptances: number;
  }> {
    try {
      // This would require a more complex Firestore query in production
      // For now, return basic stats
      return {
        totalAcceptances: 0,
        currentVersionAcceptances: 0,
        anonymousAcceptances: 0,
      };
    } catch (error) {
      logger.error('Error getting acceptance stats:', error);
      return {
        totalAcceptances: 0,
        currentVersionAcceptances: 0,
        anonymousAcceptances: 0,
      };
    }
  }

  /**
   * Export user's privacy policy acceptance data
   */
  static async exportUserData(userId: string): Promise<PrivacyPolicyAcceptance | null> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          userId: data.userId,
          acceptedAt: data.acceptedAt?.toDate() || new Date(),
          version: data.version,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          deviceInfo: data.deviceInfo,
        };
      }
      
      return null;
    } catch (error) {
      logger.error('Error exporting user privacy policy data:', error);
      return null;
    }
  }

  /**
   * Validate privacy policy acceptance for compliance
   */
  static async validateAcceptance(userId: string): Promise<{
    valid: boolean;
    version: string;
    acceptedAt: Date | null;
    needsUpdate: boolean;
  }> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        const acceptedAt = data.acceptedAt?.toDate() || null;
        const version = data.version || 'unknown';
        const needsUpdate = version !== this.CURRENT_VERSION;
        
        return {
          valid: !needsUpdate && acceptedAt !== null,
          version,
          acceptedAt,
          needsUpdate,
        };
      }
      
      return {
        valid: false,
        version: 'none',
        acceptedAt: null,
        needsUpdate: true,
      };
    } catch (error) {
      logger.error('Error validating privacy policy acceptance:', error);
      return {
        valid: false,
        version: 'error',
        acceptedAt: null,
        needsUpdate: true,
      };
    }
  }
}

export default PrivacyPolicyService;
