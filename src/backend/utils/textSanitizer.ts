/**
 * Text Sanitization Utility
 * Extracted to break circular dependency between inputValidator and contentModerationService
 * 
 * Note: Uses manual sanitization optimized for React Native (iOS/Android).
 * DOMPurify is not used as it's web-only and not needed for mobile apps.
 */

import { AppError } from '../../shared/errors';

/**
 * Sanitize text input to prevent XSS and injection attacks
 * Uses manual sanitization patterns optimized for React Native
 */
export function sanitizeText(input: string, maxLength: number = 100): string {
  if (typeof input !== 'string') {
    throw new AppError({
      code: 'VALIDATION_INVALID_INPUT',
      message: 'Input must be a string',
      userMessage: 'Invalid input.'
    });
  }

  // Manual sanitization for React Native (removes dangerous patterns)
  let sanitized = input
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/on\w+=/gi, '') // Remove event handlers (onclick=, onerror=, etc.)
    .replace(/data:/gi, '') // Remove data: protocols
    .replace(/vbscript:/gi, '') // Remove vbscript: protocols
    .replace(/<script/gi, '') // Remove script tags
    .replace(/<\/script>/gi, '') // Remove closing script tags
    .replace(/<iframe/gi, '') // Remove iframe tags
    .replace(/<object/gi, '') // Remove object tags
    .replace(/<embed/gi, '') // Remove embed tags
    .trim();

  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}
