/**
 * Input Validation and Sanitization Service
 * Provides comprehensive input validation and sanitization for security
 */

const DOMPurify = require('isomorphic-dompurify');
import { ContentModerationService } from '../services/contentModerationService';
import { logger } from './logger';

// Basic profanity list - in production, this should be loaded from a secure source
const PROFANITY_LIST = [
  'badword1', 'badword2', 'inappropriate', 'spam'
  // Add more comprehensive list in production
];

// Patterns for detecting personal information
const PERSONAL_INFO_PATTERNS = [
  /(\d{3}[-.]?\d{3}[-.]?\d{4})/, // Phone numbers
  /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/, // Email addresses
  /(\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b)/, // Credit card numbers
  /(\b\d{3}-\d{2}-\d{4}\b)/, // SSN pattern
];

export class InputValidator {
  /**
   * Sanitize text input to prevent XSS and injection attacks
   */
  static sanitizeText(input: string, maxLength: number = 100): string {
    if (typeof input !== 'string') {
      throw new Error('Input must be a string');
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
        throw new Error('DOMPurify not available');
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

  /**
   * Validate email format
   */
  static validateEmail(email: string): boolean {
    if (!email || typeof email !== 'string') {
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  }

  /**
   * Validate display names with comprehensive checks
   */
  static validateDisplayName(name: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!name || typeof name !== 'string') {
      errors.push('Name is required');
      return { valid: false, errors };
    }

    if (name.length < 2) {
      errors.push('Name must be at least 2 characters');
    }

    if (name.length > 30) {
      errors.push('Name must be less than 30 characters');
    }

    if (!/^[a-zA-Z0-9\s._-]+$/.test(name)) {
      errors.push('Name contains invalid characters. Only letters, numbers, spaces, dots, underscores, and hyphens are allowed');
    }

    // Check for inappropriate content
    if (this.containsProfanity(name)) {
      errors.push('Name contains inappropriate content');
    }

    // Check for personal information
    if (this.containsPersonalInfo(name)) {
      errors.push('Name should not contain personal information');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate game answers
   */
  static validateGameAnswer(answer: string): { valid: boolean; sanitized: string; errors: string[] } {
    const errors: string[] = [];
    
    if (!answer || typeof answer !== 'string') {
      errors.push('Answer is required');
      return { valid: false, sanitized: '', errors };
    }

    const sanitized = this.sanitizeText(answer, 50);
    
    if (sanitized.length < 1) {
      errors.push('Answer must be at least 1 character');
    }

    if (sanitized.length > 50) {
      errors.push('Answer must be less than 50 characters');
    }

    // Check for inappropriate content
    if (this.containsProfanity(sanitized)) {
      errors.push('Answer contains inappropriate content');
    }

    // Check for personal information
    if (this.containsPersonalInfo(sanitized)) {
      errors.push('Answer should not contain personal information');
    }

    return { 
      valid: errors.length === 0, 
      sanitized, 
      errors 
    };
  }

  /**
   * Validate room codes
   */
  static validateRoomCode(code: string): boolean {
    if (!code || typeof code !== 'string') {
      return false;
    }
    return /^[A-Z0-9]{6}$/.test(code);
  }

  /**
   * Validate password strength - aligned with Firebase requirements
   * This ensures consistency between app validation and Firebase Auth
   */
  static validatePassword(password: string): { valid: boolean; errors: string[]; strength: 'weak' | 'medium' | 'strong' } {
    const errors: string[] = [];
    let strength: 'weak' | 'medium' | 'strong' = 'weak';

    if (!password || typeof password !== 'string') {
      errors.push('Password is required');
      return { valid: false, errors, strength };
    }

    // Firebase minimum requirement (6 characters) - but we enforce 8 for security
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters');
    }

    // Reasonable maximum length
    if (password.length > 128) {
      errors.push('Password must be less than 128 characters');
    }

    // Character type requirements for security
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    // Calculate strength
    if (password.length >= 12 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password) && /[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      strength = 'strong';
    } else if (password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password)) {
      strength = 'medium';
    }

    return { 
      valid: errors.length === 0, 
      errors, 
      strength 
    };
  }

  /**
   * Validate password for Firebase compatibility
   * This ensures the password meets both app and Firebase requirements
   */
  static validatePasswordForFirebase(password: string): { valid: boolean; errors: string[]; firebaseCompatible: boolean } {
    const errors: string[] = [];
    let firebaseCompatible = true;

    if (!password || typeof password !== 'string') {
      errors.push('Password is required');
      return { valid: false, errors, firebaseCompatible: false };
    }

    // Firebase minimum requirement
    if (password.length < 6) {
      errors.push('Password must be at least 6 characters (Firebase minimum)');
      firebaseCompatible = false;
    }

    // App security requirements
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters for security');
    }

    if (password.length > 128) {
      errors.push('Password must be less than 128 characters');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return { 
      valid: errors.length === 0, 
      errors, 
      firebaseCompatible 
    };
  }

  /**
   * Check if text contains profanity
   */
  private static containsProfanity(text: string): boolean {
    const normalizedText = text.toLowerCase();
    return PROFANITY_LIST.some(word => normalizedText.includes(word.toLowerCase()));
  }

  /**
   * Check if text contains personal information
   */
  private static containsPersonalInfo(text: string): boolean {
    return PERSONAL_INFO_PATTERNS.some(pattern => pattern.test(text));
  }

  /**
   * Sanitize and validate all user inputs in a form
   */
  static validateFormInputs(inputs: Record<string, any>): { valid: boolean; sanitized: Record<string, any>; errors: Record<string, string[]> } {
    const sanitized: Record<string, any> = {};
    const errors: Record<string, string[]> = {};
    let allValid = true;

    for (const [key, value] of Object.entries(inputs)) {
      if (typeof value === 'string') {
        const sanitizedValue = this.sanitizeText(value, 200);
        sanitized[key] = sanitizedValue;

        // Validate based on field type
        if (key.toLowerCase().includes('email')) {
          if (!this.validateEmail(sanitizedValue)) {
            errors[key] = ['Invalid email format'];
            allValid = false;
          }
        } else if (key.toLowerCase().includes('name') || key.toLowerCase().includes('displayname')) {
          const nameValidation = this.validateDisplayName(sanitizedValue);
          if (!nameValidation.valid) {
            errors[key] = nameValidation.errors;
            allValid = false;
          }
        } else if (key.toLowerCase().includes('password')) {
          const passwordValidation = this.validatePassword(sanitizedValue);
          if (!passwordValidation.valid) {
            errors[key] = passwordValidation.errors;
            allValid = false;
          }
        }
      } else {
        sanitized[key] = value;
      }
    }

    return { valid: allValid, sanitized, errors };
  }

  /**
   * Moderate content using the content moderation service
   */
  static async moderateContent(
    content: string,
    contentType: 'displayName' | 'gameAnswer' | 'roomName' | 'chatMessage',
    userId: string,
    metadata?: { ipAddress?: string; userAgent?: string }
  ): Promise<{ approved: boolean; sanitized: string; errors: string[] }> {
    try {
      const result = await ContentModerationService.moderateContent(
        content,
        contentType,
        userId,
        metadata
      );

      if (!result.approved) {
        return {
          approved: false,
          sanitized: this.sanitizeText(content, 100),
          errors: [result.reason || 'Content not approved', ...(result.suggestions || [])]
        };
      }

      return {
        approved: true,
        sanitized: this.sanitizeText(content, 100),
        errors: []
      };
    } catch (error) {
      logger.error('Content moderation error:', error);
      return {
        approved: false,
        sanitized: this.sanitizeText(content, 100),
        errors: ['Content moderation failed. Please try again.']
      };
    }
  }
}
