/**
 * Text Sanitization Utility
 * Extracted to break circular dependency between inputValidator and contentModerationService
 */

const DOMPurify = require('isomorphic-dompurify');
import { logger } from './logger';
import { AppError } from '../../shared/errors';

/**
 * Sanitize text input to prevent XSS and injection attacks
 */
export function sanitizeText(input: string, maxLength: number = 100): string {
  if (typeof input !== 'string') {
    throw new AppError({
      code: 'VALIDATION_INVALID_INPUT',
      message: 'Input must be a string',
      userMessage: 'Invalid input.'
    });
  }

  let sanitized: string;
  
  try {
    // Use DOMPurify for comprehensive HTML sanitization
    if (DOMPurify && typeof DOMPurify.sanitize === 'function') {
      sanitized = DOMPurify.sanitize(input, {
        ALLOWED_TAGS: [], // Remove all HTML tags
        ALLOWED_ATTR: [], // Remove all attributes
        KEEP_CONTENT: true, // Keep text content
        ALLOW_DATA_ATTR: false, // Remove data attributes
        ALLOW_UNKNOWN_PROTOCOLS: false, // Remove unknown protocols
      });
    } else {
      throw new AppError({
        code: 'SANITIZE_UNAVAILABLE',
        message: 'DOMPurify not available',
        userMessage: 'Unable to sanitize input.'
      });
    }
  } catch (error) {
    logger.warn('DOMPurify not available, using basic sanitization:', error);
    // Fallback to basic sanitization
    sanitized = input;
  }

  // Additional manual sanitization for extra security
  sanitized = sanitized
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/on\w+=/gi, '') // Remove event handlers
    .replace(/data:/gi, '') // Remove data: protocols
    .replace(/vbscript:/gi, '') // Remove vbscript: protocols
    .trim();

  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}
