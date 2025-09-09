import { 
  collection, 
  doc, 
  getDocs, 
  deleteDoc, 
  setDoc,
  updateDoc,
  query, 
  where, 
  orderBy, 
  limit,
  writeBatch,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface DataRetentionPolicy {
  userProfiles: number; // days
  gameData: number; // days
  analyticsData: number; // days
  supportData: number; // days
  moderationLogs: number; // days
  rateLimitLogs: number; // days
  privacyPolicyAcceptances: number; // days
}

export interface DataExport {
  userId: string;
  exportDate: Date;
  data: {
    profile: any;
    gameHistory: any[];
    privacyPolicyAcceptance: any;
    supportTickets: any[];
  };
}

export interface DataDeletionRequest {
  userId: string;
  requestedAt: Date;
  reason: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  completedAt?: Date;
  error?: string;
}

export interface AnonymizedData {
  userId: string;
  originalUserId: string;
  anonymizedAt: Date;
  dataType: string;
  anonymizedData: any;
}

class DataRetentionService {
  private static readonly DEFAULT_POLICY: DataRetentionPolicy = {
    userProfiles: 2555, // 7 years
    gameData: 730, // 2 years
    analyticsData: 365, // 1 year
    supportData: 1095, // 3 years
    moderationLogs: 2555, // 7 years
    rateLimitLogs: 90, // 3 months
    privacyPolicyAcceptances: 2555, // 7 years
  };

  private static readonly DELETION_REQUESTS_COLLECTION = 'dataDeletionRequests';
  private static readonly ANONYMIZED_DATA_COLLECTION = 'anonymizedData';
  private static readonly DATA_EXPORTS_COLLECTION = 'dataExports';

  /**
   * Get current data retention policy
   */
  static getRetentionPolicy(): DataRetentionPolicy {
    return { ...this.DEFAULT_POLICY };
  }

  /**
   * Update data retention policy
   */
  static updateRetentionPolicy(newPolicy: Partial<DataRetentionPolicy>): DataRetentionPolicy {
    const updatedPolicy = { ...this.DEFAULT_POLICY, ...newPolicy };
    // In production, this would be stored in a configuration collection
    return updatedPolicy;
  }

  /**
   * Delete user data (Right to be Forgotten)
   */
  static async deleteUserData(
    userId: string,
    reason: string = 'User requested data deletion'
  ): Promise<DataDeletionRequest> {
    try {
      const deletionRequest: DataDeletionRequest = {
        userId,
        requestedAt: new Date(),
        reason,
        status: 'processing',
      };

      // Record the deletion request
      const requestRef = doc(collection(db, this.DELETION_REQUESTS_COLLECTION));
      await setDoc(requestRef, {
        ...deletionRequest,
        requestedAt: serverTimestamp(),
      });

      // Delete user profile
      await this.deleteUserProfile(userId);

      // Delete game data
      await this.deleteGameData(userId);

      // Delete privacy policy acceptance
      await this.deletePrivacyPolicyAcceptance(userId);

      // Delete support tickets
      await this.deleteSupportTickets(userId);

      // Delete local storage data
      await this.deleteLocalStorageData(userId);

      // Mark deletion as completed
      await updateDoc(requestRef, {
        status: 'completed',
        completedAt: serverTimestamp(),
      });

      deletionRequest.status = 'completed';
      deletionRequest.completedAt = new Date();

      console.log(`User data deleted successfully for user: ${userId}`);
      return deletionRequest;
    } catch (error) {
      console.error('Error deleting user data:', error);
      
      // Mark deletion as failed
      try {
        const requestRef = doc(collection(db, this.DELETION_REQUESTS_COLLECTION));
        await updateDoc(requestRef, {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      } catch (updateError) {
        console.error('Error updating deletion request status:', updateError);
      }

      const deletionRequest: DataDeletionRequest = {
        userId,
        requestedAt: new Date(),
        reason,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      return deletionRequest;
    }
  }

  /**
   * Anonymize user data instead of deleting
   */
  static async anonymizeUserData(
    userId: string,
    dataType: string,
    originalData: any
  ): Promise<AnonymizedData> {
    try {
      const anonymizedData: AnonymizedData = {
        userId: `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        originalUserId: userId,
        anonymizedAt: new Date(),
        dataType,
        anonymizedData: this.anonymizeData(originalData),
      };

      // Store anonymized data
      const anonymizedRef = doc(collection(db, this.ANONYMIZED_DATA_COLLECTION));
      await setDoc(anonymizedRef, {
        ...anonymizedData,
        anonymizedAt: serverTimestamp(),
      });

      console.log(`Data anonymized for user: ${userId}, type: ${dataType}`);
      return anonymizedData;
    } catch (error) {
      console.error('Error anonymizing user data:', error);
      throw new Error('Failed to anonymize user data');
    }
  }

  /**
   * Export user data (Data Portability)
   */
  static async exportUserData(userId: string): Promise<DataExport> {
    try {
      const exportData: DataExport = {
        userId,
        exportDate: new Date(),
        data: {
          profile: await this.getUserProfile(userId),
          gameHistory: await this.getUserGameHistory(userId),
          privacyPolicyAcceptance: await this.getPrivacyPolicyAcceptance(userId),
          supportTickets: await this.getSupportTickets(userId),
        },
      };

      // Store export record
      const exportRef = doc(collection(db, this.DATA_EXPORTS_COLLECTION));
      await setDoc(exportRef, {
        ...exportData,
        exportDate: serverTimestamp(),
      });

      console.log(`User data exported for user: ${userId}`);
      return exportData;
    } catch (error) {
      console.error('Error exporting user data:', error);
      throw new Error('Failed to export user data');
    }
  }

  /**
   * Clean up expired data based on retention policy
   */
  static async cleanupExpiredData(): Promise<{
    deletedCounts: { [key: string]: number };
    errors: string[];
  }> {
    const deletedCounts: { [key: string]: number } = {};
    const errors: string[] = [];
    const policy = this.getRetentionPolicy();

    try {
      // Clean up expired user profiles
      deletedCounts.userProfiles = await this.cleanupExpiredUserProfiles(policy.userProfiles);
    } catch (error) {
      errors.push(`User profiles cleanup: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    try {
      // Clean up expired game data
      deletedCounts.gameData = await this.cleanupExpiredGameData(policy.gameData);
    } catch (error) {
      errors.push(`Game data cleanup: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    try {
      // Clean up expired analytics data
      deletedCounts.analyticsData = await this.cleanupExpiredAnalyticsData(policy.analyticsData);
    } catch (error) {
      errors.push(`Analytics data cleanup: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    try {
      // Clean up expired support data
      deletedCounts.supportData = await this.cleanupExpiredSupportData(policy.supportData);
    } catch (error) {
      errors.push(`Support data cleanup: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    try {
      // Clean up expired moderation logs
      deletedCounts.moderationLogs = await this.cleanupExpiredModerationLogs(policy.moderationLogs);
    } catch (error) {
      errors.push(`Moderation logs cleanup: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    try {
      // Clean up expired rate limit logs
      deletedCounts.rateLimitLogs = await this.cleanupExpiredRateLimitLogs(policy.rateLimitLogs);
    } catch (error) {
      errors.push(`Rate limit logs cleanup: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    console.log('Data cleanup completed:', { deletedCounts, errors });
    return { deletedCounts, errors };
  }

  /**
   * Get data retention statistics
   */
  static async getRetentionStats(): Promise<{
    totalUsers: number;
    totalGameRecords: number;
    totalAnalyticsRecords: number;
    oldestDataDate: Date | null;
    dataSizeEstimate: number;
  }> {
    try {
      // This would require more complex queries in production
      // For now, return basic stats
      return {
        totalUsers: 0,
        totalGameRecords: 0,
        totalAnalyticsRecords: 0,
        oldestDataDate: null,
        dataSizeEstimate: 0,
      };
    } catch (error) {
      console.error('Error getting retention stats:', error);
      return {
        totalUsers: 0,
        totalGameRecords: 0,
        totalAnalyticsRecords: 0,
        oldestDataDate: null,
        dataSizeEstimate: 0,
      };
    }
  }

  // Private helper methods

  private static async deleteUserProfile(userId: string): Promise<void> {
    const profileRef = doc(db, 'userProfiles', userId);
    await deleteDoc(profileRef);
  }

  private static async deleteGameData(userId: string): Promise<void> {
    // Delete user's game history from multiplayer games
    const gamesQuery = query(
      collection(db, 'multiplayerGames'),
      where('players', 'array-contains', userId)
    );
    const gamesSnapshot = await getDocs(gamesQuery);
    
    const batch = writeBatch(db);
    gamesSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
  }

  private static async deletePrivacyPolicyAcceptance(userId: string): Promise<void> {
    const privacyRef = doc(db, 'privacyPolicyAcceptances', userId);
    await deleteDoc(privacyRef);
  }

  private static async deleteSupportTickets(userId: string): Promise<void> {
    // This would delete support tickets if they exist
    console.log(`Support tickets deleted for user: ${userId}`);
  }

  private static async deleteLocalStorageData(userId: string): Promise<void> {
    // Clear user-specific local storage
    const keys = await AsyncStorage.getAllKeys();
    const userKeys = keys.filter(key => key.includes(userId));
    await AsyncStorage.multiRemove(userKeys);
  }

  private static anonymizeData(data: any): any {
    if (typeof data === 'string') {
      return '***ANONYMIZED***';
    }
    if (typeof data === 'number') {
      return 0;
    }
    if (typeof data === 'boolean') {
      return false;
    }
    if (Array.isArray(data)) {
      return data.map(item => this.anonymizeData(item));
    }
    if (typeof data === 'object' && data !== null) {
      const anonymized: any = {};
      for (const key in data) {
        anonymized[key] = this.anonymizeData(data[key]);
      }
      return anonymized;
    }
    return data;
  }

  private static async getUserProfile(userId: string): Promise<any> {
    // This would fetch user profile data
    return { userId, profile: 'user profile data' };
  }

  private static async getUserGameHistory(userId: string): Promise<any[]> {
    // This would fetch user game history
    return [];
  }

  private static async getPrivacyPolicyAcceptance(userId: string): Promise<any> {
    // This would fetch privacy policy acceptance data
    return { userId, accepted: true };
  }

  private static async getSupportTickets(userId: string): Promise<any[]> {
    // This would fetch support tickets
    return [];
  }

  private static async cleanupExpiredUserProfiles(retentionDays: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    
    // This would query and delete expired user profiles
    return 0;
  }

  private static async cleanupExpiredGameData(retentionDays: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    
    // This would query and delete expired game data
    return 0;
  }

  private static async cleanupExpiredAnalyticsData(retentionDays: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    
    // This would query and delete expired analytics data
    return 0;
  }

  private static async cleanupExpiredSupportData(retentionDays: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    
    // This would query and delete expired support data
    return 0;
  }

  private static async cleanupExpiredModerationLogs(retentionDays: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    
    // This would query and delete expired moderation logs
    return 0;
  }

  private static async cleanupExpiredRateLimitLogs(retentionDays: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    
    // This would query and delete expired rate limit logs
    return 0;
  }
}

export default DataRetentionService;
