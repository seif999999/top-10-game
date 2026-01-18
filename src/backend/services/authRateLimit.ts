/**
 * Authentication rate limiting service
 * Tracks login attempts and blocks excessive failures
 */

import { logger } from '../utils/logger';

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

/**
 * Rate limiter for authentication attempts
 * Prevents brute force attacks by tracking failed login attempts
 */
export class AuthRateLimit {
  private attempts: Map<string, { count: number; lastAttempt: number }> = new Map();
  
  /**
   * Check if an identifier (usually email) is blocked due to too many attempts
   */
  isBlocked(identifier: string): boolean {
    const record = this.attempts.get(identifier);
    if (!record) return false;
    
    if (Date.now() - record.lastAttempt > SECURITY_CONFIG.lockoutDuration) {
      this.attempts.delete(identifier);
      return false;
    }
    
    return record.count >= SECURITY_CONFIG.maxLoginAttempts;
  }
  
  /**
   * Record a failed authentication attempt
   */
  recordAttempt(identifier: string): void {
    const existing = this.attempts.get(identifier);
    this.attempts.set(identifier, {
      count: existing ? existing.count + 1 : 1,
      lastAttempt: Date.now()
    });
    logger.log(`🔒 Auth rate limit: Recorded attempt for ${identifier}, count: ${existing ? existing.count + 1 : 1}`);
  }
  
  /**
   * Reset attempts for an identifier (e.g., after successful login)
   */
  reset(identifier: string): void {
    this.attempts.delete(identifier);
    logger.log(`🔓 Auth rate limit: Reset for ${identifier}`);
  }
  
  /**
   * Get remaining lockout time in milliseconds
   */
  getRemainingTime(identifier: string): number {
    const record = this.attempts.get(identifier);
    if (!record) return 0;
    
    const elapsed = Date.now() - record.lastAttempt;
    return Math.max(0, SECURITY_CONFIG.lockoutDuration - elapsed);
  }
  
  /**
   * Get the number of remaining attempts before lockout
   */
  getRemainingAttempts(identifier: string): number {
    const record = this.attempts.get(identifier);
    if (!record) return SECURITY_CONFIG.maxLoginAttempts;
    
    return Math.max(0, SECURITY_CONFIG.maxLoginAttempts - record.count);
  }
  
  /**
   * Clean up expired entries (call periodically to prevent memory leaks)
   */
  cleanup(): void {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [identifier, record] of this.attempts.entries()) {
      if (now - record.lastAttempt > SECURITY_CONFIG.lockoutDuration) {
        this.attempts.delete(identifier);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      logger.log(`🧹 Auth rate limit: Cleaned up ${cleaned} expired entries`);
    }
  }
}

// Singleton instance
export const authRateLimit = new AuthRateLimit();
