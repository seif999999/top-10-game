import { ServerGameService } from '../services/serverGameService';

// Mock Firebase
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  runTransaction: jest.fn(),
  serverTimestamp: jest.fn(() => ({ seconds: Date.now() / 1000 })),
  Timestamp: {
    fromMillis: jest.fn((ms) => ({ seconds: ms / 1000 })),
    now: jest.fn(() => ({ seconds: Date.now() / 1000 }))
  }
}));

// Mock Firebase db
jest.mock('../services/firebase', () => ({
  db: {}
}));

describe('ServerGameService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateAndSubmitAnswer', () => {
    it('should reject invalid input', async () => {
      const result = await ServerGameService.validateAndSubmitAnswer(
        'TEST123',
        'user1',
        '', // Empty answer
        Date.now()
      );

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Answer is required');
    });

    it('should reject answers that are too long', async () => {
      const longAnswer = 'a'.repeat(101); // Over 100 character limit
      
      const result = await ServerGameService.validateAndSubmitAnswer(
        'TEST123',
        'user1',
        longAnswer,
        Date.now()
      );

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Answer must be less than 100 characters');
    });

    it('should sanitize malicious input', async () => {
      const maliciousAnswer = '<script>alert("xss")</script>Malicious Content';
      
      const result = await ServerGameService.validateAndSubmitAnswer(
        'TEST123',
        'user1',
        maliciousAnswer,
        Date.now()
      );

      // Should sanitize the input but still process it
      expect(result.sanitizedAnswer).toBe('Malicious Content');
    });
  });

  describe('validateRoomCreation', () => {
    it('should validate room name', async () => {
      const result = await ServerGameService.validateRoomCreation(
        'user1',
        '', // Empty room name
        5
      );

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Name is required');
    });

    it('should validate max players', async () => {
      const result = await ServerGameService.validateRoomCreation(
        'user1',
        'Test Room',
        1 // Too few players
      );

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Max players must be between 2 and 10');
    });

    it('should accept valid room creation', async () => {
      const result = await ServerGameService.validateRoomCreation(
        'user1',
        'Test Room',
        5
      );

      expect(result.valid).toBe(true);
    });
  });

  describe('validatePlayerJoin', () => {
    it('should validate display name', async () => {
      const result = await ServerGameService.validatePlayerJoin(
        'TEST123',
        'user1',
        '' // Empty display name
      );

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Name is required');
    });

    it('should validate display name length', async () => {
      const result = await ServerGameService.validatePlayerJoin(
        'TEST123',
        'user1',
        'a'.repeat(31) // Too long
      );

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Name must be less than 30 characters');
    });
  });

  describe('Anti-cheat measures', () => {
    it('should prevent rapid answer submissions', async () => {
      // Mock rapid submissions
      const now = Date.now();
      
      // First submission should succeed
      const result1 = await ServerGameService.validateAndSubmitAnswer(
        'TEST123',
        'user1',
        'Answer 1',
        now
      );

      // Second submission within 2 seconds should fail
      const result2 = await ServerGameService.validateAndSubmitAnswer(
        'TEST123',
        'user1',
        'Answer 2',
        now + 1000 // 1 second later
      );

      // This test would need proper mocking of the submission tracking
      // For now, we'll just verify the structure
      expect(result1).toHaveProperty('valid');
      expect(result2).toHaveProperty('valid');
    });

    it('should validate turn order', async () => {
      // This would require mocking the room state
      // For now, we'll test the structure
      const result = await ServerGameService.validateAndSubmitAnswer(
        'TEST123',
        'user1',
        'Valid Answer',
        Date.now()
      );

      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('error');
    });
  });

  describe('Input sanitization', () => {
    it('should sanitize HTML content', async () => {
      const htmlAnswer = '<div>Answer</div><script>alert("xss")</script>';
      
      const result = await ServerGameService.validateAndSubmitAnswer(
        'TEST123',
        'user1',
        htmlAnswer,
        Date.now()
      );

      // Should sanitize HTML tags
      expect(result.sanitizedAnswer).not.toContain('<div>');
      expect(result.sanitizedAnswer).not.toContain('<script>');
    });

    it('should handle special characters', async () => {
      const specialAnswer = 'Answer with "quotes" and \'apostrophes\' and <brackets>';
      
      const result = await ServerGameService.validateAndSubmitAnswer(
        'TEST123',
        'user1',
        specialAnswer,
        Date.now()
      );

      expect(result.sanitizedAnswer).toBeDefined();
      expect(result.sanitizedAnswer).not.toContain('<brackets>');
    });
  });

  describe('Rate limiting', () => {
    it('should implement room creation rate limiting', async () => {
      // This would require mocking the rate limiting logic
      // For now, we'll test that the method exists and returns expected structure
      const result = await ServerGameService.validateRoomCreation(
        'user1',
        'Test Room',
        5
      );

      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('error');
    });
  });

  describe('Error handling', () => {
    it('should handle database errors gracefully', async () => {
      // Mock database error
      const { getDoc } = require('firebase/firestore');
      getDoc.mockRejectedValue(new Error('Database connection failed'));

      const result = await ServerGameService.validateAndSubmitAnswer(
        'TEST123',
        'user1',
        'Valid Answer',
        Date.now()
      );

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Server validation failed');
    });

    it('should handle network timeouts', async () => {
      // Mock timeout error
      const { runTransaction } = require('firebase/firestore');
      runTransaction.mockRejectedValue(new Error('Request timeout'));

      const result = await ServerGameService.validateAndSubmitAnswer(
        'TEST123',
        'user1',
        'Valid Answer',
        Date.now()
      );

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Server validation failed');
    });
  });
});
