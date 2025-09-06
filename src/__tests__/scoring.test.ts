// Unit tests for the centralized scoring system
import { 
  pointsForRank, 
  pointsForAnswerIndex, 
  calculateTotalPoints, 
  rankFromPoints, 
  validateScoring,
  getScoringInfo 
} from '../services/scoring';

describe('Scoring System', () => {
  describe('pointsForRank', () => {
    test('should calculate correct points for rank 1', () => {
      expect(pointsForRank(1)).toBe(1);
    });

    test('should calculate correct points for rank 5', () => {
      expect(pointsForRank(5)).toBe(5);
    });

    test('should calculate correct points for rank 10', () => {
      expect(pointsForRank(10)).toBe(10);
    });

    test('should handle invalid ranks gracefully', () => {
      expect(pointsForRank(0)).toBe(1); // fallback
      expect(pointsForRank(11)).toBe(10); // fallback
      expect(pointsForRank(-1)).toBe(1); // fallback
    });
  });

  describe('pointsForAnswerIndex', () => {
    test('should convert 0-based index to correct points', () => {
      expect(pointsForAnswerIndex(0)).toBe(1); // rank 1
      expect(pointsForAnswerIndex(4)).toBe(5);  // rank 5
      expect(pointsForAnswerIndex(9)).toBe(10);  // rank 10
    });
  });

  describe('calculateTotalPoints', () => {
    test('should calculate total points for multiple correct answers', () => {
      const correctAnswers = [0, 2, 4]; // ranks 1, 3, 5
      const expectedTotal = 1 + 3 + 5; // 9
      expect(calculateTotalPoints(correctAnswers)).toBe(expectedTotal);
    });

    test('should handle empty array', () => {
      expect(calculateTotalPoints([])).toBe(0);
    });
  });

  describe('rankFromPoints', () => {
    test('should convert points back to rank', () => {
      expect(rankFromPoints(1)).toBe(1);
      expect(rankFromPoints(5)).toBe(5);
      expect(rankFromPoints(10)).toBe(10);
    });

    test('should return null for invalid points', () => {
      expect(rankFromPoints(0)).toBeNull();
      expect(rankFromPoints(11)).toBeNull();
    });
  });

  describe('validateScoring', () => {
    test('should validate correct scoring calculations', () => {
      expect(validateScoring(1, 1)).toBe(true);
      expect(validateScoring(5, 5)).toBe(true);
      expect(validateScoring(10, 10)).toBe(true);
    });

    test('should reject incorrect scoring calculations', () => {
      expect(validateScoring(1, 5)).toBe(false);
      expect(validateScoring(5, 1)).toBe(false);
    });
  });

  describe('getScoringInfo', () => {
    test('should return correct scoring information', () => {
      const info = getScoringInfo(1);
      expect(info.rank).toBe(1);
      expect(info.points).toBe(1);
      expect(info.displayText).toBe('#1 = 1 points');
    });
  });
});
