import { sanitizeText } from '../utils/textSanitizer';
import { ExternalModerationService } from './externalModerationService';
import { ModerationLoggingService } from './moderationLoggingService';
import { logger } from '../utils/logger';

export interface ModerationResult {
  approved: boolean;
  reason?: string;
  confidence?: number;
  suggestions?: string[];
  flaggedContent?: string[];
}

export interface ModerationLog {
  id: string;
  userId: string;
  content: string;
  contentType: 'displayName' | 'gameAnswer' | 'roomName' | 'chatMessage';
  result: ModerationResult;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface ProfanityEntry {
  word: string;
  severity: 'low' | 'medium' | 'high';
  category: 'general' | 'sexual' | 'violent' | 'hate' | 'drug' | 'alcohol';
}

export class ContentModerationService {
  private static profanityList: ProfanityEntry[] = [
    // General profanity (low severity)
    { word: 'damn', severity: 'low', category: 'general' },
    { word: 'hell', severity: 'low', category: 'general' },
    { word: 'crap', severity: 'low', category: 'general' },
    { word: 'stupid', severity: 'low', category: 'general' },
    { word: 'idiot', severity: 'low', category: 'general' },
    
    // Medium severity
    { word: 'ass', severity: 'medium', category: 'general' },
    { word: 'bitch', severity: 'medium', category: 'general' },
    { word: 'bastard', severity: 'medium', category: 'general' },
    { word: 'piss', severity: 'medium', category: 'general' },
    
    // High severity - these should be blocked
    { word: 'fuck', severity: 'high', category: 'general' },
    { word: 'shit', severity: 'high', category: 'general' },
    { word: 'bitch', severity: 'high', category: 'general' },
    { word: 'whore', severity: 'high', category: 'sexual' },
    { word: 'slut', severity: 'high', category: 'sexual' },
    { word: 'fag', severity: 'high', category: 'hate' },
    { word: 'nigger', severity: 'high', category: 'hate' },
    { word: 'kike', severity: 'high', category: 'hate' },
    { word: 'chink', severity: 'high', category: 'hate' },
    { word: 'spic', severity: 'high', category: 'hate' },
    { word: 'retard', severity: 'high', category: 'hate' },
    { word: 'kill', severity: 'high', category: 'violent' },
    { word: 'murder', severity: 'high', category: 'violent' },
    { word: 'suicide', severity: 'high', category: 'violent' },
    { word: 'bomb', severity: 'high', category: 'violent' },
    { word: 'gun', severity: 'high', category: 'violent' },
    { word: 'weapon', severity: 'high', category: 'violent' },
    { word: 'drug', severity: 'high', category: 'drug' },
    { word: 'cocaine', severity: 'high', category: 'drug' },
    { word: 'heroin', severity: 'high', category: 'drug' },
    { word: 'marijuana', severity: 'high', category: 'drug' },
    { word: 'alcohol', severity: 'high', category: 'alcohol' },
    { word: 'drunk', severity: 'high', category: 'alcohol' },
  ];

  private static inappropriatePatterns: RegExp[] = [
    // Phone numbers
    /(\d{3}[-.]?\d{3}[-.]?\d{4})/,
    /(\+\d{1,3}[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9})/,
    
    // Email addresses
    /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/,
    
    // Social Security Numbers (US)
    /\b\d{3}-?\d{2}-?\d{4}\b/,
    
    // Credit card numbers (basic pattern)
    /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/,
    
    // URLs
    /(https?:\/\/[^\s]+)/,
    
    // IP addresses
    /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/,
    
    // Common personal information patterns
    /\b(ssn|social security|credit card|bank account|routing number)\b/i,
    /\b(address|home address|street address|zip code|postal code)\b/i,
    /\b(phone|telephone|cell phone|mobile number)\b/i,
    /\b(birthday|birth date|date of birth|age|dob)\b/i,
  ];

  private static moderationLogs: ModerationLog[] = [];

  /**
   * Moderate content for inappropriate language and personal information
   */
  static async moderateContent(
    content: string,
    contentType: ModerationLog['contentType'],
    userId: string,
    metadata?: { ipAddress?: string; userAgent?: string }
  ): Promise<ModerationResult> {
    try {
      // Sanitize input first
      const sanitizedContent = sanitizeText(content, 500);
      
      // Check for profanity
      const profanityCheck = this.checkProfanity(sanitizedContent);
      if (!profanityCheck.approved) {
        return this.createModerationResult(false, profanityCheck.reason, 0.9, profanityCheck.suggestions, profanityCheck.flaggedContent);
      }

      // Check for personal information
      const personalInfoCheck = this.checkPersonalInfo(sanitizedContent);
      if (!personalInfoCheck.approved) {
        return this.createModerationResult(false, personalInfoCheck.reason, 0.95, personalInfoCheck.suggestions, personalInfoCheck.flaggedContent);
      }

      // Check for spam patterns
      const spamCheck = this.checkSpamPatterns(sanitizedContent);
      if (!spamCheck.approved) {
        return this.createModerationResult(false, spamCheck.reason, 0.8, spamCheck.suggestions, spamCheck.flaggedContent);
      }

      // External moderation service (if available)
      const externalResult = await ExternalModerationService.moderateContent(sanitizedContent);
      if (!externalResult.approved) {
        return this.createModerationResult(
          false, 
          externalResult.reason, 
          externalResult.confidence, 
          externalResult.suggestions, 
          [sanitizedContent]
        );
      }

      // Log successful moderation
      const logEntry = {
        id: this.generateLogId(),
        userId,
        content: sanitizedContent,
        contentType,
        result: { approved: true },
        timestamp: new Date(),
        ipAddress: metadata?.ipAddress,
        userAgent: metadata?.userAgent,
      };
      
      this.logModeration(logEntry);
      ModerationLoggingService.logModeration(logEntry);

      return this.createModerationResult(true, undefined, 1.0);
    } catch (error) {
      logger.error('Content moderation error:', error);
      
      // Log error
      const errorLogEntry = {
        id: this.generateLogId(),
        userId,
        content,
        contentType,
        result: { approved: false, reason: 'moderation_error' },
        timestamp: new Date(),
        ipAddress: metadata?.ipAddress,
        userAgent: metadata?.userAgent,
      };
      
      this.logModeration(errorLogEntry);
      ModerationLoggingService.logModeration(errorLogEntry);

      // Default to blocking content on error for safety
      return this.createModerationResult(false, 'Content moderation failed. Please try again.', 0.5);
    }
  }

  /**
   * Check content for profanity
   */
  private static checkProfanity(content: string): { approved: boolean; reason?: string; suggestions?: string[]; flaggedContent?: string[] } {
    const normalizedContent = content.toLowerCase();
    const flaggedWords: string[] = [];
    const suggestions: string[] = [];

    for (const entry of this.profanityList) {
      const wordPattern = new RegExp(`\\b${entry.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      if (wordPattern.test(normalizedContent)) {
        flaggedWords.push(entry.word);
        
        // High severity words are always blocked
        if (entry.severity === 'high') {
          return {
            approved: false,
            reason: `Content contains inappropriate language (${entry.category})`,
            suggestions: ['Please use appropriate language'],
            flaggedContent: flaggedWords
          };
        }
        
        // Medium severity words get warnings
        if (entry.severity === 'medium') {
          suggestions.push(`Consider using more appropriate language instead of "${entry.word}"`);
        }
      }
    }

    if (flaggedWords.length > 0) {
      return {
        approved: suggestions.length === 0, // Only approve if no medium severity words
        reason: suggestions.length > 0 ? 'Content contains language that may be inappropriate' : undefined,
        suggestions: suggestions.length > 0 ? suggestions : undefined,
        flaggedContent: flaggedWords
      };
    }

    return { approved: true };
  }

  /**
   * Check content for personal information
   */
  private static checkPersonalInfo(content: string): { approved: boolean; reason?: string; suggestions?: string[]; flaggedContent?: string[] } {
    const flaggedPatterns: string[] = [];
    const suggestions: string[] = [];

    for (const pattern of this.inappropriatePatterns) {
      const matches = content.match(pattern);
      if (matches) {
        flaggedPatterns.push(...matches);
        suggestions.push('Please do not share personal information');
      }
    }

    if (flaggedPatterns.length > 0) {
      return {
        approved: false,
        reason: 'Content contains personal information that should not be shared',
        suggestions,
        flaggedContent: flaggedPatterns
      };
    }

    return { approved: true };
  }

  /**
   * Check content for spam patterns
   */
  private static checkSpamPatterns(content: string): { approved: boolean; reason?: string; suggestions?: string[]; flaggedContent?: string[] } {
    // Check for excessive repetition
    const words = content.toLowerCase().split(/\s+/);
    const wordCounts = new Map<string, number>();
    
    for (const word of words) {
      if (word.length > 2) { // Ignore short words
        wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
      }
    }

    // Check for words repeated more than 3 times
    const repeatedWords = Array.from(wordCounts.entries())
      .filter(([_, count]) => count > 3)
      .map(([word, _]) => word);

    if (repeatedWords.length > 0) {
      return {
        approved: false,
        reason: 'Content appears to be spam (excessive repetition)',
        suggestions: ['Please avoid repeating words excessively'],
        flaggedContent: repeatedWords
      };
    }

    // Check for excessive capitalization
    const upperCaseRatio = (content.match(/[A-Z]/g) || []).length / content.length;
    if (upperCaseRatio > 0.5 && content.length > 10) {
      return {
        approved: false,
        reason: 'Content appears to be spam (excessive capitalization)',
        suggestions: ['Please use normal capitalization'],
        flaggedContent: [content]
      };
    }

    // Check for excessive punctuation
    const punctuationRatio = (content.match(/[!@#$%^&*(),.?":{}|<>]/g) || []).length / content.length;
    if (punctuationRatio > 0.3 && content.length > 10) {
      return {
        approved: false,
        reason: 'Content appears to be spam (excessive punctuation)',
        suggestions: ['Please use normal punctuation'],
        flaggedContent: [content]
      };
    }

    return { approved: true };
  }


  /**
   * Check for hate speech patterns
   */
  private static checkForHateSpeech(content: string): ModerationResult {
    const hateSpeechPatterns = [
      /\b(kill|murder|destroy)\s+(all|every)\s+(black|white|jewish|muslim|gay|trans)\b/i,
      /\b(black|white|jewish|muslim|gay|trans)\s+(people|person)\s+(should|must)\s+(die|be killed)\b/i,
      /\b(hitler|nazi|kkk|white supremacy|white power)\b/i,
    ];

    for (const pattern of hateSpeechPatterns) {
      if (pattern.test(content)) {
        return {
          approved: false,
          reason: 'Content contains hate speech',
          confidence: 0.95,
          suggestions: ['Please use respectful language'],
          flaggedContent: [content.match(pattern)?.[0] || '']
        };
      }
    }

    return { approved: true };
  }

  /**
   * Check for toxicity
   */
  private static checkForToxicity(content: string): ModerationResult {
    const toxicPatterns = [
      /\b(you\s+(are|re)\s+)?(stupid|dumb|idiot|moron|retard)\b/i,
      /\b(go\s+)?(die|kill\s+yourself|kys)\b/i,
      /\b(fuck\s+you|fuck\s+off|piss\s+off)\b/i,
    ];

    for (const pattern of toxicPatterns) {
      if (pattern.test(content)) {
        return {
          approved: false,
          reason: 'Content is toxic or harassing',
          confidence: 0.9,
          suggestions: ['Please be respectful to other users'],
          flaggedContent: [content.match(pattern)?.[0] || '']
        };
      }
    }

    return { approved: true };
  }

  /**
   * Check for sexual content
   */
  private static checkForSexualContent(content: string): ModerationResult {
    const sexualPatterns = [
      /\b(sex|sexual|porn|pornography|nude|naked)\b/i,
      /\b(penis|vagina|breast|boob|ass|butt)\b/i,
      /\b(fuck|fucking|fucked|fucks)\b/i,
    ];

    for (const pattern of sexualPatterns) {
      if (pattern.test(content)) {
        return {
          approved: false,
          reason: 'Content contains sexual content',
          confidence: 0.9,
          suggestions: ['Please keep content appropriate for all ages'],
          flaggedContent: [content.match(pattern)?.[0] || '']
        };
      }
    }

    return { approved: true };
  }

  /**
   * Create moderation result object
   */
  private static createModerationResult(
    approved: boolean,
    reason?: string,
    confidence?: number,
    suggestions?: string[],
    flaggedContent?: string[]
  ): ModerationResult {
    return {
      approved,
      reason,
      confidence,
      suggestions,
      flaggedContent
    };
  }

  /**
   * Log moderation activity
   */
  private static logModeration(log: ModerationLog): void {
    this.moderationLogs.push(log);
    
    // In production, this would be sent to a logging service
    logger.log('Content moderation log:', {
      id: log.id,
      userId: log.userId,
      contentType: log.contentType,
      approved: log.result.approved,
      reason: log.result.reason,
      timestamp: log.timestamp
    });
  }

  /**
   * Generate unique log ID
   */
  private static generateLogId(): string {
    return `mod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get moderation logs for a user
   */
  static getModerationLogs(userId: string): ModerationLog[] {
    return this.moderationLogs.filter(log => log.userId === userId);
  }

  /**
   * Get all moderation logs (admin function)
   */
  static getAllModerationLogs(): ModerationLog[] {
    return [...this.moderationLogs];
  }

  /**
   * Get moderation statistics
   */
  static getModerationStats(): {
    totalModerations: number;
    approvedCount: number;
    rejectedCount: number;
    rejectionReasons: { [reason: string]: number };
  } {
    const total = this.moderationLogs.length;
    const approved = this.moderationLogs.filter(log => log.result.approved).length;
    const rejected = total - approved;
    
    const rejectionReasons: { [reason: string]: number } = {};
    this.moderationLogs
      .filter(log => !log.result.approved && log.result.reason)
      .forEach(log => {
        const reason = log.result.reason!;
        rejectionReasons[reason] = (rejectionReasons[reason] || 0) + 1;
      });

    return {
      totalModerations: total,
      approvedCount: approved,
      rejectedCount: rejected,
      rejectionReasons
    };
  }

  /**
   * Clean up old moderation logs (should be called periodically)
   */
  static cleanupOldLogs(daysToKeep: number = 30): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    this.moderationLogs = this.moderationLogs.filter(log => log.timestamp > cutoffDate);
  }
}

export default ContentModerationService;
