/**
 * Secure Random Number Generation Utility
 * Provides cryptographically secure random generation for security-critical operations
 * 
 * ✅ SECURITY: Uses expo-crypto for cryptographically secure random bytes
 * Prevents predictable values that could be exploited by attackers
 */

import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import { logger } from './logger';

/**
 * Generate cryptographically secure random bytes
 * Falls back to Math.random() only if crypto is unavailable (should never happen in production)
 */
async function getSecureRandomBytes(length: number): Promise<Uint8Array> {
  try {
    // ✅ SECURITY: Use expo-crypto for cryptographically secure random bytes
    const bytes = await Crypto.getRandomBytesAsync(length);
    return bytes;
  } catch (error) {
    logger.error('❌ CRITICAL: Failed to generate secure random bytes:', error);
    // ⚠️ FALLBACK: Only use Math.random() if crypto completely fails (should never happen)
    // This is a last resort and should be logged as an error
    logger.error('⚠️ SECURITY WARNING: Falling back to insecure Math.random()');
    const fallback = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
      fallback[i] = Math.floor(Math.random() * 256);
    }
    return fallback;
  }
}

/**
 * Generate a cryptographically secure random string
 * @param length - Length of the string to generate
 * @param charset - Characters to use (default: alphanumeric uppercase)
 * @returns Secure random string
 */
export async function generateSecureRandomString(
  length: number,
  charset: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
): Promise<string> {
  try {
    // Generate secure random bytes
    const bytes = await getSecureRandomBytes(length);
    
    // Convert bytes to string using charset
    let result = '';
    for (let i = 0; i < length; i++) {
      result += charset[bytes[i] % charset.length];
    }
    
    return result;
  } catch (error) {
    logger.error('❌ Error generating secure random string:', error);
    // Last resort fallback (should never happen)
    let result = '';
    for (let i = 0; i < length; i++) {
      result += charset[Math.floor(Math.random() * charset.length)];
    }
    return result;
  }
}

/**
 * Generate a secure room code (6 digits only)
 * ✅ SECURITY: Uses cryptographically secure random generation
 * Prevents room code prediction/brute forcing attacks
 */
export async function generateSecureRoomCode(): Promise<string> {
  return generateSecureRandomString(6, '0123456789');
}

/**
 * Generate a secure unique ID
 * ✅ SECURITY: Uses cryptographically secure random generation
 * @param prefix - Optional prefix for the ID
 * @returns Secure unique ID string
 */
export async function generateSecureId(prefix: string = ''): Promise<string> {
  const randomPart = await generateSecureRandomString(9, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz');
  return prefix ? `${prefix}_${Date.now()}_${randomPart}` : `${Date.now()}_${randomPart}`;
}

/**
 * Generate a secure random integer in a range
 * ✅ SECURITY: Uses cryptographically secure random generation
 * @param min - Minimum value (inclusive)
 * @param max - Maximum value (inclusive)
 * @returns Secure random integer
 */
export async function generateSecureRandomInt(min: number, max: number): Promise<number> {
  const bytes = await getSecureRandomBytes(4);
  // Convert 4 bytes to a 32-bit integer
  const randomValue = (bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3];
  // Map to range [min, max]
  return min + (randomValue % (max - min + 1));
}

/**
 * Shuffle an array using cryptographically secure random
 * ✅ SECURITY: Uses secure random for shuffling (prevents predictable order)
 * @param array - Array to shuffle
 * @returns New shuffled array
 */
export async function secureShuffle<T>(array: T[]): Promise<T[]> {
  const shuffled = [...array];
  const bytes = await getSecureRandomBytes(shuffled.length * 2);
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    // Use secure random bytes to determine swap index
    const randomIndex = bytes[i * 2] % (i + 1);
    [shuffled[i], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[i]];
  }
  
  return shuffled;
}
