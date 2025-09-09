import { findMatchingAnswer } from './fuzzyMatching';
import { calculatePoints } from './scoring';
import { Answer } from '../types/game';

export interface ValidationResult {
  isValid: boolean;
  isCorrect: boolean;
  matchedAnswer?: Answer;
  points?: number;
  error?: string;
  sanitizedAnswer?: string;
}

export class AnswerValidationService {
  /**
   * Validate answer against correct answer list
   * @param userAnswer - The answer submitted by the user
   * @param correctAnswers - Array of correct answers for the current question
   * @returns ValidationResult with validation details
   */
  static validateAnswer(userAnswer: string, correctAnswers: Answer[]): ValidationResult {
    try {
      // Sanitize input
      const sanitizedAnswer = userAnswer.trim().toLowerCase();
      
      if (!sanitizedAnswer) {
        return {
          isValid: false,
          isCorrect: false,
          error: 'Answer cannot be empty'
        };
      }
      
      if (sanitizedAnswer.length < 2) {
        return {
          isValid: false,
          isCorrect: false,
          error: 'Answer must be at least 2 characters long'
        };
      }
      
      if (sanitizedAnswer.length > 100) {
        return {
          isValid: false,
          isCorrect: false,
          error: 'Answer must be less than 100 characters'
        };
      }
      
      // Check for profanity or inappropriate content
      if (this.containsProfanity(sanitizedAnswer)) {
        return {
          isValid: false,
          isCorrect: false,
          error: 'Answer contains inappropriate content'
        };
      }
      
      // Find matching answer using fuzzy matching
      const match = findMatchingAnswer(sanitizedAnswer, correctAnswers);
      
      if (match) {
        const { answer, index } = match;
        const points = calculatePoints(answer.rank);
        
        return {
          isValid: true,
          isCorrect: true,
          matchedAnswer: answer,
          points,
          sanitizedAnswer: userAnswer.trim() // Return original case for display
        };
      } else {
        return {
          isValid: true,
          isCorrect: false,
          sanitizedAnswer: userAnswer.trim()
        };
      }
    } catch (error) {
      console.error('AnswerValidationService.validateAnswer error:', error);
      return {
        isValid: false,
        isCorrect: false,
        error: 'Validation failed due to an error'
      };
    }
  }
  
  /**
   * Check if answer contains profanity or inappropriate content
   * @param answer - The answer to check
   * @returns true if contains profanity, false otherwise
   */
  private static containsProfanity(answer: string): boolean {
    // Simple profanity filter - in production, use a more sophisticated library
    const profanityWords = [
      'fuck', 'shit', 'damn', 'bitch', 'ass', 'hell', 'crap',
      'stupid', 'idiot', 'moron', 'retard', 'gay', 'fag'
    ];
    
    const lowerAnswer = answer.toLowerCase();
    return profanityWords.some(word => lowerAnswer.includes(word));
  }
  
  /**
   * Validate answer format and length
   * @param answer - The answer to validate
   * @returns true if format is valid, false otherwise
   */
  static validateFormat(answer: string): { isValid: boolean; error?: string } {
    if (!answer || typeof answer !== 'string') {
      return { isValid: false, error: 'Answer must be a string' };
    }
    
    const trimmed = answer.trim();
    
    if (trimmed.length === 0) {
      return { isValid: false, error: 'Answer cannot be empty' };
    }
    
    if (trimmed.length < 2) {
      return { isValid: false, error: 'Answer must be at least 2 characters long' };
    }
    
    if (trimmed.length > 100) {
      return { isValid: false, error: 'Answer must be less than 100 characters' };
    }
    
    // Check for excessive special characters
    const specialCharCount = (trimmed.match(/[^a-zA-Z0-9\s]/g) || []).length;
    if (specialCharCount > trimmed.length * 0.5) {
      return { isValid: false, error: 'Answer contains too many special characters' };
    }
    
    return { isValid: true };
  }
  
  /**
   * Get validation statistics for analytics
   * @param answers - Array of submitted answers
   * @returns Validation statistics
   */
  static getValidationStats(answers: string[]): {
    totalAnswers: number;
    validAnswers: number;
    invalidAnswers: number;
    averageLength: number;
    commonErrors: { [error: string]: number };
  } {
    const stats = {
      totalAnswers: answers.length,
      validAnswers: 0,
      invalidAnswers: 0,
      averageLength: 0,
      commonErrors: {} as { [error: string]: number }
    };
    
    let totalLength = 0;
    
    answers.forEach(answer => {
      const formatCheck = this.validateFormat(answer);
      if (formatCheck.isValid) {
        stats.validAnswers++;
        totalLength += answer.trim().length;
      } else {
        stats.invalidAnswers++;
        const error = formatCheck.error || 'Unknown error';
        stats.commonErrors[error] = (stats.commonErrors[error] || 0) + 1;
      }
    });
    
    stats.averageLength = stats.validAnswers > 0 ? totalLength / stats.validAnswers : 0;
    
    return stats;
  }
}


