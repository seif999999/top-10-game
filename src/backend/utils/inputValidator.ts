/**
 * Input Validation and Sanitization Service
 * Provides comprehensive input validation and sanitization for security
 * 
 * Note: This class delegates to centralized validation schemas where possible.
 * See validationSchemas.ts for the core validation logic.
 */

import { ContentModerationService } from '../services/contentModerationService';
import { logger } from './logger';
import { AppError } from '../../shared/errors';
import { sanitizeText } from './textSanitizer';
import {
  validateEmail as validateEmailSchema,
  validateDisplayName as validateDisplayNameSchema,
  validatePassword as validatePasswordSchema,
  validateRoomCode as validateRoomCodeSchema,
  validateGameAnswer as validateGameAnswerSchema,
  VALIDATION_PATTERNS,
  VALIDATION_LIMITS,
} from './validationSchemas';

// Basic profanity list - in production, this should be loaded from a secure source
const PROFANITY_LIST = [
  'badword1', 'badword2', 'inappropriate', 'spam'
  // Add more comprehensive list in production
];

export class InputValidator {
  /**
   * Sanitize text input to prevent XSS and injection attacks
   * Delegates to textSanitizer utility to avoid circular dependencies
   */
  static sanitizeText(input: string, maxLength: number = 100): string {
    return sanitizeText(input, maxLength);
  }

  /**
   * Validate email format
   * Delegates to centralized validation schema
   */
  static validateEmail(email: string): boolean {
    const result = validateEmailSchema(email);
    return result.valid;
  }

  /**
   * Validate display names with comprehensive checks
   * Delegates to centralized validation schema with profanity check
   */
  static validateDisplayName(name: string): { valid: boolean; errors: string[] } {
    const result = validateDisplayNameSchema(name);
    const errors = [...result.errors];

    // Additional profanity check (not in schema)
    if (name && this.containsProfanity(name)) {
      errors.push('Name contains inappropriate content');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate game answers
   * Delegates to centralized validation schema with profanity check
   */
  static validateGameAnswer(answer: string): { valid: boolean; sanitized: string; errors: string[] } {
    const sanitized = this.sanitizeText(answer || '', VALIDATION_LIMITS.ANSWER_MAX);
    const result = validateGameAnswerSchema(sanitized);
    const errors = [...result.errors];

    // Additional profanity check (not in schema)
    if (sanitized && this.containsProfanity(sanitized)) {
      errors.push('Answer contains inappropriate content');
    }

    return { 
      valid: errors.length === 0, 
      sanitized, 
      errors 
    };
  }

  /**
   * Validate room codes
   * Delegates to centralized validation schema
   */
  static validateRoomCode(code: string): boolean {
    const result = validateRoomCodeSchema(code);
    return result.valid;
  }

  /**
   * Validate password strength - aligned with Firebase requirements
   * Delegates to centralized validation schema
   */
  static validatePassword(password: string): { valid: boolean; errors: string[]; strength: 'weak' | 'medium' | 'strong' } {
    return validatePasswordSchema(password);
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
   * Uses centralized validation patterns
   */
  private static containsPersonalInfo(text: string): boolean {
    return (
      VALIDATION_PATTERNS.PHONE_NUMBER.test(text) ||
      VALIDATION_PATTERNS.CREDIT_CARD.test(text) ||
      VALIDATION_PATTERNS.SSN.test(text) ||
      VALIDATION_PATTERNS.EMAIL.test(text)
    );
  }

  /**
   * Sanitize and validate all user inputs in a form
   */
  static validateFormInputs(inputs: Record<string, unknown>): { valid: boolean; sanitized: Record<string, unknown>; errors: Record<string, string[]> } {
    const sanitized: Record<string, unknown> = {};
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
