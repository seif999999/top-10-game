// Unit tests for question normalization and safe string handling
import { 
  normalizeQuestion, 
  safeToLower, 
  assertQuestionShape,
  questionToGameQuestion,
  questionToLegacyQuestion 
} from '../services/questionsService';
import { Question, Answer, LegacyQuestion } from '../types/game';

describe('Questions Service', () => {
  describe('safeToLower', () => {
    test('should handle valid strings', () => {
      expect(safeToLower('Hello World')).toBe('hello world');
      expect(safeToLower('  Test  ')).toBe('test');
    });

    test('should handle undefined and null safely', () => {
      expect(safeToLower(undefined)).toBe('');
      expect(safeToLower(null as any)).toBe('');
      expect(safeToLower('')).toBe('');
    });
  });

  describe('normalizeQuestion', () => {
    test('should convert string[] answers to Answer[] format', () => {
      const legacyQuestion: LegacyQuestion = {
        id: 'test1',
        text: 'Test Question',
        category: 'General',
        difficulty: 'easy',
        answers: ['Answer 1', 'Answer 2', 'Answer 3']
      };

      const normalized = normalizeQuestion(legacyQuestion);
      
      expect(normalized.id).toBe('test1');
      expect(normalized.text).toBe('Test Question');
      expect(normalized.answers).toHaveLength(3);
      expect(normalized.answers[0]).toEqual({
        id: 'test1_answer_0',
        text: 'Answer 1',
        rank: 1,
        aliases: []
      });
      expect(normalized.answers[1].rank).toBe(2);
      expect(normalized.answers[2].rank).toBe(3);
    });

    test('should handle already normalized questions', () => {
      const question: Question = {
        id: 'test2',
        text: 'Test Question',
        category: 'General',
        difficulty: 'easy',
        answers: [
          { id: 'a1', text: 'Answer 1', rank: 1, aliases: ['A1'] },
          { id: 'a2', text: 'Answer 2', rank: 2 }
        ]
      };

      const normalized = normalizeQuestion(question);
      expect(normalized).toEqual(question);
    });

    test('should handle empty answers array', () => {
      const legacyQuestion: LegacyQuestion = {
        id: 'test3',
        text: 'Test Question',
        category: 'General',
        difficulty: 'easy',
        answers: []
      };

      const normalized = normalizeQuestion(legacyQuestion);
      expect(normalized.answers).toHaveLength(0);
    });
  });

  describe('assertQuestionShape', () => {
    test('should validate and fix valid question', () => {
      const question = {
        id: 'test1',
        text: 'Test Question',
        category: 'General',
        difficulty: 'easy',
        answers: ['Answer 1', 'Answer 2']
      };

      const validated = assertQuestionShape(question);
      expect(validated.id).toBe('test1');
      expect(validated.text).toBe('Test Question');
      expect(validated.answers).toHaveLength(2);
    });

    test('should create fallback for invalid question', () => {
      const invalidQuestion = null;
      const validated = assertQuestionShape(invalidQuestion);
      
      expect(validated.id).toMatch(/^fallback_\d+$/);
      expect(validated.text).toBe('Invalid Question');
      expect(validated.answers).toHaveLength(0);
    });

    test('should handle missing fields', () => {
      const incompleteQuestion = {
        id: 'test1'
        // missing other fields
      };

      const validated = assertQuestionShape(incompleteQuestion);
      expect(validated.text).toBe('Unknown Question');
      expect(validated.category).toBe('General');
      expect(validated.difficulty).toBe('medium');
    });
  });

  describe('questionToGameQuestion', () => {
    test('should convert Question to GameQuestion format', () => {
      const question: Question = {
        id: 'test1',
        text: 'Test Question',
        category: 'General',
        difficulty: 'easy',
        answers: [
          { id: 'a1', text: 'Answer 1', rank: 1 },
          { id: 'a2', text: 'Answer 2', rank: 2 }
        ]
      };

      const gameQuestion = questionToGameQuestion(question);
      
      expect(gameQuestion.id).toBe('test1');
      expect(gameQuestion.title).toBe('Test Question');
      expect(gameQuestion.answers).toHaveLength(2);
      expect(gameQuestion.answers[0].points).toBe(100); // rank 1 = 100 points
      expect(gameQuestion.answers[1].points).toBe(90);  // rank 2 = 90 points
    });
  });

  describe('questionToLegacyQuestion', () => {
    test('should convert Question to LegacyQuestion format', () => {
      const question: Question = {
        id: 'test1',
        text: 'Test Question',
        category: 'General',
        difficulty: 'easy',
        answers: [
          { id: 'a1', text: 'Answer 1', rank: 1 },
          { id: 'a2', text: 'Answer 2', rank: 2 }
        ]
      };

      const legacyQuestion = questionToLegacyQuestion(question);
      
      expect(legacyQuestion.id).toBe('test1');
      expect(legacyQuestion.text).toBe('Test Question');
      expect(legacyQuestion.answers).toEqual(['Answer 1', 'Answer 2']);
    });
  });
});
