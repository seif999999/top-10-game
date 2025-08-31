import { GameState, GameRound, GameQuestion, PlayerAnswer, GameResults } from '../types';
import { getQuestionsByCategory, shuffleQuestions } from './questionsService';

// Generate unique game ID
const generateGameId = (): string => {
  return `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Check if a question is complete (all answers submitted)
export const isQuestionComplete = (round: GameRound): boolean => {
  if (!round.playerAnswers || !Array.isArray(round.playerAnswers)) return false;
  return round.playerAnswers.length >= 10; // Top 10 game - need 10 answers
};

// Check if current question is complete (alias for compatibility)
export const checkQuestionComplete = (gameState: GameState): boolean => { 
  if (!gameState.currentQuestion) return false;
  
  console.log(`🔍 checkQuestionComplete - Debug:`, {
    currentRound: gameState.currentRound,
    roundsLength: gameState.rounds?.length,
    rounds: gameState.rounds?.map(r => ({ roundNumber: r.roundNumber, answersCount: r.playerAnswers?.length || 0 }))
  });
  
  const currentRound = gameState.rounds.find(r => r.roundNumber === gameState.currentRound);
  if (!currentRound || !currentRound.playerAnswers || !Array.isArray(currentRound.playerAnswers)) {
    console.log(`🔍 No current round found or no player answers`);
    return false;
  }
  
  const isComplete = currentRound.playerAnswers.length >= 10;
  console.log(`🔍 Question complete check: ${currentRound.playerAnswers.length}/10 answers - ${isComplete ? 'YES' : 'NO'}`);
  
  return isComplete;
};

// Process a player's answer
export const processAnswer = (
  gameState: GameState,
  playerId: string,
  answer: string
): { updatedState: GameState; answerResult: PlayerAnswer } => {
  if (!gameState.currentQuestion || gameState.gamePhase !== 'question') {
    throw new Error('Game is not in question phase');
  }
  
  console.log(`\n🎮 PROCESSING ANSWER:`);
  console.log(`   Player: ${playerId}`);
  console.log(`   Answer: "${answer}"`);
  console.log(`   Question: "${gameState.currentQuestion.title}"`);
  if (gameState.currentQuestion.answers && Array.isArray(gameState.currentQuestion.answers)) {
    console.log(`   Available answers:`, gameState.currentQuestion.answers.map(a => `${a.text} (rank: ${a.rank}, points: ${a.points})`));
  } else {
    console.log(`   Available answers: []`);
  }
  
  // Calculate time taken since round started
  const timeTaken = Math.floor((Date.now() - (gameState.roundStartTime || Date.now())) / 1000);
  
  // Find the correct answer
  if (!gameState.currentQuestion.answers || !Array.isArray(gameState.currentQuestion.answers)) {
    throw new Error('No answers available for current question');
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
    throw new Error('Invalid answer submitted');
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
  
  console.log(`🎯 Score updated for player ${playerId}: ${updatedState.scores[playerId]}`);
  console.log(`🎯 Points awarded: ${correctAnswer.points} for answer "${correctAnswer.text}" (rank ${correctAnswer.rank})`);
  
  // Check if all 10 answers have been found
  const currentRound = updatedState.rounds[updatedState.currentRound - 1];
  if (currentRound && currentRound.playerAnswers && currentRound.playerAnswers.length >= 10) {
    console.log(`🎉 All 10 answers found! Ending game...`);
    updatedState.gamePhase = 'finished';
  }
  
  return { updatedState, answerResult: playerAnswer };
};

// Generate game results
export const generateGameResults = (gameState: GameState): GameResults => {
  console.log(`🎮 generateGameResults called with:`, {
    hasRounds: !!gameState.rounds,
    roundsLength: gameState.rounds?.length,
    hasPlayers: !!gameState.players,
    playersLength: gameState.players?.length,
    scores: gameState.scores
  });
  
  // Handle case where rounds might be empty or undefined
  if (!gameState.rounds || !Array.isArray(gameState.rounds)) {
    console.log(`⚠️ No rounds found, creating empty rounds array`);
    gameState.rounds = [];
  }
  
  if (!gameState.players || !Array.isArray(gameState.players)) {
    console.log(`⚠️ No players found, creating default player array`);
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
  
  console.log(`🎮 Generated game results:`, results);
  return results;
};

// Start a new game
export const startNewGame = (
  category: string,
  players: string[],
  totalRounds: number = 10,
  selectedQuestion?: any
): GameState => {
  if (!players || !Array.isArray(players) || players.length === 0) {
    throw new Error('Invalid players parameter: must be a non-empty array');
  }
  
  console.log(`🎮 startNewGame called with category: "${category}", players: ${players}, totalRounds: ${totalRounds}, selectedQuestion: ${selectedQuestion ? 'YES' : 'NO'}`);
  
  // Get questions for this specific category
  const questions = getQuestionsByCategory(category);
  if (!questions || !Array.isArray(questions)) {
    console.error(`❌ Invalid questions returned for category: ${category}`);
    throw new Error(`Invalid questions returned for category: ${category}`);
  }
  
  console.log(`🎮 Found ${questions.length} questions for category "${category}"`);
  
  if (questions.length === 0) {
    console.error(`❌ No questions found for category: ${category}`);
    throw new Error(`No questions found for category: ${category}`);
  }
  
  let shuffledQuestions;
  let currentQuestion;
  
  if (selectedQuestion) {
    // If a specific question is selected, use it directly
    console.log(`🎮 Using selected question: "${selectedQuestion.title}"`);
    currentQuestion = selectedQuestion;
    shuffledQuestions = [selectedQuestion]; // Only one question for single question mode
    totalRounds = 1; // Force single question mode
  } else {
    // Shuffle questions for random selection mode
    shuffledQuestions = shuffleQuestions(questions);
    if (!shuffledQuestions || !Array.isArray(shuffledQuestions)) {
      console.error(`❌ Failed to shuffle questions for category: ${category}`);
      throw new Error(`Failed to shuffle questions for category: ${category}`);
    }
    currentQuestion = shuffledQuestions[0] || null;
    console.log(`🎮 Shuffled questions for "${category}":`, shuffledQuestions.map(q => q.title));
  }
  
  // Adjust totalRounds to match available questions
  const actualTotalRounds = Math.min(totalRounds, shuffledQuestions.length);
  console.log(`🎮 Adjusted totalRounds from ${totalRounds} to ${actualTotalRounds}`);
  
  const gameState: GameState = {
    gameId: generateGameId(),
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
  
  console.log(`🎮 Game state created successfully`);
  if (gameState.currentQuestion) {
    console.log(`🎮 First question: "${gameState.currentQuestion.title}"`);
    console.log(`🎮 Available answers:`, gameState.currentQuestion.answers.map(a => `${a.text} (rank: ${a.rank}, points: ${a.points})`));
  } else {
    console.log(`🎮 First question: null`);
  }
  
  // Store shuffled questions in a way that doesn't break types
  (gameState as any).shuffledQuestions = shuffledQuestions;
  
  console.log(`🎮 DEBUG: Stored shuffledQuestions in gameState:`, {
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
    throw new Error('Cannot submit answer: game is not in question phase');
  }
  
  if (!updatedState.currentQuestion) {
    throw new Error('No current question available');
  }
  
  // Find the correct answer
  if (!updatedState.currentQuestion.answers || !Array.isArray(updatedState.currentQuestion.answers)) {
    throw new Error('No answers available for current question');
  }
  
  const correctAnswer = updatedState.currentQuestion.answers.find(
    a => a.text.toLowerCase().trim() === answer.toLowerCase().trim()
  );
  
  if (!correctAnswer) {
    throw new Error('Invalid answer submitted');
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
  console.log(`🔄 nextQuestion called for round ${gameState.currentRound + 1}`);
  
  const updatedState = { ...gameState };
  
  if (updatedState.currentRound >= updatedState.totalRounds) {
    console.log(`🏁 Game finished - reached max rounds (${updatedState.totalRounds})`);
    updatedState.gamePhase = 'finished';
    return updatedState;
  }
  
  // Move to next round
  updatedState.currentRound += 1;
  updatedState.gamePhase = 'question';
  updatedState.roundStartTime = Date.now();
  
  // Get next question from stored shuffled questions
  const shuffledQuestions = (gameState as any).shuffledQuestions;
  console.log(`🎮 DEBUG: nextQuestion - Retrieved shuffledQuestions:`, {
    category: updatedState.category,
    currentRound: updatedState.currentRound,
    shuffledQuestionsCount: shuffledQuestions?.length,
    allQuestions: shuffledQuestions?.map((q: GameQuestion) => q.title) || []
  });
  
  if (!shuffledQuestions || shuffledQuestions.length === 0) {
    console.error(`❌ No shuffled questions found for category: ${updatedState.category}`);
    updatedState.gamePhase = 'finished';
    return updatedState;
  }
  
  const questionIndex = (updatedState.currentRound - 1) % shuffledQuestions.length;
  if (questionIndex >= 0 && questionIndex < shuffledQuestions.length) {
    updatedState.currentQuestion = shuffledQuestions[questionIndex];
  } else {
    console.error(`❌ Invalid question index: ${questionIndex}, available questions: ${shuffledQuestions.length}`);
    updatedState.gamePhase = 'finished';
    return updatedState;
  }
  
  console.log(`🔄 Next Question - Round ${updatedState.currentRound}, Question Index: ${questionIndex}`);
  if (updatedState.currentQuestion) {
    console.log(`🔄 Question: "${updatedState.currentQuestion.title}"`);
  } else {
    console.log(`🔄 Question: null`);
  }
  console.log(`🔄 Available questions: ${shuffledQuestions.length}`);
  
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
