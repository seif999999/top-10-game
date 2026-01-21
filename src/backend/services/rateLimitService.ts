import { collection, doc, getDoc, setDoc, updateDoc, serverTimestamp, query, where, getDocs, orderBy, limit, increment } from 'firebase/firestore';
import { db } from './firebase';
import SecurityMonitoringService from './securityMonitoringService';
import { logger } from '../utils/logger';
import { COLLECTIONS } from '../utils/constants';

export interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  blockDurationMs: number;
  actionType: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remainingAttempts: number;
  resetTime: number;
  error?: string;
}

export interface RateLimitEntry {
  userId: string;
  actionType: string;
  attempts: number;
  firstAttempt: Date;
  lastAttempt: Date;
  blockedUntil?: Date;
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    roomCode?: string;
  };
}

export interface ActionRateLimits {
  answerSubmission: RateLimitConfig;
  roomCreation: RateLimitConfig;
  roomJoining: RateLimitConfig;
  skipTurn: RateLimitConfig;
  chatMessage: RateLimitConfig;
  profileUpdate: RateLimitConfig;
}

/**
 * Rate limiting service for game actions and user activities
 * Prevents spam, abuse, and potential attacks
 */
export class RateLimitService {
  private static readonly RATE_LIMIT_COLLECTION = COLLECTIONS.RATE_LIMITS;
  private static readonly ACTION_LOGS_COLLECTION = 'actionLogs';
  
  // Rate limit configurations for different actions
  private static readonly RATE_LIMITS: ActionRateLimits = {
    answerSubmission: {
      maxAttempts: 10, // 10 answers per window
      windowMs: 60000, // 1 minute window
      blockDurationMs: 300000, // 5 minute block
      actionType: 'answer_submission'
    },
    roomCreation: {
      maxAttempts: 5, // 5 rooms per window
      windowMs: 3600000, // 1 hour window
      blockDurationMs: 1800000, // 30 minute block
      actionType: 'room_creation'
    },
    roomJoining: {
      maxAttempts: 20, // 20 joins per window
      windowMs: 300000, // 5 minute window
      blockDurationMs: 600000, // 10 minute block
      actionType: 'room_joining'
    },
    skipTurn: {
      maxAttempts: 5, // 5 skips per window
      windowMs: 300000, // 5 minute window
      blockDurationMs: 300000, // 5 minute block
      actionType: 'skip_turn'
    },
    chatMessage: {
      maxAttempts: 30, // 30 messages per window
      windowMs: 300000, // 5 minute window
      blockDurationMs: 300000, // 5 minute block
      actionType: 'chat_message'
    },
    profileUpdate: {
      maxAttempts: 10, // 10 updates per window
      windowMs: 3600000, // 1 hour window
      blockDurationMs: 1800000, // 30 minute block
      actionType: 'profile_update'
    },
    passwordReset: {
      maxAttempts: 3, // 3 password reset requests per email per hour
      windowMs: 3600000, // 1 hour window
      blockDurationMs: 3600000, // 1 hour block
      actionType: 'password_reset'
    }
  };

  /**
   * Check if an action is allowed for a user
   */
  static async checkRateLimit(
    userId: string,
    actionType: keyof ActionRateLimits,
    metadata?: { ipAddress?: string; userAgent?: string; roomCode?: string }
  ): Promise<RateLimitResult> {
    try {
      const config = this.RATE_LIMITS[actionType];
      const now = new Date();
      const windowStart = new Date(now.getTime() - config.windowMs);
      
      // Get or create rate limit entry
      const rateLimitEntry = await this.getOrCreateRateLimitEntry(userId, actionType, metadata);
      
      // Check if user is currently blocked
      if (rateLimitEntry.blockedUntil && rateLimitEntry.blockedUntil > now) {
        const remainingBlockTime = rateLimitEntry.blockedUntil.getTime() - now.getTime();
        return {
          allowed: false,
          remainingAttempts: 0,
          resetTime: rateLimitEntry.blockedUntil.getTime(),
          error: `Action blocked. Try again in ${Math.ceil(remainingBlockTime / 1000)} seconds.`
        };
      }
      
      // Check if attempts are within the current window
      if (rateLimitEntry.firstAttempt && rateLimitEntry.firstAttempt > windowStart) {
        // Within current window
        if (rateLimitEntry.attempts >= config.maxAttempts) {
          // Block the user
          const blockedUntil = new Date(now.getTime() + config.blockDurationMs);
          await this.updateRateLimitEntry(userId, actionType, {
            blockedUntil,
            attempts: 0, // Reset attempts
            firstAttempt: now
          });
          
          // Log security event for rate limit exceeded
          try {
            await SecurityMonitoringService.logSecurityEvent({
              userId: userId,
              eventType: 'RATE_LIMIT_EXCEEDED',
              severity: 'MEDIUM',
              description: `Rate limit exceeded for action: ${actionType}`,
              metadata: {
                action: actionType,
                ipAddress: metadata?.ipAddress,
                userAgent: metadata?.userAgent,
                roomCode: metadata?.roomCode,
                attempts: rateLimitEntry.attempts,
                maxAttempts: config.maxAttempts,
              },
            });
          } catch (logError) {
            logger.error('Failed to log rate limit security event:', logError);
          }

          return {
            allowed: false,
            remainingAttempts: 0,
            resetTime: blockedUntil.getTime(),
            error: `Rate limit exceeded. Blocked for ${Math.ceil(config.blockDurationMs / 1000)} seconds.`
          };
        }
      } else {
        // New window, reset attempts
        await this.updateRateLimitEntry(userId, actionType, {
          attempts: 0,
          firstAttempt: now,
          blockedUntil: undefined
        });
        rateLimitEntry.attempts = 0;
        rateLimitEntry.firstAttempt = now;
        rateLimitEntry.blockedUntil = undefined;
      }
      
      const remainingAttempts = config.maxAttempts - rateLimitEntry.attempts - 1;
      const resetTime = rateLimitEntry.firstAttempt ? 
        rateLimitEntry.firstAttempt.getTime() + config.windowMs : 
        now.getTime() + config.windowMs;
      
      return {
        allowed: true,
        remainingAttempts: Math.max(0, remainingAttempts),
        resetTime
      };
    } catch (error) {
      logger.error('Rate limit check error:', error);
      // On error, allow the action but log it
      return {
        allowed: true,
        remainingAttempts: 0,
        resetTime: Date.now() + 60000, // 1 minute default
        error: 'Rate limit check failed, allowing action'
      };
    }
  }

  /**
   * Record an action attempt
   */
  static async recordAction(
    userId: string,
    actionType: keyof ActionRateLimits,
    metadata?: { ipAddress?: string; userAgent?: string; roomCode?: string }
  ): Promise<void> {
    try {
      const now = new Date();
      
      // Update rate limit entry
      await this.incrementRateLimitEntry(userId, actionType, metadata);
      
      // Log the action
      await this.logAction(userId, actionType, metadata);
    } catch (error) {
      logger.error('Record action error:', error);
    }
  }

  /**
   * Get or create a rate limit entry for a user and action
   */
  private static async getOrCreateRateLimitEntry(
    userId: string,
    actionType: keyof ActionRateLimits,
    metadata?: { ipAddress?: string; userAgent?: string; roomCode?: string }
  ): Promise<RateLimitEntry> {
    try {
      const docId = `${userId}_${actionType}`;
      const docRef = doc(db, this.RATE_LIMIT_COLLECTION, docId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          userId: data.userId,
          actionType: data.actionType,
          attempts: data.attempts || 0,
          firstAttempt: data.firstAttempt?.toDate() || new Date(),
          lastAttempt: data.lastAttempt?.toDate() || new Date(),
          blockedUntil: data.blockedUntil?.toDate(),
          metadata: data.metadata
        };
      } else {
        // Create new entry
        const newEntry: RateLimitEntry = {
          userId,
          actionType,
          attempts: 0,
          firstAttempt: new Date(),
          lastAttempt: new Date(),
          metadata
        };
        
        await setDoc(docRef, {
          ...newEntry,
          firstAttempt: serverTimestamp(),
          lastAttempt: serverTimestamp()
        });
        
        return newEntry;
      }
    } catch (error) {
      logger.error('Get or create rate limit entry error:', error);
      // Return default entry on error
      return {
        userId,
        actionType,
        attempts: 0,
        firstAttempt: new Date(),
        lastAttempt: new Date(),
        metadata
      };
    }
  }

  /**
   * Update a rate limit entry
   */
  private static async updateRateLimitEntry(
    userId: string,
    actionType: keyof ActionRateLimits,
    updates: Partial<RateLimitEntry>
  ): Promise<void> {
    try {
      const docId = `${userId}_${actionType}`;
      const docRef = doc(db, this.RATE_LIMIT_COLLECTION, docId);
      
      const updateData: Record<string, unknown> = {
        lastAttempt: serverTimestamp()
      };
      
      if (updates.attempts !== undefined) updateData.attempts = updates.attempts;
      if (updates.firstAttempt) updateData.firstAttempt = serverTimestamp();
      if (updates.blockedUntil) updateData.blockedUntil = serverTimestamp();
      if (updates.metadata) updateData.metadata = updates.metadata;
      
      await updateDoc(docRef, updateData);
    } catch (error) {
      logger.error('Update rate limit entry error:', error);
    }
  }

  /**
   * Increment attempts for a rate limit entry
   * ✅ SECURITY: Uses Firestore increment to prevent race conditions
   */
  private static async incrementRateLimitEntry(
    userId: string,
    actionType: keyof ActionRateLimits,
    metadata?: { ipAddress?: string; userAgent?: string; roomCode?: string }
  ): Promise<void> {
    try {
      const docId = `${userId}_${actionType}`;
      const docRef = doc(db, this.RATE_LIMIT_COLLECTION, docId);
      
      // ✅ SECURITY: Use Firestore increment() to atomically increment attempts
      // This prevents race conditions where multiple requests could bypass rate limits
      const updateData: Record<string, unknown> = {
        attempts: increment(1), // Atomically increment by 1
        lastAttempt: serverTimestamp()
      };
      
      if (metadata) {
        updateData.metadata = metadata;
      }
      
      // Use updateDoc with increment for atomic operation
      // If document doesn't exist, create it first
      try {
        await updateDoc(docRef, updateData);
      } catch (updateError: any) {
        // If document doesn't exist, create it with initial attempts = 1
        if (updateError.code === 'not-found' || updateError.message?.includes('No document')) {
          await setDoc(docRef, {
            userId,
            actionType,
            attempts: 1,
            firstAttempt: serverTimestamp(),
            lastAttempt: serverTimestamp(),
            metadata
          });
        } else {
          throw updateError;
        }
      }
    } catch (error) {
      logger.error('Increment rate limit entry error:', error);
    }
  }

  /**
   * Log an action for monitoring and analysis
   */
  private static async logAction(
    userId: string,
    actionType: keyof ActionRateLimits,
    metadata?: { ipAddress?: string; userAgent?: string; roomCode?: string }
  ): Promise<void> {
    try {
      const logRef = doc(collection(db, this.ACTION_LOGS_COLLECTION));
      
      await setDoc(logRef, {
        userId,
        actionType,
        timestamp: serverTimestamp(),
        metadata: {
          ipAddress: metadata?.ipAddress || 'unknown',
          userAgent: metadata?.userAgent || 'unknown',
          roomCode: metadata?.roomCode || 'none'
        }
      });
    } catch (error) {
      logger.error('Log action error:', error);
    }
  }

  /**
   * Get rate limit status for a user
   */
  static async getRateLimitStatus(
    userId: string,
    actionType: keyof ActionRateLimits
  ): Promise<RateLimitResult> {
    try {
      const config = this.RATE_LIMITS[actionType];
      const rateLimitEntry = await this.getOrCreateRateLimitEntry(userId, actionType);
      const now = new Date();
      const windowStart = new Date(now.getTime() - config.windowMs);
      
      // Check if within current window
      if (rateLimitEntry.firstAttempt && rateLimitEntry.firstAttempt > windowStart) {
        const remainingAttempts = config.maxAttempts - rateLimitEntry.attempts;
        const resetTime = rateLimitEntry.firstAttempt.getTime() + config.windowMs;
        
        return {
          allowed: remainingAttempts > 0,
          remainingAttempts: Math.max(0, remainingAttempts),
          resetTime
        };
      } else {
        // New window
        return {
          allowed: true,
          remainingAttempts: config.maxAttempts,
          resetTime: now.getTime() + config.windowMs
        };
      }
    } catch (error) {
      logger.error('Get rate limit status error:', error);
      return {
        allowed: true,
        remainingAttempts: 0,
        resetTime: Date.now() + 60000
      };
    }
  }

  /**
   * Reset rate limits for a user (admin function)
   */
  static async resetRateLimits(userId: string, actionType?: keyof ActionRateLimits): Promise<void> {
    try {
      if (actionType) {
        // Reset specific action type
        const docId = `${userId}_${actionType}`;
        const docRef = doc(db, this.RATE_LIMIT_COLLECTION, docId);
        await setDoc(docRef, {
          userId,
          actionType,
          attempts: 0,
          firstAttempt: serverTimestamp(),
          lastAttempt: serverTimestamp(),
          blockedUntil: null
        });
      } else {
        // Reset all action types for user
        const actionTypes = Object.keys(this.RATE_LIMITS) as (keyof ActionRateLimits)[];
        for (const type of actionTypes) {
          await this.resetRateLimits(userId, type);
        }
      }
    } catch (error) {
      logger.error('Reset rate limits error:', error);
    }
  }

  /**
   * Get suspicious activity patterns
   */
  static async getSuspiciousActivity(
    timeWindowMs: number = 3600000 // 1 hour
  ): Promise<{ userId: string; actionType: string; count: number; metadata: unknown }[]> {
    try {
      const now = new Date();
      const windowStart = new Date(now.getTime() - timeWindowMs);
      
      const logsQuery = query(
        collection(db, this.ACTION_LOGS_COLLECTION),
        where('timestamp', '>=', windowStart),
        orderBy('timestamp', 'desc'),
        limit(1000)
      );
      
      const logsSnap = await getDocs(logsQuery);
      const suspiciousActivities: { [key: string]: { userId: string; actionType: string; count: number; metadata: unknown } } = {};
      
      logsSnap.forEach(doc => {
        const data = doc.data();
        const key = `${data.userId}_${data.actionType}`;
        
        if (suspiciousActivities[key]) {
          suspiciousActivities[key].count++;
        } else {
          suspiciousActivities[key] = {
            userId: data.userId,
            actionType: data.actionType,
            count: 1,
            metadata: data.metadata
          };
        }
      });
      
      // Filter for suspicious patterns (more than 50 actions in the time window)
      return Object.values(suspiciousActivities).filter(activity => activity.count > 50);
    } catch (error) {
      logger.error('Get suspicious activity error:', error);
      return [];
    }
  }

  /**
   * Clean up old rate limit entries and logs
   */
  static async cleanupOldEntries(olderThanDays: number = 7): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
      
      // This would require batch operations in a real implementation
      // For now, we'll just log the cleanup action
      logger.log(`Cleaning up rate limit entries older than ${olderThanDays} days`);
    } catch (error) {
      logger.error('Cleanup old entries error:', error);
    }
  }
}
