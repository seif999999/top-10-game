import { GameState, GameRound, GameQuestion, PlayerAnswer, GameResults } from '../../shared/types';
import { getQuestionsByCategory, shuffleQuestions } from './questionsService';
import { logger } from '../utils/logger';
import { AppError } from '../../shared/errors';

// Generate unique game ID
// ✅ SECURITY: Uses secure random for ID generation
const generateGameId = async (): Promise<string> => {
  const { generateSecureId } = await import('../utils/secureRandom');
  return generateSecureId('game');
};

// Check if a question is complete (all answers submitted)
export const isQuestionComplete = (round: GameRound): boolean => {
  if (!round.playerAnswers || !Array.isArray(round.playerAnswers)) return false;
  return round.playerAnswers.length >= 10; // Top 10 game - need 10 answers
};

// Check if current question is complete (alias for compatibility)
export const checkQuestionComplete = (gameState: GameState): boolean => { 
  if (!gameState.currentQuestion) return false;
  
  logger.log(`🔍 checkQuestionComplete - Debug:`, {
    currentRound: gameState.currentRound,
    roundsLength: gameState.rounds?.length,
    rounds: gameState.rounds?.map(r => ({ roundNumber: r.roundNumber, answersCount: r.playerAnswers?.length || 0 }))
  });
  
  const currentRound = gameState.rounds.find(r => r.roundNumber === gameState.currentRound);
  if (!currentRound || !currentRound.playerAnswers || !Array.isArray(currentRound.playerAnswers)) {
    logger.log(`🔍 No current round found or no player answers`);
    return false;
  }
  
  const isComplete = currentRound.playerAnswers.length >= 10;
  logger.log(`🔍 Question complete check: ${currentRound.playerAnswers.length}/10 answers - ${isComplete ? 'YES' : 'NO'}`);
  
  return isComplete;
};

// Process a player's answer
export const processAnswer = (
  gameState: GameState,
  playerId: string,
  answer: string
): { updatedState: GameState; answerResult: PlayerAnswer } => {
  if (!gameState.currentQuestion || gameState.gamePhase !== 'question') {
    throw new AppError({ code: 'GAME_INVALID_PHASE', message: 'Game is not in question phase', userMessage: 'Cannot submit answer right now.' });
  }
  
  logger.log(`\n🎮 PROCESSING ANSWER:`);
  logger.log(`   Player: ${playerId}`);
  logger.log(`   Answer: "${answer}"`);
  logger.log(`   Question: "${gameState.currentQuestion.title}"`);
  if (gameState.currentQuestion.answers && Array.isArray(gameState.currentQuestion.answers)) {
    logger.log(`   Available answers:`, gameState.currentQuestion.answers.map(a => `${a.text} (rank: ${a.rank}, points: ${a.points})`));
  } else {
    logger.log(`   Available answers: []`);
  }
  
  // Calculate time taken since round started
  const timeTaken = Math.floor((Date.now() - (gameState.roundStartTime || Date.now())) / 1000);
  
  // Find the correct answer
  if (!gameState.currentQuestion.answers || !Array.isArray(gameState.currentQuestion.answers)) {
    throw new AppError({ code: 'GAME_NO_ANSWERS', message: 'No answers available for current question', userMessage: 'Question data is incomplete.' });
  }
  
  const correctAnswer = gameState.currentQuestion.answers.find(
    a => {
      const normalizedAnswer = answer.toLowerCase().trim();
      const normalizedText = a.text.toLowerCase().trim();
      const normalizedAlias = a.normalized || normalizedText;
      
      // Check exact match first
      if (normalizedText === normalizedAnswer) return true;
      if (normalizedAlias === normalizedAnswer) return true;
      
      // Check aliases
      if (a.aliases && Array.isArray(a.aliases)) {
        return a.aliases.some(alias => alias.toLowerCase().trim() === normalizedAnswer);
      }
      
      return false;
    }
  );
  
  if (!correctAnswer) {
    throw new AppError({ code: 'GAME_INVALID_ANSWER', message: 'Invalid answer submitted', userMessage: 'That answer is not correct.' });
  }
  
  const playerAnswer: PlayerAnswer = {
    playerId,
    answer,
    timeTaken,
    isCorrect: true,
    rank: correctAnswer.rank,
    points: correctAnswer.points
  };
  
  // Update game state
  const updatedState = { ...gameState };
  
  // Add answer to current round
  if (!updatedState.rounds) {
    updatedState.rounds = [];
  }
  
  // Ensure the rounds array is large enough
  while (updatedState.rounds.length < updatedState.currentRound) {
    updatedState.rounds.push({
      question: gameState.currentQuestion,
      playerAnswers: [],
      roundNumber: updatedState.rounds.length + 1,
      timeLimit: 0
    });
  }
  
  const currentRoundIndex = updatedState.currentRound - 1;
  if (!updatedState.rounds[currentRoundIndex].playerAnswers) {
    updatedState.rounds[currentRoundIndex].playerAnswers = [];
  }
  
  updatedState.rounds[currentRoundIndex].playerAnswers.push(playerAnswer);
  
  // Update scores
  if (!updatedState.scores) {
    updatedState.scores = {};
  }
  
  if (!updatedState.scores[playerId]) {
    updatedState.scores[playerId] = 0;
  }
  updatedState.scores[playerId] += correctAnswer.points;
  
  logger.log(`🎯 Score updated for player ${playerId}: ${updatedState.scores[playerId]}`);
  logger.log(`🎯 Points awarded: ${correctAnswer.points} for answer "${correctAnswer.text}" (rank ${correctAnswer.rank})`);
  
  // Check if all 10 answers have been found
  const currentRound = updatedState.rounds[updatedState.currentRound - 1];
  if (currentRound && currentRound.playerAnswers && currentRound.playerAnswers.length >= 10) {
    logger.log(`🎉 All 10 answers found! Ending game...`);
    updatedState.gamePhase = 'finished';
  }
  
  return { updatedState, answerResult: playerAnswer };
};

// Generate game results
export const generateGameResults = (gameState: GameState): GameResults => {
  logger.log(`🎮 generateGameResults called with:`, {
    hasRounds: !!gameState.rounds,
    roundsLength: gameState.rounds?.length,
    hasPlayers: !!gameState.players,
    playersLength: gameState.players?.length,
    scores: gameState.scores
  });
  
  // Handle case where rounds might be empty or undefined
  if (!gameState.rounds || !Array.isArray(gameState.rounds)) {
    logger.log(`⚠️ No rounds found, creating empty rounds array`);
    gameState.rounds = [];
  }
  
  if (!gameState.players || !Array.isArray(gameState.players)) {
    logger.log(`⚠️ No players found, creating default player array`);
    gameState.players = ['You'];
  }
  
  const totalTime = gameState.rounds.reduce((total, round) => {
    if (!round.playerAnswers || !Array.isArray(round.playerAnswers)) return total;
    return total + round.playerAnswers.reduce((roundTotal, answer) => {
      return roundTotal + answer.timeTaken;
    }, 0);
  }, 0);
  
  const totalScore = Object.values(gameState.scores || {}).reduce((sum, score) => sum + score, 0);
  const averageScore = totalScore / Math.max(gameState.players.length, 1);
  
  // Find best answer (highest points in shortest time)
  let bestAnswer: PlayerAnswer | undefined;
  let bestScore = 0;
  
  gameState.rounds.forEach(round => {
    if (round.playerAnswers && Array.isArray(round.playerAnswers)) {
      round.playerAnswers.forEach(answer => {
        if (answer.points && answer.points > bestScore) {
          bestScore = answer.points;
          bestAnswer = answer;
        }
      });
    }
  });
  
  // Determine winner
  let winner = '';
  let highestScore = -1;
  
  Object.entries(gameState.scores || {}).forEach(([playerId, score]) => {
    if (score > highestScore) {
      highestScore = score;
      winner = playerId;
    }
  });
  
  const results: GameResults = {
    gameId: gameState.gameId,
    category: gameState.category,
    players: gameState.players,
    finalScores: gameState.scores || {},
    roundResults: gameState.rounds,
    winner,
    totalTime,
    averageScore,
    bestAnswer
  };
  
  logger.log(`🎮 Generated game results:`, results);
  return results;
};

// Start a new game
export const startNewGame = async (
  category: string,
  players: string[],
  totalRounds: number = 10,
  selectedQuestion?: GameQuestion
): Promise<GameState> => {
  if (!players || !Array.isArray(players) || players.length === 0) {
    throw new AppError({ code: 'GAME_INVALID_PLAYERS', message: 'Invalid players parameter: must be a non-empty array', userMessage: 'At least one player is required.' });
  }
  
  logger.log(`🎮 startNewGame called with category: "${category}", players: ${players}, totalRounds: ${totalRounds}, selectedQuestion: ${selectedQuestion ? 'YES' : 'NO'}`);
  
  // Get questions for this specific category
  const questions = await getQuestionsByCategory(category);
  if (!questions || !Array.isArray(questions)) {
    logger.error(`❌ Invalid questions returned for category: ${category}`);
    throw new AppError({ code: 'GAME_INVALID_QUESTIONS', message: `Invalid questions returned for category: ${category}`, userMessage: 'Unable to load questions for this category.' });
  }
  
  logger.log(`🎮 Found ${questions.length} questions for category "${category}"`);
  
  if (questions.length === 0) {
    logger.error(`❌ No questions found for category: ${category}`);
    throw new AppError({ code: 'GAME_NO_QUESTIONS', message: `No questions found for category: ${category}`, userMessage: 'No questions available for this category.' });
  }
  
  let shuffledQuestions;
  let currentQuestion;
  
  if (selectedQuestion) {
    // If a specific question is selected, use it directly
    logger.log(`🎮 Using selected question: "${selectedQuestion.title}"`);
    currentQuestion = selectedQuestion;
    shuffledQuestions = [selectedQuestion]; // Only one question for single question mode
    totalRounds = 1; // Force single question mode
  } else {
    // Shuffle questions for random selection mode
    shuffledQuestions = shuffleQuestions(questions);
    if (!shuffledQuestions || !Array.isArray(shuffledQuestions)) {
      logger.error(`❌ Failed to shuffle questions for category: ${category}`);
      throw new AppError({ code: 'GAME_SHUFFLE_FAILED', message: `Failed to shuffle questions for category: ${category}`, userMessage: 'Unable to prepare game questions.' });
    }
    currentQuestion = shuffledQuestions[0] || null;
    logger.log(`🎮 Shuffled questions for "${category}":`, shuffledQuestions.map(q => q.title));
  }
  
  // Adjust totalRounds to match available questions
  const actualTotalRounds = Math.min(totalRounds, shuffledQuestions.length);
  logger.log(`🎮 Adjusted totalRounds from ${totalRounds} to ${actualTotalRounds}`);
  
  const gameState: GameState = {
    gameId: await generateGameId(),
    category,
    players,
    currentRound: 1,
    totalRounds: actualTotalRounds,
    rounds: [],
    scores: players.reduce((acc, playerId) => {
      acc[playerId] = 0;
      return acc;
    }, {} as { [playerId: string]: number }),
    gamePhase: 'lobby',
    timeRemaining: 0,
    currentQuestion: currentQuestion,
    roundStartTime: Date.now()
  };
  
  logger.log(`🎮 Game state created successfully`);
  if (gameState.currentQuestion) {
    logger.log(`🎮 First question: "${gameState.currentQuestion.title}"`);
    logger.log(`🎮 Available answers:`, gameState.currentQuestion.answers.map(a => `${a.text} (rank: ${a.rank}, points: ${a.points})`));
  } else {
    logger.log(`🎮 First question: null`);
  }
  
  // Store shuffled questions in a way that doesn't break types
  gameState.shuffledQuestions = shuffledQuestions;
  
  logger.log(`🎮 DEBUG: Stored shuffledQuestions in gameState:`, {
    category: gameState.category,
    shuffledQuestionsCount: shuffledQuestions.length,
    firstQuestion: shuffledQuestions[0]?.title,
    allQuestions: shuffledQuestions.map(q => q.title)
  });
  
  return gameState;
};

// Submit an answer for the current round
export const submitAnswer = (
  gameState: GameState,
  playerId: string,
  answer: string,
  timeTaken: number
): GameState => {
  const updatedState = { ...gameState };
  
  if (updatedState.gamePhase !== 'question') {
    throw new AppError({ code: 'GAME_INVALID_PHASE', message: 'Cannot submit answer: game is not in question phase', userMessage: 'Cannot submit answer right now.' });
  }
  
  if (!updatedState.currentQuestion) {
    throw new AppError({ code: 'GAME_NO_QUESTION', message: 'No current question available', userMessage: 'No question available.' });
  }
  
  // Find the correct answer
  if (!updatedState.currentQuestion.answers || !Array.isArray(updatedState.currentQuestion.answers)) {
    throw new AppError({ code: 'GAME_NO_ANSWERS', message: 'No answers available for current question', userMessage: 'Question data is incomplete.' });
  }
  
  const correctAnswer = updatedState.currentQuestion.answers.find(
    a => a.text.toLowerCase().trim() === answer.toLowerCase().trim()
  );
  
  if (!correctAnswer) {
    throw new AppError({ code: 'GAME_INVALID_ANSWER', message: 'Invalid answer submitted', userMessage: 'That answer is not correct.' });
  }
  
  // Create or update the current round
  if (!updatedState.rounds || !Array.isArray(updatedState.rounds)) {
    updatedState.rounds = [];
  }
  
  let currentRound = updatedState.rounds.find(r => r.roundNumber === updatedState.currentRound);
  
  if (!currentRound) {
    currentRound = {
      question: updatedState.currentQuestion,
      playerAnswers: [],
      roundNumber: updatedState.currentRound,
      timeLimit: 0
    };
    updatedState.rounds.push(currentRound);
  }
  
  // Add the answer
  if (!currentRound.playerAnswers || !Array.isArray(currentRound.playerAnswers)) {
    currentRound.playerAnswers = [];
  }
  
  currentRound.playerAnswers.push({
    playerId,
    answer,
    timeTaken,
    isCorrect: true,
    rank: correctAnswer.rank,
    points: correctAnswer.points
  });
  
  // Update scores
  if (!updatedState.scores) {
    updatedState.scores = {};
  }
  updatedState.scores[playerId] = (updatedState.scores[playerId] || 0) + correctAnswer.points;
  
  // Check if round is complete
  if (isQuestionComplete(currentRound)) {
    updatedState.gamePhase = 'answered';
  }
  
  return updatedState;
};

// Move to the next question
export const nextQuestion = (gameState: GameState): GameState => {
  logger.log(`🔄 nextQuestion called for round ${gameState.currentRound + 1}`);
  
  const updatedState = { ...gameState };
  
  if (updatedState.currentRound >= updatedState.totalRounds) {
    logger.log(`🏁 Game finished - reached max rounds (${updatedState.totalRounds})`);
    updatedState.gamePhase = 'finished';
    return updatedState;
  }
  
  // Move to next round
  updatedState.currentRound += 1;
  updatedState.gamePhase = 'question';
  updatedState.roundStartTime = Date.now();
  
  // Get next question from stored shuffled questions
  const shuffledQuestions = gameState.shuffledQuestions;
  logger.log(`🎮 DEBUG: nextQuestion - Retrieved shuffledQuestions:`, {
    category: updatedState.category,
    currentRound: updatedState.currentRound,
    shuffledQuestionsCount: shuffledQuestions?.length,
    allQuestions: shuffledQuestions?.map((q: GameQuestion) => q.title) || []
  });
  
  if (!shuffledQuestions || shuffledQuestions.length === 0) {
    logger.error(`❌ No shuffled questions found for category: ${updatedState.category}`);
    updatedState.gamePhase = 'finished';
    return updatedState;
  }
  
  const questionIndex = (updatedState.currentRound - 1) % shuffledQuestions.length;
  if (questionIndex >= 0 && questionIndex < shuffledQuestions.length) {
    updatedState.currentQuestion = shuffledQuestions[questionIndex];
  } else {
    logger.error(`❌ Invalid question index: ${questionIndex}, available questions: ${shuffledQuestions.length}`);
    updatedState.gamePhase = 'finished';
    return updatedState;
  }
  
  logger.log(`🔄 Next Question - Round ${updatedState.currentRound}, Question Index: ${questionIndex}`);
  if (updatedState.currentQuestion) {
    logger.log(`🔄 Question: "${updatedState.currentQuestion.title}"`);
  } else {
    logger.log(`🔄 Question: null`);
  }
  logger.log(`🔄 Available questions: ${shuffledQuestions.length}`);
  
  return updatedState;
};

// Get current game score
export const getGameScore = (gameState: GameState): { [playerId: string]: number } => {
  if (!gameState.scores) return {};
  return { ...gameState.scores };
};

// Get current round info
export const getCurrentRoundInfo = (gameState: GameState) => {
  if (!gameState.currentQuestion || !gameState.currentRound || !gameState.totalRounds) return null;
  
  return {
    roundNumber: gameState.currentRound,
    totalRounds: gameState.totalRounds,
    question: gameState.currentQuestion,
    startTime: gameState.roundStartTime
  };
};

// Check if game is finished
export const isGameFinished = (gameState: GameState): boolean => {
  return gameState.gamePhase === 'finished';
};

/**
 * Calculate round scores for all players
 */
export const calculateRoundScores = (round: GameRound): { [playerId: string]: number } => {
  const roundScores: { [playerId: string]: number } = {};
  
  if (round.playerAnswers && Array.isArray(round.playerAnswers)) {
    round.playerAnswers.forEach(playerAnswer => {
      roundScores[playerAnswer.playerId] = playerAnswer.points || 0;
    });
  }
  
  return roundScores;
};

/**
 * Determine the game winner
 */
export const determineGameWinner = (finalScores: { [playerId: string]: number }): string => {
  if (!finalScores || typeof finalScores !== 'object') return '';
  
  let winner = '';
  let highestScore = -1;
  
  Object.entries(finalScores).forEach(([playerId, score]) => {
    if (score > highestScore) {
      highestScore = score;
      winner = playerId;
    }
  });
  
  return winner;
};

/**
 * Format answer for comparison (normalize text)
 */
export const formatAnswer = (rawAnswer: string): string => {
  if (!rawAnswer || typeof rawAnswer !== 'string') return '';
  
  return rawAnswer
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ');
};

/**
 * Get game progress percentage
 */
export const getGameProgress = (gameState: GameState): number => {
  if (!gameState.currentRound || !gameState.totalRounds) return 0;
  return (gameState.currentRound / gameState.totalRounds) * 100;
};

/**
 * Get player ranking
 */
export const getPlayerRanking = (scores: { [playerId: string]: number }): Array<{ playerId: string; score: number; rank: number }> => {
  if (!scores || typeof scores !== 'object') return [];
  
  return Object.entries(scores)
    .map(([playerId, score]) => ({ playerId, score }))
    .sort((a, b) => b.score - a.score)
    .map((player, index) => ({ ...player, rank: index + 1 }));
};

/**
 * Validate game state
 */
export const validateGameState = (gameState: GameState): boolean => {
  return !!(
    gameState.gameId &&
    gameState.category &&
    gameState.players && Array.isArray(gameState.players) && gameState.players.length > 0 &&
    gameState.currentRound > 0 &&
    gameState.totalRounds > 0 &&
    gameState.gamePhase
  );
};

/**
 * Get game statistics
 */
export const getGameStats = (gameState: GameState) => {
  if (!gameState.rounds || !Array.isArray(gameState.rounds) || !gameState.players || !Array.isArray(gameState.players)) {
    return {
      totalRounds: 0,
      currentRound: 0,
      totalAnswers: 0,
      correctAnswers: 0,
      accuracy: 0,
      averageScore: 0
    };
  }
  
  const totalAnswers = gameState.rounds.reduce((total, round) => {
    if (!round.playerAnswers || !Array.isArray(round.playerAnswers)) return total;
    return total + round.playerAnswers.length;
  }, 0);
  
  const correctAnswers = gameState.rounds.reduce((total, round) => {
    if (!round.playerAnswers || !Array.isArray(round.playerAnswers)) return total;
    return total + round.playerAnswers.filter(answer => answer.isCorrect).length;
  }, 0);
  
  return {
    totalRounds: gameState.totalRounds,
    currentRound: gameState.currentRound,
    totalAnswers,
    correctAnswers,
    accuracy: totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0,
    averageScore: Object.values(gameState.scores).reduce((sum, score) => sum + score, 0) / gameState.players.length
  };
};
