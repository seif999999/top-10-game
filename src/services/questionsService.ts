import { GameQuestion, QuestionAnswer, sampleQuestions } from '../data/sampleQuestions';
import { Question, Answer, LegacyQuestion } from '../types/game';
import { pointsForRank } from './scoring';

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

/**
 * Get questions by category - SIMPLE AND DIRECT
 */
export const getQuestionsByCategory = (category: string): GameQuestion[] => {
  console.log(`🔍 getQuestionsByCategory("${category}") called`);
  
  // Add safety check for sampleQuestions
  if (!sampleQuestions || !Array.isArray(sampleQuestions)) {
    console.error(`❌ sampleQuestions is not available or not an array`);
    return [];
  }
  
  console.log(`🔍 Total questions in data: ${sampleQuestions.length}`);
  console.log(`🔍 Available categories:`, [...new Set(sampleQuestions.map(q => q.category))]);
  
  const filteredQuestions = sampleQuestions.filter(question => question.category === category);
  
  console.log(`🔍 Found ${filteredQuestions.length} questions for "${category}":`);
  filteredQuestions.forEach((q, index) => {
    console.log(`   ${index + 1}. ${q.title}`);
  });
  
  console.log(`🔍 DEBUG: Category filtering details:`, {
    requestedCategory: category,
    totalQuestions: sampleQuestions.length,
    filteredCount: filteredQuestions.length,
    allCategories: [...new Set(sampleQuestions.map(q => q.category))],
    firstFilteredQuestion: filteredQuestions[0]?.title || 'none'
  });
  
  return filteredQuestions;
};

/**
 * Get a random question from a category
 */
export const getRandomQuestion = (category?: string): GameQuestion => {
  // Add safety check for sampleQuestions
  if (!sampleQuestions || !Array.isArray(sampleQuestions)) {
    console.error(`❌ sampleQuestions is not available or not an array`);
    return {} as GameQuestion; // Return empty object as fallback
  }
  
  const questions = category ? getQuestionsByCategory(category) : sampleQuestions;
  if (questions.length === 0) {
    console.error(`❌ No questions found for category: ${category}`);
    return sampleQuestions[0] || {} as GameQuestion; // Fallback
  }
  const randomIndex = Math.floor(Math.random() * questions.length);
  return questions[randomIndex];
};

/**
 * Get all available categories
 */
export const getCategories = (): string[] => {
  // Add safety check for sampleQuestions
  if (!sampleQuestions || !Array.isArray(sampleQuestions)) {
    console.error(`❌ sampleQuestions is not available or not an array`);
    return [];
  }
  
  return [...new Set(sampleQuestions.map(q => q.category))];
};

/**
 * Normalize text for comparison
 */
export const normalizeAnswer = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/[aeiou]/g, '')
    .replace(/\b(the|a|an)\b/g, '')
    .replace(/\b(mr|mrs|ms|dr|prof)\b/g, '');
};

/**
 * Calculate similarity between two strings
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
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  const distance = matrix[len2][len1];
  const maxLength = Math.max(len1, len2);
  return 1 - (distance / maxLength);
};

/**
 * Validate user answer
 */
export const validateAnswer = (userAnswer: string, correctAnswers: QuestionAnswer[]): AnswerValidationResult => {
  if (!userAnswer.trim()) {
    return { isCorrect: false };
  }
  
  const normalizedUserAnswer = normalizeAnswer(userAnswer);
  console.log(`🔍 Validating: "${userAnswer}" -> normalized: "${normalizedUserAnswer}"`);
  
  let bestMatch: QuestionAnswer | undefined;
  let bestSimilarity = 0;
  
  // Check for exact matches first
  for (const answer of correctAnswers) {
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
  
  // Check if best match meets threshold
  if (bestSimilarity >= 0.75 && bestMatch) {
    return {
      isCorrect: true,
      matchedAnswer: bestMatch,
      rank: bestMatch.rank,
      points: bestMatch.points,
      similarity: bestSimilarity
    };
  }
  
  if (bestSimilarity >= 0.65 && bestMatch) {
    return {
      isCorrect: true,
      matchedAnswer: bestMatch,
      rank: bestMatch.rank,
      points: bestMatch.points,
      similarity: bestSimilarity
    };
  }
  
  if (bestSimilarity >= 0.55 && bestMatch) {
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
 * Calculate score based on rank
 */
export const calculateScore = (params: ScoreCalculationParams): number => {
  const { rank } = params;
  return rank;
};

/**
 * Get answer suggestions
 */
export const getAnswerSuggestions = (partialInput: string, correctAnswers: QuestionAnswer[]): string[] => {
  if (!partialInput.trim()) return [];
  
  const normalizedInput = normalizeAnswer(partialInput);
  const suggestions: { text: string; similarity: number }[] = [];
  
  for (const answer of correctAnswers) {
    const similarity = calculateSimilarity(partialInput, answer.text);
    if (similarity > 0.3) {
      suggestions.push({ text: answer.text, similarity });
    }
  }
  
  return suggestions
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 5)
    .map(s => s.text);
};

/**
 * Submit user-generated question
 */
export const submitUserQuestion = async (questionData: UserQuestionData): Promise<boolean> => {
  try {
    console.log('User question submitted:', questionData);
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
  // Add safety check for sampleQuestions
  if (!sampleQuestions || !Array.isArray(sampleQuestions)) {
    console.error(`❌ sampleQuestions is not available or not an array`);
    return {
      totalQuestions: 0,
      categories: [],
      difficultyBreakdown: {},
      averageAnswersPerQuestion: 0
    };
  }
  
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
  // Add safety check for sampleQuestions
  if (!sampleQuestions || !Array.isArray(sampleQuestions)) {
    console.error(`❌ sampleQuestions is not available or not an array`);
    return [];
  }
  
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

/**
 * Normalize a legacy question with string[] answers to the new Question format
 * This is the key migration function for data structure unification
 */
export const normalizeQuestion = (legacyQuestion: LegacyQuestion | GameQuestion): Question => {
  console.log(`🔄 NORMALIZE_QUESTION: Converting question "${legacyQuestion.text}"`);
  
  // Handle GameQuestion format (already has QuestionAnswer[])
  if ('answers' in legacyQuestion && Array.isArray(legacyQuestion.answers) && legacyQuestion.answers.length > 0) {
    const firstAnswer = legacyQuestion.answers[0];
    
    // Check if it's already in Answer format
    if (typeof firstAnswer === 'object' && 'text' in firstAnswer && 'rank' in firstAnswer) {
      console.log(`✅ NORMALIZE_QUESTION: Already in Answer format`);
      return {
        id: legacyQuestion.id,
        text: legacyQuestion.text,
        category: legacyQuestion.category,
        difficulty: legacyQuestion.difficulty,
        answers: legacyQuestion.answers as Answer[]
      };
    }
    
    // Check if it's QuestionAnswer format (needs conversion)
    if (typeof firstAnswer === 'object' && 'text' in firstAnswer && 'points' in firstAnswer) {
      console.log(`🔄 NORMALIZE_QUESTION: Converting from QuestionAnswer format`);
      const answers: Answer[] = (legacyQuestion.answers as QuestionAnswer[]).map((qa, index) => ({
        id: `${legacyQuestion.id}_answer_${index}`,
        text: qa.text,
        rank: qa.rank || (index + 1),
        aliases: qa.aliases || []
      }));
      
      return {
        id: legacyQuestion.id,
        text: legacyQuestion.text,
        category: legacyQuestion.category,
        difficulty: legacyQuestion.difficulty,
        answers
      };
    }
  }
  
  // Handle string[] format (legacy)
  if (Array.isArray(legacyQuestion.answers) && typeof legacyQuestion.answers[0] === 'string') {
    console.log(`🔄 NORMALIZE_QUESTION: Converting from string[] format`);
    const answers: Answer[] = (legacyQuestion.answers as string[]).map((answerText, index) => ({
      id: `${legacyQuestion.id}_answer_${index}`,
      text: answerText,
      rank: index + 1,
      aliases: []
    }));
    
    return {
      id: legacyQuestion.id,
      text: legacyQuestion.text,
      category: legacyQuestion.category,
      difficulty: legacyQuestion.difficulty,
      answers
    };
  }
  
  // Fallback: create empty question
  console.warn(`⚠️ NORMALIZE_QUESTION: Unknown format, creating empty question`);
  return {
    id: legacyQuestion.id || `question_${Date.now()}`,
    text: legacyQuestion.text || 'Unknown Question',
    category: legacyQuestion.category || 'General',
    difficulty: legacyQuestion.difficulty || 'medium',
    answers: []
  };
};

/**
 * Convert a Question back to GameQuestion format for single-player compatibility
 */
export const questionToGameQuestion = (question: Question): GameQuestion => {
  const answers: QuestionAnswer[] = question.answers.map(answer => ({
    text: answer.text,
    rank: answer.rank,
    points: pointsForRank(answer.rank),
    aliases: answer.aliases || []
  }));
  
  return {
    id: question.id,
    category: question.category,
    title: question.text,
    answers,
    difficulty: question.difficulty
  };
};

/**
 * Convert a Question back to LegacyQuestion format for multiplayer compatibility
 */
export const questionToLegacyQuestion = (question: Question): LegacyQuestion => {
  return {
    id: question.id,
    text: question.text,
    category: question.category,
    difficulty: question.difficulty,
    answers: question.answers.map(answer => answer.text)
  };
};

/**
 * Safe string normalization to prevent toLowerCase of undefined errors
 */
export const safeToLower = (s?: string): string => {
  return (s || '').toLowerCase().trim();
};

/**
 * Validate question shape at runtime
 */
export const assertQuestionShape = (question: any): Question => {
  if (!question || typeof question !== 'object') {
    console.warn('⚠️ ASSERT_QUESTION_SHAPE: Invalid question object, creating fallback');
    return {
      id: `fallback_${Date.now()}`,
      text: 'Invalid Question',
      category: 'General',
      difficulty: 'medium',
      answers: []
    };
  }
  
  // Ensure required fields exist
  const normalizedQuestion = {
    id: question.id || `question_${Date.now()}`,
    text: question.text || question.title || 'Unknown Question',
    category: question.category || 'General',
    difficulty: question.difficulty || 'medium',
    answers: question.answers || []
  };
  
  // Validate answers array
  if (!Array.isArray(normalizedQuestion.answers)) {
    console.warn('⚠️ ASSERT_QUESTION_SHAPE: Invalid answers array, using empty array');
    normalizedQuestion.answers = [];
  }
  
  // Convert to Answer format if needed
  if (normalizedQuestion.answers.length > 0) {
    const firstAnswer = normalizedQuestion.answers[0];
    if (typeof firstAnswer === 'string') {
      // Convert string[] to Answer[]
      normalizedQuestion.answers = normalizedQuestion.answers.map((text: string, index: number) => ({
        id: `${normalizedQuestion.id}_answer_${index}`,
        text,
        rank: index + 1,
        aliases: []
      }));
    }
  }
  
  return normalizedQuestion as Question;
};

// Log normalization system initialization
console.log('🔄 Question normalization system initialized');
