/**
 * Session management service
 * Handles user session lifecycle including timeouts and cleanup
 */

import { Platform } from 'react-native';
import { safeJsonParse } from '../utils/safeJson';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../../shared/types';
import { logger } from '../utils/logger';
import { SECURITY_CONFIG } from './authRateLimit';

// Storage keys for auth-related data
export const AUTH_STORAGE_KEYS = {
  USER_DATA: 'auth_user_data',
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'auth_refresh_token',
  GOOGLE_TOKENS: 'auth_google_tokens',
  REMEMBER_ME: 'auth_remember_me',
  USER_SESSION: 'user_session'
};

/**
 * Session timer manager
 * Tracks active sessions and handles automatic expiration
 */
export class SessionManager {
  private sessionTimers: Map<string, NodeJS.Timeout> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private static readonly CLEANUP_INTERVAL = 3600000; // 1 hour
  
  constructor() {
    this.startPeriodicCleanup();
  }
  
  /**
   * Start periodic cleanup to prune expired sessions
   */
  private startPeriodicCleanup(): void {
    if (this.cleanupInterval) {
      return; // Already running
    }
    
    this.cleanupInterval = setInterval(() => {
      this.pruneExpiredSessions();
    }, SessionManager.CLEANUP_INTERVAL);
    
  }
  
  /**
   * Stop the periodic cleanup interval
   */
  stopPeriodicCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      logger.log('🛑 Session cleanup interval stopped');
    }
  }
  
  /**
   * Prune any sessions that may have been orphaned
   * (This is a safety measure - normally sessions auto-expire via setTimeout)
   */
  private pruneExpiredSessions(): void {
    const sessionCount = this.sessionTimers.size;
    if (sessionCount > 0) {
      logger.log(`🧹 Session cleanup check: ${sessionCount} active session(s)`);
    }
    // Note: Sessions auto-expire via their setTimeout callbacks
    // This method exists as a safeguard and for logging purposes
  }
  
  /**
   * Start a new session for a user
   */
  startSession(userId: string, onExpire: () => void): void {
    this.clearSession(userId);
    
    const timer = setTimeout(() => {
      logger.warn(`⏰ Session expired for user ${userId}`);
      onExpire();
    }, SECURITY_CONFIG.sessionTimeout);
    
    this.sessionTimers.set(userId, timer);
    logger.log(`🔐 Session started for user ${userId}`);
  }
  
  /**
   * Extend an existing session
   */
  extendSession(userId: string, onExpire: () => void): void {
    this.startSession(userId, onExpire);
    logger.log(`🔄 Session extended for user ${userId}`);
  }
  
  /**
   * Clear a user's session timer
   */
  clearSession(userId: string): void {
    const timer = this.sessionTimers.get(userId);
    if (timer) {
      clearTimeout(timer);
      this.sessionTimers.delete(userId);
      logger.log(`🚪 Session cleared for user ${userId}`);
    }
  }
  
  /**
   * Clear all session timers
   */
  clearAllSessions(): void {
    for (const [userId, timer] of this.sessionTimers.entries()) {
      clearTimeout(timer);
      logger.log(`🚪 Session cleared for user ${userId}`);
    }
    this.sessionTimers.clear();
    logger.log(`🧹 All sessions cleared`);
  }
  
  /**
   * Check if a user has an active session
   */
  hasActiveSession(userId: string): boolean {
    return this.sessionTimers.has(userId);
  }
  
  /**
   * Get the count of active sessions
   */
  getActiveSessionCount(): number {
    return this.sessionTimers.size;
  }
  
  /**
   * Cleanup all resources - call this when the service is being destroyed
   */
  cleanup(): void {
    this.stopPeriodicCleanup();
    this.clearAllSessions();
    logger.log('✅ SessionManager cleanup complete');
  }
}

// Singleton instance
export const sessionManager = new SessionManager();

/**
 * Clear all authentication-related data from storage
 */
/** Mutex to prevent race conditions when reading/writing session concurrently. */
let sessionMutex: Promise<void> = Promise.resolve();

const withSessionLock = async <T>(fn: () => Promise<T>): Promise<T> => {
  const prev = sessionMutex;
  let resolveLock: () => void;
  sessionMutex = new Promise<void>((r) => { resolveLock = r; });
  try {
    await prev;
    return await fn();
  } finally {
    resolveLock!();
  }
};

export const clearAuthStorage = async (): Promise<void> => {
  try {
    logger.log('🧹 Clearing auth storage...');
    
    const keysToRemove = Object.values(AUTH_STORAGE_KEYS);
    
    if (Platform.OS === 'web') {
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });
      logger.log(`🗑️ Removed ${keysToRemove.length} keys from localStorage`);
    } else {
      await AsyncStorage.multiRemove(keysToRemove);
      logger.log(`🗑️ Removed ${keysToRemove.length} keys from AsyncStorage`);
    }
    
    logger.log('✅ Auth storage cleared successfully');
  } catch (error) {
    logger.error('❌ Error clearing auth storage:', error);
  }
};

/**
 * Clear all user data and game progress
 */
export const clearUserData = async (): Promise<void> => {
  try {
    logger.log('🧹 Clearing user data...');
    
    if (Platform.OS === 'web') {
      const keys = Object.keys(localStorage);
      const userDataKeys = keys.filter(key => 
        key.startsWith('game_') || 
        key.startsWith('user_') || 
        key.startsWith('stats_') ||
        key.startsWith('history_')
      );
      
      userDataKeys.forEach(key => {
        localStorage.removeItem(key);
      });
      logger.log(`🗑️ Removed ${userDataKeys.length} user data keys from localStorage`);
    } else {
      const keys = await AsyncStorage.getAllKeys();
      const userDataKeys = keys.filter(key => 
        key.startsWith('game_') || 
        key.startsWith('user_') || 
        key.startsWith('stats_') ||
        key.startsWith('history_')
      );
      
      if (userDataKeys.length > 0) {
        await AsyncStorage.multiRemove(userDataKeys);
        logger.log(`🗑️ Removed ${userDataKeys.length} user data keys from AsyncStorage`);
      }
    }
    
    logger.log('✅ User data cleared successfully');
  } catch (error) {
    logger.error('❌ Error clearing user data:', error);
  }
};

/**
 * Store user session data for persistence
 */
export const storeUserSession = async (user: User): Promise<void> => {
  return withSessionLock(async () => {
  try {
    const sessionData = {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      selectedAvatar: user.selectedAvatar,
      timestamp: Date.now()
    };
    
    if (Platform.OS === 'web') {
      localStorage.setItem(AUTH_STORAGE_KEYS.USER_SESSION, JSON.stringify(sessionData));
    } else {
      await AsyncStorage.setItem(AUTH_STORAGE_KEYS.USER_SESSION, JSON.stringify(sessionData));
    }
    
  } catch (error) {
    logger.error('❌ Error storing user session:', error);
  }
  });
};

/**
 * Retrieve user session data from storage
 */
export const retrieveUserSession = async (): Promise<User | null> => {
  return withSessionLock(async () => {
  try {
    logger.log('🔍 Retrieving user session from storage...');
    
    let sessionData: string | null = null;
    
    if (Platform.OS === 'web') {
      sessionData = localStorage.getItem(AUTH_STORAGE_KEYS.USER_SESSION);
    } else {
      sessionData = await AsyncStorage.getItem(AUTH_STORAGE_KEYS.USER_SESSION);
    }
    
    if (!sessionData) {
      logger.log('🚪 No stored user session found');
      return null;
    }
    
    let parsed: Record<string, unknown> | null = safeJsonParse<Record<string, unknown>>(sessionData);
    if (!parsed) {
      logger.error('❌ Error parsing session data, clearing corrupted session');
      await clearUserSessionUnlocked();
      return null;
    }
    
    // Check if session is not too old (24 hours)
    const sessionAge = Date.now() - (parsed.timestamp as number);
    const maxAge = SECURITY_CONFIG.sessionTimeout;
    
    if (sessionAge > maxAge) {
      logger.log('⏰ Stored session is too old, clearing...');
      await clearUserSessionUnlocked();
      return null;
    }
    
    // Handle migration from old session format (uid -> id)
    if (!parsed.id && parsed.uid) {
      logger.log('🔄 Migrating session from old format (uid -> id)');
      parsed.id = parsed.uid;
      delete parsed.uid;
      await storeUserSession(parsed as unknown as User);
    }
    
    // Validate that we have a valid user ID
    if (!parsed.id) {
      logger.error('❌ Stored session missing user ID, clearing session...');
      await clearUserSessionUnlocked();
      return null;
    }
    
    logger.log('✅ User session retrieved:', parsed.email);
    return parsed as unknown as User;
  } catch (error) {
    logger.error('❌ Error retrieving user session:', error);
    return null;
  }
  });
};

/**
 * Internal: clear session storage (call only when holding session lock)
 */
async function clearUserSessionUnlocked(): Promise<void> {
  try {
    logger.log('🧹 Clearing user session from storage...');
    if (Platform.OS === 'web') {
      localStorage.removeItem(AUTH_STORAGE_KEYS.USER_SESSION);
    } else {
      await AsyncStorage.removeItem(AUTH_STORAGE_KEYS.USER_SESSION);
    }
    logger.log('✅ User session cleared from storage');
  } catch (error) {
    logger.error('❌ Error clearing user session:', error);
  }
}

/**
 * Clear user session data from storage
 */
export const clearUserSession = async (): Promise<void> => {
  return withSessionLock(clearUserSessionUnlocked);
};
