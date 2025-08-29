import { GameQuestion, QuestionAnswer } from '../data/sampleQuestions';

export interface AnswerValidationResult {
  isCorrect: boolean;
  matchedAnswer?: QuestionAnswer;
  rank?: number;
  points?: number;
  similarity?: number;
}

export interface ScoreCalculationParams {
  rank: number;
  timeTaken: number;
  totalTime: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface UserQuestionData {
  category: string;
  title: string;
  answers: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  submittedBy: string;
}

// Fuzzy matching threshold (0-1, higher = more strict)
const SIMILARITY_THRESHOLD = 0.7;

/**
 * Get questions by category
 */
export const getQuestionsByCategory = (category: string): GameQuestion[] => {
  const { sampleQuestions } = require('../data/sampleQuestions');
  return sampleQuestions.filter((question: GameQuestion) => question.category === category);
};

/**
 * Get a random question from a category or all questions
 */
export const getRandomQuestion = (category?: string): GameQuestion => {
  const { sampleQuestions } = require('../data/sampleQuestions');
  const questions = category ? getQuestionsByCategory(category) : sampleQuestions;
  const randomIndex = Math.floor(Math.random() * questions.length);
  return questions[randomIndex];
};

/**
 * Get all available categories
 */
export const getCategories = (): string[] => {
  const { sampleQuestions } = require('../data/sampleQuestions');
  return [...new Set(sampleQuestions.map((q: GameQuestion) => q.category))] as string[];
};

/**
 * Normalize text for comparison (remove punctuation, lowercase, trim)
 * IMPROVED: More forgiving normalization for typos and spelling mistakes
 */
export const normalizeAnswer = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/[aeiou]/g, '') // Remove vowels for more flexible matching (optional)
    .replace(/\b(the|a|an)\b/g, '') // Remove common articles
    .replace(/\b(mr|mrs|ms|dr|prof)\b/g, ''); // Remove common titles
};

/**
 * Calculate similarity between two strings using Levenshtein distance
 */
export const calculateSimilarity = (str1: string, str2: string): number => {
  const normalized1 = normalizeAnswer(str1);
  const normalized2 = normalizeAnswer(str2);
  
  if (normalized1 === normalized2) return 1;
  
  const matrix = [];
  const len1 = normalized1.length;
  const len2 = normalized2.length;
  
  // Initialize matrix
  for (let i = 0; i <= len2; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len1; j++) {
    matrix[0][j] = j;
  }
  
  // Fill matrix
  for (let i = 1; i <= len2; i++) {
    for (let j = 1; j <= len1; j++) {
      if (normalized2.charAt(i - 1) === normalized1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  
  const distance = matrix[len2][len1];
  const maxLength = Math.max(len1, len2);
  return 1 - (distance / maxLength);
};

/**
 * Validate user answer against correct answers with improved matching
 * NEW: Uses normalized answers and aliases for better matching
 */
export const validateAnswer = (userAnswer: string, correctAnswers: QuestionAnswer[]): AnswerValidationResult => {
  if (!userAnswer.trim()) {
    return { isCorrect: false };
  }
  
  const normalizedUserAnswer = normalizeAnswer(userAnswer);
  console.log(`🔍 Validating: "${userAnswer}" -> normalized: "${normalizedUserAnswer}"`);
  
  let bestMatch: QuestionAnswer | undefined;
  let bestSimilarity = 0;
  let matchType: 'exact' | 'alias' | 'fuzzy_high' | 'fuzzy_low' | 'none' = 'none';
  
  // Check for exact matches first (normalized)
  for (const answer of correctAnswers) {
    // Check exact match with normalized answer
    if (answer.normalized && normalizedUserAnswer === answer.normalized) {
      console.log(`✅ EXACT MATCH: "${answer.text}" (rank ${answer.rank}, points ${answer.points})`);
      return {
        isCorrect: true,
        matchedAnswer: answer,
        rank: answer.rank,
        points: answer.points,
        similarity: 1
      };
    }
    
    // Check aliases
    if (answer.aliases) {
      for (const alias of answer.aliases) {
        const normalizedAlias = normalizeAnswer(alias);
        if (normalizedUserAnswer === normalizedAlias) {
          console.log(`✅ ALIAS MATCH: "${alias}" -> "${answer.text}" (rank ${answer.rank}, points ${answer.points})`);
          return {
            isCorrect: true,
            matchedAnswer: answer,
            rank: answer.rank,
            points: answer.points,
            similarity: 1
          };
        }
      }
    }
    
    // Check fuzzy matching
    const similarity = calculateSimilarity(normalizedUserAnswer, answer.normalized || answer.text);
    
    if (similarity > bestSimilarity) {
      bestSimilarity = similarity;
      bestMatch = answer;
    }
  }
  
  // Check if best match meets threshold - LOWERED for more forgiving matching
  if (bestSimilarity >= 0.75 && bestMatch) { // Lowered from 0.92
    return {
      isCorrect: true,
      matchedAnswer: bestMatch,
      rank: bestMatch.rank,
      points: bestMatch.points,
      similarity: bestSimilarity
    };
  }
  
  // Even lower threshold for probable matches - VERY FORGIVING
  if (bestSimilarity >= 0.65 && bestMatch) { // Lowered from 0.85
    return {
      isCorrect: true,
      matchedAnswer: bestMatch,
      rank: bestMatch.rank,
      points: bestMatch.points,
      similarity: bestSimilarity
    };
  }
  
  // Super low threshold for close matches - EXTREMELY FORGIVING
  if (bestSimilarity >= 0.55 && bestMatch) { // New very low threshold
    return {
      isCorrect: true,
      matchedAnswer: bestMatch,
      rank: bestMatch.rank,
      points: bestMatch.points,
      similarity: bestSimilarity
    };
  }
  
  return { isCorrect: false };
};

/**
 * Calculate score based on rank only
 * SIMPLIFIED SCORING: rank position = points (rank 1 = 1 point, rank 10 = 10 points)
 */
export const calculateScore = (params: ScoreCalculationParams): number => {
  const { rank } = params;
  
  // Base points from rank (direct relationship: rank 1 = 1 point, rank 10 = 10 points)
  const basePoints = rank;
  
  return basePoints; // No speed bonus, no difficulty multiplier
};

/**
 * Get answer suggestions based on partial input
 */
export const getAnswerSuggestions = (partialInput: string, correctAnswers: QuestionAnswer[]): string[] => {
  if (!partialInput.trim()) return [];
  
  const normalizedInput = normalizeAnswer(partialInput);
  const suggestions: { text: string; similarity: number }[] = [];
  
  for (const answer of correctAnswers) {
    const similarity = calculateSimilarity(partialInput, answer.text);
    if (similarity > 0.3) { // Lower threshold for suggestions
      suggestions.push({ text: answer.text, similarity });
    }
  }
  
  // Sort by similarity and return top 5
  return suggestions
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 5)
    .map(s => s.text);
};

/**
 * Submit user-generated question (for future feature)
 */
export const submitUserQuestion = async (questionData: UserQuestionData): Promise<boolean> => {
  try {
    // TODO: Implement Firebase integration for user-generated content
    console.log('User question submitted:', questionData);
    
    // For now, just return success
    return true;
  } catch (error) {
    console.error('Error submitting user question:', error);
    return false;
  }
};

/**
 * Get question statistics
 */
export const getQuestionStats = (category?: string) => {
  const { sampleQuestions } = require('../data/sampleQuestions');
  const questions = category ? getQuestionsByCategory(category) : sampleQuestions;
  
  return {
    totalQuestions: questions.length,
    categories: getCategories(),
    difficultyBreakdown: questions.reduce((acc: any, q: GameQuestion) => {
      acc[q.difficulty] = (acc[q.difficulty] || 0) + 1;
      return acc;
    }, {}),
    averageAnswersPerQuestion: questions.reduce((sum: number, q: GameQuestion) => sum + q.answers.length, 0) / questions.length
  };
};

/**
 * Get questions by difficulty level
 */
export const getQuestionsByDifficulty = (difficulty: 'easy' | 'medium' | 'hard', category?: string): GameQuestion[] => {
  const { sampleQuestions } = require('../data/sampleQuestions');
  let questions = sampleQuestions;
  
  if (category) {
    questions = getQuestionsByCategory(category);
  }
  
  return questions.filter((q: GameQuestion) => q.difficulty === difficulty);
};

/**
 * Shuffle questions for random order
 */
export const shuffleQuestions = (questions: GameQuestion[]): GameQuestion[] => {
  const shuffled = [...questions];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};
