/**
 * Centralized Validation Schemas
 * Provides type-safe validation for all data types in the application
 * Eliminates duplicate validation logic across services
 */

import { logger } from './logger';

// ============================================
// VALIDATION RESULT TYPES
// ============================================

export interface ValidationResult<T = unknown> {
  valid: boolean;
  data?: T;
  errors: string[];
}

export interface ValidationRule<T> {
  validate: (value: T) => boolean;
  message: string;
}

// ============================================
// VALIDATION CONSTANTS
// ============================================

export const VALIDATION_LIMITS = {
  // User fields
  DISPLAY_NAME_MIN: 2,
  DISPLAY_NAME_MAX: 30,
  EMAIL_MAX: 254,
  PASSWORD_MIN: 8,
  PASSWORD_MAX: 128,
  
  // Game fields
  ANSWER_MIN: 1,
  ANSWER_MAX: 50,
  QUESTION_MIN: 5,
  QUESTION_MAX: 200,
  ROOM_CODE_LENGTH: 6,
  MAX_PLAYERS: 8,
  MIN_PLAYERS: 2,
  
  // Custom questions
  CUSTOM_QUESTION_MIN: 10,
  CUSTOM_QUESTION_MAX: 150,
  CUSTOM_ANSWER_MIN: 1,
  CUSTOM_ANSWER_MAX: 50,
  CUSTOM_ANSWERS_COUNT: 10,
  
  // Time limits
  MIN_TURN_DURATION: 10,
  MAX_TURN_DURATION: 120,
  DEFAULT_TURN_DURATION: 60,
} as const;

// ============================================
// VALIDATION PATTERNS
// ============================================

export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  DISPLAY_NAME: /^[a-zA-Z0-9\s._-]+$/,
  ROOM_CODE: /^[0-9]{6}$/,
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
  ALPHANUMERIC_SPACES: /^[a-zA-Z0-9\s]+$/,
  NO_SPECIAL_CHARS: /^[^<>{}[\]\\\/]+$/,
  PHONE_NUMBER: /(\d{3}[-.]?\d{3}[-.]?\d{4})/,
  CREDIT_CARD: /(\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b)/,
  SSN: /(\b\d{3}-\d{2}-\d{4}\b)/,
} as const;

// ============================================
// BASE VALIDATORS
// ============================================

/**
 * Validate string length
 */
export function validateLength(
  value: string,
  min: number,
  max: number,
  fieldName: string
): ValidationResult<string> {
  const errors: string[] = [];
  
  if (!value || typeof value !== 'string') {
    return { valid: false, errors: [`${fieldName} is required`] };
  }
  
  if (value.length < min) {
    errors.push(`${fieldName} must be at least ${min} characters`);
  }
  
  if (value.length > max) {
    errors.push(`${fieldName} must be less than ${max} characters`);
  }
  
  return { valid: errors.length === 0, data: value, errors };
}

/**
 * Validate against a regex pattern
 */
export function validatePattern(
  value: string,
  pattern: RegExp,
  message: string
): ValidationResult<string> {
  if (!pattern.test(value)) {
    return { valid: false, errors: [message] };
  }
  return { valid: true, data: value, errors: [] };
}

/**
 * Validate number range
 */
export function validateNumberRange(
  value: number,
  min: number,
  max: number,
  fieldName: string
): ValidationResult<number> {
  const errors: string[] = [];
  
  if (typeof value !== 'number' || isNaN(value)) {
    return { valid: false, errors: [`${fieldName} must be a valid number`] };
  }
  
  if (value < min) {
    errors.push(`${fieldName} must be at least ${min}`);
  }
  
  if (value > max) {
    errors.push(`${fieldName} must be at most ${max}`);
  }
  
  return { valid: errors.length === 0, data: value, errors };
}

// ============================================
// FIELD-SPECIFIC VALIDATORS
// ============================================

/**
 * Validate email address
 */
export function validateEmail(email: string): ValidationResult<string> {
  const errors: string[] = [];
  
  if (!email || typeof email !== 'string') {
    return { valid: false, errors: ['Email is required'] };
  }
  
  const trimmed = email.trim().toLowerCase();
  
  if (!VALIDATION_PATTERNS.EMAIL.test(trimmed)) {
    errors.push('Invalid email format');
  }
  
  if (trimmed.length > VALIDATION_LIMITS.EMAIL_MAX) {
    errors.push(`Email must be less than ${VALIDATION_LIMITS.EMAIL_MAX} characters`);
  }
  
  return { valid: errors.length === 0, data: trimmed, errors };
}

/**
 * Validate display name
 */
export function validateDisplayName(name: string): ValidationResult<string> {
  const errors: string[] = [];
  
  if (!name || typeof name !== 'string') {
    return { valid: false, errors: ['Display name is required'] };
  }
  
  const trimmed = name.trim();
  
  if (trimmed.length < VALIDATION_LIMITS.DISPLAY_NAME_MIN) {
    errors.push(`Display name must be at least ${VALIDATION_LIMITS.DISPLAY_NAME_MIN} characters`);
  }
  
  if (trimmed.length > VALIDATION_LIMITS.DISPLAY_NAME_MAX) {
    errors.push(`Display name must be less than ${VALIDATION_LIMITS.DISPLAY_NAME_MAX} characters`);
  }
  
  if (!VALIDATION_PATTERNS.DISPLAY_NAME.test(trimmed)) {
    errors.push('Display name can only contain letters, numbers, spaces, dots, underscores, and hyphens');
  }
  
  // Check for personal info patterns
  if (containsPersonalInfo(trimmed)) {
    errors.push('Display name should not contain personal information');
  }
  
  return { valid: errors.length === 0, data: trimmed, errors };
}

/**
 * Validate password
 */
export function validatePassword(password: string): ValidationResult<string> & { strength: 'weak' | 'medium' | 'strong' } {
  const errors: string[] = [];
  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  
  if (!password || typeof password !== 'string') {
    return { valid: false, errors: ['Password is required'], strength };
  }
  
  if (password.length < VALIDATION_LIMITS.PASSWORD_MIN) {
    errors.push(`Password must be at least ${VALIDATION_LIMITS.PASSWORD_MIN} characters`);
  }
  
  if (password.length > VALIDATION_LIMITS.PASSWORD_MAX) {
    errors.push(`Password must be less than ${VALIDATION_LIMITS.PASSWORD_MAX} characters`);
  }
  
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  if (!hasUpper) errors.push('Password must contain at least one uppercase letter');
  if (!hasLower) errors.push('Password must contain at least one lowercase letter');
  if (!hasNumber) errors.push('Password must contain at least one number');
  if (!hasSpecial) errors.push('Password must contain at least one special character');
  
  // Calculate strength
  if (password.length >= 12 && hasUpper && hasLower && hasNumber && hasSpecial) {
    strength = 'strong';
  } else if (password.length >= 8 && hasUpper && hasLower && hasNumber) {
    strength = 'medium';
  }
  
  return { valid: errors.length === 0, data: password, errors, strength };
}

/**
 * Validate room code
 */
export function validateRoomCode(code: string): ValidationResult<string> {
  if (!code || typeof code !== 'string') {
    return { valid: false, errors: ['Room code is required'] };
  }
  
  const normalized = code.trim().toUpperCase();
  
  if (!VALIDATION_PATTERNS.ROOM_CODE.test(normalized)) {
    return { valid: false, errors: ['Room code must be 6 alphanumeric characters'] };
  }
  
  return { valid: true, data: normalized, errors: [] };
}

/**
 * Validate game answer
 */
export function validateGameAnswer(answer: string): ValidationResult<string> {
  const errors: string[] = [];
  
  if (!answer || typeof answer !== 'string') {
    return { valid: false, errors: ['Answer is required'] };
  }
  
  const trimmed = answer.trim();
  
  if (trimmed.length < VALIDATION_LIMITS.ANSWER_MIN) {
    errors.push(`Answer must be at least ${VALIDATION_LIMITS.ANSWER_MIN} character`);
  }
  
  if (trimmed.length > VALIDATION_LIMITS.ANSWER_MAX) {
    errors.push(`Answer must be less than ${VALIDATION_LIMITS.ANSWER_MAX} characters`);
  }
  
  if (containsPersonalInfo(trimmed)) {
    errors.push('Answer should not contain personal information');
  }
  
  return { valid: errors.length === 0, data: trimmed, errors };
}

/**
 * Validate custom question
 */
export function validateCustomQuestion(question: string): ValidationResult<string> {
  const errors: string[] = [];
  
  if (!question || typeof question !== 'string') {
    return { valid: false, errors: ['Question is required'] };
  }
  
  const trimmed = question.trim();
  
  if (trimmed.length < VALIDATION_LIMITS.CUSTOM_QUESTION_MIN) {
    errors.push(`Question must be at least ${VALIDATION_LIMITS.CUSTOM_QUESTION_MIN} characters`);
  }
  
  if (trimmed.length > VALIDATION_LIMITS.CUSTOM_QUESTION_MAX) {
    errors.push(`Question must be less than ${VALIDATION_LIMITS.CUSTOM_QUESTION_MAX} characters`);
  }
  
  return { valid: errors.length === 0, data: trimmed, errors };
}

/**
 * Validate custom answer array
 */
export function validateCustomAnswers(answers: string[]): ValidationResult<string[]> {
  const errors: string[] = [];
  const validatedAnswers: string[] = [];
  
  if (!Array.isArray(answers)) {
    return { valid: false, errors: ['Answers must be an array'] };
  }
  
  if (answers.length !== VALIDATION_LIMITS.CUSTOM_ANSWERS_COUNT) {
    errors.push(`Must provide exactly ${VALIDATION_LIMITS.CUSTOM_ANSWERS_COUNT} answers`);
  }
  
  for (let i = 0; i < answers.length; i++) {
    const answer = answers[i];
    const result = validateGameAnswer(answer);
    
    if (!result.valid) {
      errors.push(`Answer ${i + 1}: ${result.errors.join(', ')}`);
    } else if (result.data !== undefined) {
      validatedAnswers.push(result.data);
    }
  }
  
  // Check for duplicates
  const uniqueAnswers = new Set(validatedAnswers.map(a => a.toLowerCase()));
  if (uniqueAnswers.size !== validatedAnswers.length) {
    errors.push('Answers must be unique');
  }
  
  return { valid: errors.length === 0, data: validatedAnswers, errors };
}

/**
 * Validate turn duration
 */
export function validateTurnDuration(duration: number): ValidationResult<number> {
  return validateNumberRange(
    duration,
    VALIDATION_LIMITS.MIN_TURN_DURATION,
    VALIDATION_LIMITS.MAX_TURN_DURATION,
    'Turn duration'
  );
}

/**
 * Validate player count
 */
export function validatePlayerCount(count: number): ValidationResult<number> {
  return validateNumberRange(
    count,
    VALIDATION_LIMITS.MIN_PLAYERS,
    VALIDATION_LIMITS.MAX_PLAYERS,
    'Player count'
  );
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check if text contains personal information
 */
function containsPersonalInfo(text: string): boolean {
  return (
    VALIDATION_PATTERNS.PHONE_NUMBER.test(text) ||
    VALIDATION_PATTERNS.CREDIT_CARD.test(text) ||
    VALIDATION_PATTERNS.SSN.test(text) ||
    VALIDATION_PATTERNS.EMAIL.test(text)
  );
}

/**
 * Combine multiple validation results
 */
export function combineValidationResults(...results: ValidationResult[]): ValidationResult {
  const allErrors = results.flatMap(r => r.errors);
  return {
    valid: results.every(r => r.valid),
    errors: allErrors,
  };
}

/**
 * Create a validator function from rules
 */
export function createValidator<T>(
  rules: ValidationRule<T>[]
): (value: T) => ValidationResult<T> {
  return (value: T) => {
    const errors: string[] = [];
    
    for (const rule of rules) {
      if (!rule.validate(value)) {
        errors.push(rule.message);
      }
    }
    
    return {
      valid: errors.length === 0,
      data: errors.length === 0 ? value : undefined,
      errors,
    };
  };
}

// ============================================
// COMPOSITE VALIDATORS
// ============================================

/**
 * Validate user registration data
 */
export function validateRegistration(data: {
  email: string;
  password: string;
  displayName?: string;
}): ValidationResult<{ email: string; password: string; displayName?: string }> {
  const emailResult = validateEmail(data.email);
  const passwordResult = validatePassword(data.password);
  const nameResult = data.displayName ? validateDisplayName(data.displayName) : { valid: true, errors: [] };
  
  const combined = combineValidationResults(emailResult, passwordResult, nameResult);
  
  return {
    ...combined,
    data: combined.valid ? {
      email: emailResult.data!,
      password: passwordResult.data!,
      displayName: data.displayName ? nameResult.data as string : undefined,
    } : undefined,
  };
}

/**
 * Validate room creation data
 */
export function validateRoomCreation(data: {
  hostName: string;
  maxPlayers?: number;
  turnDuration?: number;
}): ValidationResult<{ hostName: string; maxPlayers: number; turnDuration: number }> {
  const nameResult = validateDisplayName(data.hostName);
  const playersResult = data.maxPlayers !== undefined 
    ? validatePlayerCount(data.maxPlayers)
    : { valid: true, data: VALIDATION_LIMITS.MAX_PLAYERS, errors: [] };
  const durationResult = data.turnDuration !== undefined
    ? validateTurnDuration(data.turnDuration)
    : { valid: true, data: VALIDATION_LIMITS.DEFAULT_TURN_DURATION, errors: [] };
  
  const combined = combineValidationResults(nameResult, playersResult, durationResult);
  
  return {
    ...combined,
    data: combined.valid ? {
      hostName: nameResult.data!,
      maxPlayers: playersResult.data!,
      turnDuration: durationResult.data!,
    } : undefined,
  };
}

export default {
  // Constants
  VALIDATION_LIMITS,
  VALIDATION_PATTERNS,
  
  // Base validators
  validateLength,
  validatePattern,
  validateNumberRange,
  
  // Field validators
  validateEmail,
  validateDisplayName,
  validatePassword,
  validateRoomCode,
  validateGameAnswer,
  validateCustomQuestion,
  validateCustomAnswers,
  validateTurnDuration,
  validatePlayerCount,
  
  // Composite validators
  validateRegistration,
  validateRoomCreation,
  
  // Utilities
  combineValidationResults,
  createValidator,
};
