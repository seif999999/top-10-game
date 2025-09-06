import { 
  normalizeAnswerEnhanced, 
  getAnswerVariations, 
  calculateSimilarity, 
  findBestMatch, 
  validateAnswerFuzzy,
  createMatchConfig 
} from '../services/fuzzyMatching';

describe('Fuzzy Matching System', () => {
  const sampleAnswers = [
    { text: 'Michael Jackson', rank: 1, points: 1, aliases: ['MJ', 'King of Pop'] },
    { text: 'Elvis Presley', rank: 2, points: 2, aliases: ['The King', 'Elvis'] },
    { text: 'Madonna', rank: 3, points: 3, aliases: ['Material Girl'] },
    { text: 'The Beatles', rank: 4, points: 4, aliases: ['Beatles', 'Fab Four'] },
    { text: 'Queen', rank: 5, points: 5, aliases: ['Queen Band'] },
    { text: 'Led Zeppelin', rank: 6, points: 6, aliases: ['Led Zep', 'Zep'] },
    { text: 'Pink Floyd', rank: 7, points: 7, aliases: ['Pink Floyd Band'] },
    { text: 'The Rolling Stones', rank: 8, points: 8, aliases: ['Rolling Stones', 'Stones'] },
    { text: 'AC/DC', rank: 9, points: 9, aliases: ['ACDC'] },
    { text: 'Guns N\' Roses', rank: 10, points: 10, aliases: ['Guns and Roses', 'GNR'] }
  ];

  describe('normalizeAnswerEnhanced', () => {
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

  describe('getAnswerVariations', () => {
    test('should generate nickname variations', () => {
      const variations = getAnswerVariations('Michael Jackson');
      expect(variations).toContain('michael jackson');
      expect(variations).toContain('mike jackson');
      expect(variations).toContain('mick jackson');
    });

    test('should handle reverse nickname mapping', () => {
      const variations = getAnswerVariations('Mike Jackson');
      expect(variations).toContain('mike jackson');
      expect(variations).toContain('michael jackson');
    });
  });

  describe('calculateSimilarity', () => {
    test('should calculate exact match similarity', () => {
      expect(calculateSimilarity('Michael Jackson', 'Michael Jackson')).toBe(1);
      expect(calculateSimilarity('michael jackson', 'MICHAEL JACKSON')).toBe(1);
    });

    test('should calculate similarity for typos', () => {
      const similarity = calculateSimilarity('Micheal Jackson', 'Michael Jackson');
      expect(similarity).toBeGreaterThan(0.8);
    });

    test('should calculate similarity for different cases', () => {
      const similarity = calculateSimilarity('michael jackson', 'Michael Jackson');
      expect(similarity).toBe(1);
    });

    test('should handle completely different strings', () => {
      const similarity = calculateSimilarity('Apple', 'Orange');
      expect(similarity).toBeLessThan(0.5);
    });
  });

  describe('findBestMatch', () => {
    test('should find exact matches', () => {
      const result = findBestMatch('Michael Jackson', sampleAnswers);
      expect(result.isMatch).toBe(true);
      expect(result.officialAnswer).toBe('Michael Jackson');
      expect(result.confidence).toBe('exact');
    });

    test('should find matches with typos', () => {
      const result = findBestMatch('Micheal Jackson', sampleAnswers);
      expect(result.isMatch).toBe(true);
      expect(result.officialAnswer).toBe('Michael Jackson');
      expect(result.confidence).toBe('high');
    });

    test('should find matches with nicknames', () => {
      const result = findBestMatch('Mike Jackson', sampleAnswers);
      expect(result.isMatch).toBe(true);
      expect(result.officialAnswer).toBe('Michael Jackson');
    });

    test('should find matches with aliases', () => {
      const result = findBestMatch('MJ', sampleAnswers);
      expect(result.isMatch).toBe(true);
      expect(result.officialAnswer).toBe('Michael Jackson');
    });

    test('should find matches with different casing', () => {
      const result = findBestMatch('michael jackson', sampleAnswers);
      expect(result.isMatch).toBe(true);
      expect(result.officialAnswer).toBe('Michael Jackson');
    });

    test('should find matches with extra spaces', () => {
      const result = findBestMatch('  Michael   Jackson  ', sampleAnswers);
      expect(result.isMatch).toBe(true);
      expect(result.officialAnswer).toBe('Michael Jackson');
    });

    test('should find matches with punctuation', () => {
      const result = findBestMatch('Michael-Jackson!', sampleAnswers);
      expect(result.isMatch).toBe(true);
      expect(result.officialAnswer).toBe('Michael Jackson');
    });

    test('should handle titles and prefixes', () => {
      const result = findBestMatch('Dr. Michael Jackson', sampleAnswers);
      expect(result.isMatch).toBe(true);
      expect(result.officialAnswer).toBe('Michael Jackson');
    });

    test('should not match completely different answers', () => {
      const result = findBestMatch('Random Person', sampleAnswers);
      expect(result.isMatch).toBe(false);
    });

    test('should handle empty input', () => {
      const result = findBestMatch('', sampleAnswers);
      expect(result.isMatch).toBe(false);
    });
  });

  describe('validateAnswerFuzzy', () => {
    test('should validate correct answers', () => {
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

  describe('Edge Cases', () => {
    test('should handle very short answers', () => {
      const shortAnswers = [{ text: 'MJ', rank: 1, points: 1 }];
      const result = findBestMatch('M', shortAnswers);
      // Should not match very short inputs
      expect(result.isMatch).toBe(false);
    });

    test('should handle very long answers', () => {
      const longAnswer = 'A'.repeat(100);
      const result = findBestMatch(longAnswer, sampleAnswers);
      expect(result.isMatch).toBe(false);
    });

    test('should handle special characters in answers', () => {
      const result = findBestMatch('Guns and Roses', sampleAnswers);
      expect(result.isMatch).toBe(true);
      expect(result.officialAnswer).toBe('Guns N\' Roses');
    });

    test('should handle numbers in answers', () => {
      const result = findBestMatch('ACDC', sampleAnswers);
      expect(result.isMatch).toBe(true);
      expect(result.officialAnswer).toBe('AC/DC');
    });
  });

  describe('Configuration', () => {
    test('should use custom configuration', () => {
      const strictConfig = createMatchConfig({
        lowConfidenceThreshold: 0.9 // Very strict
      });
      
      const result = findBestMatch('Micheal Jackson', sampleAnswers, strictConfig);
      // Should be less likely to match with strict config
      expect(result.confidence).toBe('medium');
    });

    test('should handle different similarity thresholds', () => {
      const lenientConfig = createMatchConfig({
        lowConfidenceThreshold: 0.3 // Very lenient
      });
      
      const result = findBestMatch('Mich Jackson', sampleAnswers, lenientConfig);
      expect(result.isMatch).toBe(true);
    });
  });

  describe('Performance', () => {
    test('should handle large answer sets efficiently', () => {
      const largeAnswerSet = Array.from({ length: 1000 }, (_, i) => ({
        text: `Answer ${i}`,
        rank: i + 1,
        points: i + 1
      }));
      
      const start = Date.now();
      const result = findBestMatch('Answer 500', largeAnswerSet);
      const end = Date.now();
      
      expect(result.isMatch).toBe(true);
      expect(end - start).toBeLessThan(100); // Should complete in under 100ms
    });
  });
});
