import { 
  findBestMatch, 
  validateAnswerFuzzy, 
  normalizeAnswerEnhanced 
} from '../services/fuzzyMatching';
import { pointsForRank } from '../services/scoring';

describe('Answer Award and Reveal System', () => {
  const sampleAnswers = [
    { text: 'Michael Jackson', rank: 1, points: 1, aliases: ['MJ', 'King of Pop'] },
    { text: 'Elvis Presley', rank: 2, points: 2, aliases: ['The King', 'Elvis'] },
    { text: 'Madonna', rank: 3, points: 3, aliases: ['Material Girl'] },
    { text: 'The Beatles', rank: 4, points: 4, aliases: ['Beatles', 'Fab Four'] },
    { text: 'Queen', rank: 5, points: 5, aliases: ['Queen Band'] }
  ];

  describe('Fuzzy Matching System', () => {
    test('should match exact answers', () => {
      const result = findBestMatch('Michael Jackson', sampleAnswers);
      expect(result.isMatch).toBe(true);
      expect(result.officialAnswer).toBe('Michael Jackson');
      expect(result.confidence).toBe('exact');
    });

    test('should match answers with typos', () => {
      const result = findBestMatch('Micheal Jackson', sampleAnswers);
      expect(result.isMatch).toBe(true);
      expect(result.officialAnswer).toBe('Michael Jackson');
      expect(result.confidence).toBe('high');
    });

    test('should match answers with nicknames', () => {
      const result = findBestMatch('Mike Jackson', sampleAnswers);
      expect(result.isMatch).toBe(true);
      expect(result.officialAnswer).toBe('Michael Jackson');
    });

    test('should match answers with aliases', () => {
      const result = findBestMatch('MJ', sampleAnswers);
      expect(result.isMatch).toBe(true);
      expect(result.officialAnswer).toBe('Michael Jackson');
    });

    test('should match answers with different casing', () => {
      const result = findBestMatch('michael jackson', sampleAnswers);
      expect(result.isMatch).toBe(true);
      expect(result.officialAnswer).toBe('Michael Jackson');
    });

    test('should match answers with extra spaces', () => {
      const result = findBestMatch('  Michael   Jackson  ', sampleAnswers);
      expect(result.isMatch).toBe(true);
      expect(result.officialAnswer).toBe('Michael Jackson');
    });

    test('should match answers with punctuation', () => {
      const result = findBestMatch('Michael-Jackson!', sampleAnswers);
      expect(result.isMatch).toBe(true);
      expect(result.officialAnswer).toBe('Michael Jackson');
    });

    test('should not match completely different answers', () => {
      const result = findBestMatch('Random Person', sampleAnswers);
      expect(result.isMatch).toBe(false);
    });
  });

  describe('Answer Validation', () => {
    test('should validate correct answers with points', () => {
      const result = validateAnswerFuzzy('Michael Jackson', sampleAnswers);
      expect(result.isCorrect).toBe(true);
      expect(result.rank).toBe(1);
      expect(result.points).toBe(1);
      expect(result.officialAnswer).toBe('Michael Jackson');
    });

    test('should validate answers with typos', () => {
      const result = validateAnswerFuzzy('Micheal Jackson', sampleAnswers);
      expect(result.isCorrect).toBe(true);
      expect(result.rank).toBe(1);
      expect(result.points).toBe(1);
      expect(result.officialAnswer).toBe('Michael Jackson');
    });

    test('should validate answers with nicknames', () => {
      const result = validateAnswerFuzzy('Mike Jackson', sampleAnswers);
      expect(result.isCorrect).toBe(true);
      expect(result.rank).toBe(1);
      expect(result.points).toBe(1);
      expect(result.officialAnswer).toBe('Michael Jackson');
    });

    test('should reject incorrect answers', () => {
      const result = validateAnswerFuzzy('Random Person', sampleAnswers);
      expect(result.isCorrect).toBe(false);
    });
  });

  describe('Scoring System', () => {
    test('should calculate correct points for each rank', () => {
      expect(pointsForRank(1)).toBe(1);
      expect(pointsForRank(2)).toBe(2);
      expect(pointsForRank(3)).toBe(3);
      expect(pointsForRank(4)).toBe(4);
      expect(pointsForRank(5)).toBe(5);
      expect(pointsForRank(10)).toBe(10);
    });

    test('should handle invalid ranks gracefully', () => {
      expect(pointsForRank(0)).toBe(1); // fallback
      expect(pointsForRank(11)).toBe(10); // fallback
      expect(pointsForRank(-1)).toBe(1); // fallback
    });
  });

  describe('Answer Normalization', () => {
    test('should normalize text correctly', () => {
      expect(normalizeAnswerEnhanced('Michael Jackson')).toBe('michael jackson');
      expect(normalizeAnswerEnhanced('  MICHAEL   JACKSON  ')).toBe('michael jackson');
      expect(normalizeAnswerEnhanced('Michael-Jackson!')).toBe('michael-jackson');
      expect(normalizeAnswerEnhanced('Dr. Michael Jackson')).toBe('michael jackson');
      expect(normalizeAnswerEnhanced('Mr. Michael Jackson Jr.')).toBe('michael jackson');
    });

    test('should handle special characters', () => {
      expect(normalizeAnswerEnhanced('Guns N\' Roses')).toBe('guns n roses');
      expect(normalizeAnswerEnhanced('AC/DC')).toBe('ac/dc');
      expect(normalizeAnswerEnhanced('The Beatles')).toBe('beatles');
    });
  });

  describe('Integration Tests', () => {
    test('should handle complete answer submission flow', () => {
      // Simulate the complete flow: user input -> normalization -> matching -> validation -> scoring
      const userInput = 'Micheal Jackson';
      
      // Step 1: Normalize input
      const normalizedInput = normalizeAnswerEnhanced(userInput);
      expect(normalizedInput).toBe('michael jackson');
      
      // Step 2: Find match
      const matchResult = findBestMatch(userInput, sampleAnswers);
      expect(matchResult.isMatch).toBe(true);
      expect(matchResult.officialAnswer).toBe('Michael Jackson');
      
      // Step 3: Validate answer
      const validationResult = validateAnswerFuzzy(userInput, sampleAnswers);
      expect(validationResult.isCorrect).toBe(true);
      expect(validationResult.rank).toBe(1);
      expect(validationResult.points).toBe(1);
      expect(validationResult.officialAnswer).toBe('Michael Jackson');
      
      // Step 4: Verify scoring
      const points = pointsForRank(validationResult.rank!);
      expect(points).toBe(1);
    });

    test('should handle multiple answer variants', () => {
      const variants = [
        'Michael Jackson',
        'Micheal Jackson',
        'michael jackson',
        'Mike Jackson',
        'MJ',
        'Dr. Michael Jackson',
        '  Michael   Jackson  ',
        'Michael-Jackson!'
      ];

      variants.forEach(variant => {
        const result = validateAnswerFuzzy(variant, sampleAnswers);
        expect(result.isCorrect).toBe(true);
        expect(result.officialAnswer).toBe('Michael Jackson');
        expect(result.rank).toBe(1);
        expect(result.points).toBe(1);
      });
    });

    test('should handle edge cases', () => {
      // Empty input
      const emptyResult = validateAnswerFuzzy('', sampleAnswers);
      expect(emptyResult.isCorrect).toBe(false);

      // Very short input
      const shortResult = validateAnswerFuzzy('M', sampleAnswers);
      expect(shortResult.isCorrect).toBe(false);

      // Very long input
      const longInput = 'A'.repeat(100);
      const longResult = validateAnswerFuzzy(longInput, sampleAnswers);
      expect(longResult.isCorrect).toBe(false);
    });
  });

  describe('Answer Reveal Logic', () => {
    test('should correctly identify revealed answers by index', () => {
      // Simulate revealedAnswers array
      const revealedAnswers = [
        { answerId: 'Michael Jackson', playerId: 'player1', points: 1 },
        null,
        { answerId: 'Madonna', playerId: 'player2', points: 3 },
        null,
        null
      ];

      // Test reveal logic
      expect(revealedAnswers[0] !== null && revealedAnswers[0] !== undefined).toBe(true);
      expect(revealedAnswers[1] !== null && revealedAnswers[1] !== undefined).toBe(false);
      expect(revealedAnswers[2] !== null && revealedAnswers[2] !== undefined).toBe(true);
      expect(revealedAnswers[3] !== null && revealedAnswers[3] !== undefined).toBe(false);
      expect(revealedAnswers[4] !== null && revealedAnswers[4] !== undefined).toBe(false);
    });

    test('should handle undefined revealedAnswers array', () => {
      const revealedAnswers = undefined;
      expect(revealedAnswers?.[0] !== null && revealedAnswers?.[0] !== undefined).toBe(false);
    });

    test('should handle empty revealedAnswers array', () => {
      const revealedAnswers: any[] = [];
      expect(revealedAnswers[0] !== null && revealedAnswers[0] !== undefined).toBe(false);
    });
  });
});
