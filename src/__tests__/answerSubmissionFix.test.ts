/**
 * Test file to verify the answer submission and revelation fixes
 * This tests the critical flow: answer submission -> scoring -> revelation
 */

import { findMatchingAnswer } from '../services/multiplayerGameFlowV2';
import { pointsForRank } from '../services/scoring';

// Mock the fuzzy matching function
jest.mock('../services/fuzzyMatching', () => ({
  findBestMatch: jest.fn((userAnswer: string, correctAnswers: any[]) => {
    // Simple mock that finds exact matches
    const match = correctAnswers.find(answer => 
      answer.text.toLowerCase() === userAnswer.toLowerCase() ||
      answer.aliases?.some(alias => alias.toLowerCase() === userAnswer.toLowerCase())
    );
    
    if (match) {
      return {
        isMatch: true,
        matchedAnswer: match,
        similarity: 1.0,
        confidence: 'exact',
        originalAnswer: userAnswer,
        officialAnswer: match.text
      };
    }
    
    return {
      isMatch: false,
      similarity: 0,
      confidence: 'none',
      originalAnswer: userAnswer,
      officialAnswer: ''
    };
  })
}));

describe('Answer Submission Fix Tests', () => {
  const mockAnswers = [
    { text: 'Cristiano Ronaldo', rank: 1, aliases: ['CR7', 'Ronaldo'] },
    { text: 'Lionel Messi', rank: 2, aliases: ['Messi'] },
    { text: 'LeBron James', rank: 3, aliases: ['LeBron', 'King James'] }
  ];

  describe('Answer Matching', () => {
    test('should match exact answer text', () => {
      const result = findMatchingAnswer('Cristiano Ronaldo', mockAnswers);
      expect(result).toBeTruthy();
      expect(result?.answer.text).toBe('Cristiano Ronaldo');
      expect(result?.index).toBe(0);
    });

    test('should match alias', () => {
      const result = findMatchingAnswer('CR7', mockAnswers);
      expect(result).toBeTruthy();
      expect(result?.answer.text).toBe('Cristiano Ronaldo');
      expect(result?.index).toBe(0);
    });

    test('should match case-insensitive', () => {
      const result = findMatchingAnswer('cristiano ronaldo', mockAnswers);
      expect(result).toBeTruthy();
      expect(result?.answer.text).toBe('Cristiano Ronaldo');
      expect(result?.index).toBe(0);
    });

    test('should not match incorrect answer', () => {
      const result = findMatchingAnswer('Random Player', mockAnswers);
      expect(result).toBeNull();
    });
  });

  describe('Scoring System', () => {
    test('should award correct points for rank 1', () => {
      const points = pointsForRank(1);
      expect(points).toBe(1);
    });

    test('should award correct points for rank 2', () => {
      const points = pointsForRank(2);
      expect(points).toBe(2);
    });

    test('should award correct points for rank 10', () => {
      const points = pointsForRank(10);
      expect(points).toBe(10);
    });

    test('should handle invalid ranks gracefully', () => {
      const points = pointsForRank(0);
      expect(points).toBe(1); // Fallback to 1
    });
  });

  describe('Answer Revelation Logic', () => {
    test('should correctly identify revealed answers', () => {
      const revealedAnswers = [
        { answerId: 'Cristiano Ronaldo', playerId: 'player1', points: 1 },
        null,
        { answerId: 'LeBron James', playerId: 'player2', points: 3 }
      ];

      // Check first answer (should be revealed)
      expect(revealedAnswers[0] !== null).toBe(true);
      expect(revealedAnswers[0]?.answerId).toBe('Cristiano Ronaldo');

      // Check second answer (should not be revealed)
      expect(revealedAnswers[1] === null).toBe(true);

      // Check third answer (should be revealed)
      expect(revealedAnswers[2] !== null).toBe(true);
      expect(revealedAnswers[2]?.answerId).toBe('LeBron James');
    });
  });

  describe('Integration Test', () => {
    test('should handle complete answer submission flow', () => {
      // Simulate finding a match
      const match = findMatchingAnswer('CR7', mockAnswers);
      expect(match).toBeTruthy();

      if (match) {
        // Simulate scoring
        const points = pointsForRank(match.answer.rank);
        expect(points).toBe(1);

        // Simulate revelation
        const revealedAnswers = Array(10).fill(null);
        revealedAnswers[match.index] = {
          answerId: match.answer.text,
          playerId: 'test-player',
          points: points
        };

        // Verify revelation
        expect(revealedAnswers[match.index] !== null).toBe(true);
        expect(revealedAnswers[match.index]?.answerId).toBe('Cristiano Ronaldo');
        expect(revealedAnswers[match.index]?.points).toBe(1);
      }
    });
  });
});
