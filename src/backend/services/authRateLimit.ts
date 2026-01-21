/**
 * Authentication rate limiting service
 * Tracks login attempts and blocks excessive failures
 * Uses Firestore for persistence across app restarts
 */

import { doc, getDoc, setDoc, updateDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';
import { logger } from '../utils/logger';
import { COLLECTIONS } from '../utils/constants';

// Security configuration
interface SecurityConfig {
  maxLoginAttempts: number;
  lockoutDuration: number;
  sessionTimeout: number;
  passwordMinLength: number;
}

export const SECURITY_CONFIG: SecurityConfig = {
  maxLoginAttempts: 5,
  lockoutDuration: 15 * 60 * 1000, // 15 minutes
  sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
  passwordMinLength: 8
};

interface AuthRateLimitEntry {
  identifier: string;
  count: number;
  lastAttempt: Date;
  blockedUntil?: Date;
}

/**
 * Rate limiter for authentication attempts
 * Prevents brute force attacks by tracking failed login attempts
 * Uses Firestore for persistent storage across app restarts
 */
export class AuthRateLimit {
  private static readonly COLLECTION = COLLECTIONS.RATE_LIMITS;
  
  /**
   * Get rate limit entry from Firestore
   */
  private static async getRateLimitEntry(identifier: string): Promise<AuthRateLimitEntry | null> {
    try {
      const docId = `auth_${identifier.toLowerCase()}`;
      const docRef = doc(db, this.COLLECTION, docId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        const lastAttempt = data.lastAttempt?.toDate() || new Date();
        const blockedUntil = data.blockedUntil?.toDate();
        
        // Check if entry has expired
        const now = Date.now();
        if (blockedUntil && blockedUntil.getTime() > now) {
          // Still blocked
          return {
            identifier,
            count: data.count || 0,
            lastAttempt,
            blockedUntil
          };
        } else if (now - lastAttempt.getTime() > SECURITY_CONFIG.lockoutDuration) {
          // Entry expired, delete it
          await deleteDoc(docRef);
          return null;
        }
        
        return {
          identifier,
          count: data.count || 0,
          lastAttempt,
          blockedUntil
        };
      }
      
      return null;
    } catch (error) {
      logger.error('Error getting auth rate limit entry:', error);
      return null;
    }
  }
  
  /**
   * Save rate limit entry to Firestore
   */
  private static async saveRateLimitEntry(entry: AuthRateLimitEntry): Promise<void> {
    try {
      const docId = `auth_${entry.identifier.toLowerCase()}`;
      const docRef = doc(db, this.COLLECTION, docId);
      
      const data: Record<string, unknown> = {
        identifier: entry.identifier,
        count: entry.count,
        lastAttempt: serverTimestamp(),
        type: 'authentication' // Distinguish from other rate limits
      };
      
      // Only set blockedUntil if it exists (use timestamp for Firestore)
      if (entry.blockedUntil) {
        data.blockedUntil = entry.blockedUntil;
      }
      
      await setDoc(docRef, data, { merge: true });
    } catch (error) {
      logger.error('Error saving auth rate limit entry:', error);
    }
  }
  
  /**
   * Check if an identifier (usually email) is blocked due to too many attempts
   */
  async isBlocked(identifier: string): Promise<boolean> {
    try {
      const record = await AuthRateLimit.getRateLimitEntry(identifier);
      if (!record) return false;
      
      // Check if currently blocked
      if (record.blockedUntil && record.blockedUntil.getTime() > Date.now()) {
        return true;
      }
      
      // Check if should be blocked based on attempts
      if (record.count >= SECURITY_CONFIG.maxLoginAttempts) {
        const now = Date.now();
        const elapsed = now - record.lastAttempt.getTime();
        
        if (elapsed < SECURITY_CONFIG.lockoutDuration) {
          // Still within lockout period, block them
          const blockedUntil = new Date(now + SECURITY_CONFIG.lockoutDuration);
          await AuthRateLimit.saveRateLimitEntry({
            ...record,
            blockedUntil
          });
          return true;
        } else {
          // Lockout period expired, reset
          await this.reset(identifier);
          return false;
        }
      }
      
      return false;
    } catch (error) {
      logger.error('Error checking auth rate limit:', error);
      // On error, don't block (fail open for availability)
      return false;
    }
  }
  
  /**
   * Record a failed authentication attempt
   */
  async recordAttempt(identifier: string): Promise<void> {
    try {
      const record = await AuthRateLimit.getRateLimitEntry(identifier);
      const now = Date.now();
      
      let newCount: number;
      let blockedUntil: Date | undefined;
      
      if (record) {
        // Check if we're in a new window (lockout period expired)
        const elapsed = now - record.lastAttempt.getTime();
        if (elapsed > SECURITY_CONFIG.lockoutDuration) {
          // New window, reset count
          newCount = 1;
        } else {
          // Same window, increment count
          newCount = record.count + 1;
        }
      } else {
        // First attempt
        newCount = 1;
      }
      
      // If max attempts reached, set block time
      if (newCount >= SECURITY_CONFIG.maxLoginAttempts) {
        blockedUntil = new Date(now + SECURITY_CONFIG.lockoutDuration);
      }
      
      await AuthRateLimit.saveRateLimitEntry({
        identifier,
        count: newCount,
        lastAttempt: new Date(now),
        blockedUntil
      });
      
      logger.log(`🔒 Auth rate limit: Recorded attempt for ${identifier}, count: ${newCount}`);
    } catch (error) {
      logger.error('Error recording auth rate limit attempt:', error);
    }
  }
  
  /**
   * Reset attempts for an identifier (e.g., after successful login)
   */
  async reset(identifier: string): Promise<void> {
    try {
      const docId = `auth_${identifier.toLowerCase()}`;
      const docRef = doc(db, this.COLLECTION, docId);
      await deleteDoc(docRef);
      logger.log(`🔓 Auth rate limit: Reset for ${identifier}`);
    } catch (error) {
      logger.error('Error resetting auth rate limit:', error);
    }
  }
  
  /**
   * Get remaining lockout time in milliseconds
   */
  async getRemainingTime(identifier: string): Promise<number> {
    try {
      const record = await AuthRateLimit.getRateLimitEntry(identifier);
      if (!record || !record.blockedUntil) return 0;
      
      const now = Date.now();
      const blockedUntil = record.blockedUntil.getTime();
      
      if (blockedUntil > now) {
        return blockedUntil - now;
      }
      
      return 0;
    } catch (error) {
      logger.error('Error getting remaining auth rate limit time:', error);
      return 0;
    }
  }
  
  /**
   * Get the number of remaining attempts before lockout
   */
  async getRemainingAttempts(identifier: string): Promise<number> {
    try {
      const record = await AuthRateLimit.getRateLimitEntry(identifier);
      if (!record) return SECURITY_CONFIG.maxLoginAttempts;
      
      return Math.max(0, SECURITY_CONFIG.maxLoginAttempts - record.count);
    } catch (error) {
      logger.error('Error getting remaining auth rate limit attempts:', error);
      return SECURITY_CONFIG.maxLoginAttempts;
    }
  }
  
  /**
   * Clean up expired entries (call periodically to prevent Firestore bloat)
   * This is optional but recommended for maintenance
   */
  async cleanup(): Promise<void> {
    // Note: Firestore TTL policies or scheduled functions would be better for cleanup
    // This method is kept for backwards compatibility but does minimal cleanup
    // since expired entries are checked and deleted on access
    logger.log('🧹 Auth rate limit: Cleanup called (expired entries are auto-cleaned on access)');
  }
}

// Singleton instance
export const authRateLimit = new AuthRateLimit();
