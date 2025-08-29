import { GameQuestion, QuestionAnswer } from '../data/sampleQuestions';
import { validateAnswer, calculateScore, shuffleQuestions, getQuestionsByCategory } from './questionsService';

export interface PlayerAnswer {
  playerId: string;
  answer: string;
  timeTaken: number;
  isCorrect: boolean;
  rank?: number;
  points?: number;
  similarity?: number;
}

export interface GameRound {
  question: GameQuestion;
  playerAnswers: PlayerAnswer[];
  roundNumber: number;
  timeLimit: number;
}

export interface GameState {
  gameId: string;
  category: string;
  players: string[];
  currentRound: number;
  totalRounds: number;
  rounds: GameRound[];
  scores: { [playerId: string]: number };
  gamePhase: 'lobby' | 'question' | 'answered' | 'results' | 'finished';
  timeRemaining: number;
  isUnlimitedTime: boolean;
  currentQuestion?: GameQuestion;
  roundStartTime?: number;
}

export interface GameResults {
  gameId: string;
  category: string;
  players: string[];
  finalScores: { [playerId: string]: number };
  roundResults: GameRound[];
  winner: string;
  totalTime: number;
  averageScore: number;
  bestAnswer?: PlayerAnswer;
}

/**
 * Start a new game with specified category and players
 */
export const startNewGame = (
  category: string, 
  players: string[], 
  totalRounds: number = 10,
  timeLimit: number = 60
): GameState => {
  const questions = getQuestionsByCategory(category);
  const shuffledQuestions = shuffleQuestions(questions).slice(0, totalRounds);
  
  const isUnlimitedTime = timeLimit === -1;
  
  const gameState: GameState = {
    gameId: generateGameId(),
    category,
    players,
    currentRound: 1,
    totalRounds,
    rounds: [],
    scores: players.reduce((acc, playerId) => {
      acc[playerId] = 0;
      return acc;
    }, {} as { [playerId: string]: number }),
    gamePhase: 'lobby',
    timeRemaining: isUnlimitedTime ? 999999 : timeLimit, // Use a large number for unlimited time
    isUnlimitedTime,
    currentQuestion: shuffledQuestions[0],
    roundStartTime: Date.now()
  };
  
  return gameState;
};

/**
 * Process a player's answer
 */
export const processAnswer = (
  gameState: GameState,
  playerId: string,
  answer: string,
  timeRemaining: number
): { updatedState: GameState; answerResult: PlayerAnswer } => {
  if (!gameState.currentQuestion || gameState.gamePhase !== 'question') {
    throw new Error('Game is not in question phase');
  }
  
  console.log(`\n🎮 PROCESSING ANSWER:`);
  console.log(`   Player: ${playerId}`);
  console.log(`   Answer: "${answer}"`);
  console.log(`   Question: "${gameState.currentQuestion.title}"`);
  console.log(`   Available answers:`, gameState.currentQuestion.answers.map(a => `${a.text} (rank: ${a.rank}, points: ${a.points})`));
  
  let timeTaken: number;

  if (gameState.isUnlimitedTime) {
    // In infinite mode, calculate actual elapsed time since the round started
    timeTaken = Math.floor((Date.now() - (gameState.roundStartTime || Date.now())) / 1000);
  } else {
    // Normal countdown mode
    timeTaken = gameState.timeRemaining - timeRemaining;
  }
  
  const validation = validateAnswer(answer, gameState.currentQuestion.answers);
  
  console.log(`   Validation result:`, validation);
  
  const playerAnswer: PlayerAnswer = {
    playerId,
    answer,
    timeTaken,
    isCorrect: validation.isCorrect,
    rank: validation.rank,
    points: 0, // We'll set this based on rank
    similarity: validation.similarity
  };
  
  // Update game state
  const updatedState = { ...gameState };
  
  // SIMPLE SCORING: Just use the rank as points
  if (validation.isCorrect && validation.rank) {
    const score = validation.rank; // Rank 1 = 1 point, Rank 10 = 10 points
    
    playerAnswer.points = score;
    
    // Simple score addition
    if (!updatedState.scores[playerId]) {
      updatedState.scores[playerId] = 0;
    }
    const previousScore = updatedState.scores[playerId];
    updatedState.scores[playerId] += score;
    
    console.log(`🎯 SIMPLE SCORE: Player ${playerId}`);
    console.log(`   Previous Score: ${previousScore}`);
    console.log(`   Points Earned: ${score} (rank ${validation.rank})`);
    console.log(`   New Total Score: ${updatedState.scores[playerId]}`);
    console.log(`   Updated state scores:`, updatedState.scores);
  } else {
    console.log(`❌ No points awarded - validation failed`);
  }
  
  // Add answer to current round
  if (!updatedState.rounds[updatedState.currentRound - 1]) {
    updatedState.rounds[updatedState.currentRound - 1] = {
      question: gameState.currentQuestion,
      playerAnswers: [],
      roundNumber: updatedState.currentRound,
      timeLimit: gameState.timeRemaining
    };
  }
  
  updatedState.rounds[updatedState.currentRound - 1].playerAnswers.push(playerAnswer);
  
  // Keep the game in 'question' phase to allow multiple answers
  // Only change to 'answered' when time runs out or manually triggered
  
  return { updatedState, answerResult: playerAnswer };
};

/**
 * Move to next question or end game
 */
export const nextQuestion = (gameState: GameState): GameState => {
  const updatedState = { ...gameState };
  
  console.log(`🔄 Next Question - Current scores:`, updatedState.scores);
  
  if (updatedState.currentRound >= updatedState.totalRounds) {
    // Game finished
    updatedState.gamePhase = 'finished';
    return updatedState;
  }
  
  // Move to next round
  updatedState.currentRound += 1;
  updatedState.gamePhase = 'question';
  updatedState.timeRemaining = updatedState.rounds[0]?.timeLimit || 60;
  updatedState.roundStartTime = Date.now();
  
  // Get next question
  const questions = getQuestionsByCategory(updatedState.category);
  const shuffledQuestions = shuffleQuestions(questions);
  updatedState.currentQuestion = shuffledQuestions[updatedState.currentRound - 1];
  
  console.log(`🔄 Next Question - Scores after update:`, updatedState.scores);
  
  return updatedState;
};

/**
 * Calculate round scores for all players
 */
export const calculateRoundScores = (round: GameRound): { [playerId: string]: number } => {
  const roundScores: { [playerId: string]: number } = {};
  
  round.playerAnswers.forEach(playerAnswer => {
    roundScores[playerAnswer.playerId] = playerAnswer.points || 0;
  });
  
  return roundScores;
};

/**
 * Determine the game winner
 */
export const determineGameWinner = (finalScores: { [playerId: string]: number }): string => {
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
  return rawAnswer
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ');
};

/**
 * Generate game results summary
 */
export const generateGameResults = (gameState: GameState): GameResults => {
  const totalTime = gameState.rounds.reduce((total, round) => {
    return total + round.playerAnswers.reduce((roundTotal, answer) => {
      return roundTotal + answer.timeTaken;
    }, 0);
  }, 0);
  
  const totalScore = Object.values(gameState.scores).reduce((sum, score) => sum + score, 0);
  const averageScore = totalScore / gameState.players.length;
  
  // Find best answer (highest points in shortest time)
  let bestAnswer: PlayerAnswer | undefined;
  let bestScore = 0;
  
  gameState.rounds.forEach(round => {
    round.playerAnswers.forEach(answer => {
      if (answer.points && answer.points > bestScore) {
        bestScore = answer.points;
        bestAnswer = answer;
      }
    });
  });
  
  return {
    gameId: gameState.gameId,
    category: gameState.category,
    players: gameState.players,
    finalScores: gameState.scores,
    roundResults: gameState.rounds,
    winner: determineGameWinner(gameState.scores),
    totalTime,
    averageScore,
    bestAnswer
  };
};

/**
 * Check if all players have answered in current round
 */
export const allPlayersAnswered = (gameState: GameState): boolean => {
  if (!gameState.currentQuestion) return false;
  
  const currentRound = gameState.rounds[gameState.currentRound - 1];
  if (!currentRound) return false;
  
  return currentRound.playerAnswers.length >= gameState.players.length;
};

/**
 * Get game progress percentage
 */
export const getGameProgress = (gameState: GameState): number => {
  return (gameState.currentRound / gameState.totalRounds) * 100;
};

/**
 * Get player ranking
 */
export const getPlayerRanking = (scores: { [playerId: string]: number }): Array<{ playerId: string; score: number; rank: number }> => {
  return Object.entries(scores)
    .map(([playerId, score]) => ({ playerId, score }))
    .sort((a, b) => b.score - a.score)
    .map((player, index) => ({ ...player, rank: index + 1 }));
};

/**
 * Generate unique game ID
 */
const generateGameId = (): string => {
  return `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Validate game state
 */
export const validateGameState = (gameState: GameState): boolean => {
  return !!(
    gameState.gameId &&
    gameState.category &&
    gameState.players.length > 0 &&
    gameState.currentRound > 0 &&
    gameState.totalRounds > 0 &&
    gameState.gamePhase
  );
};

/**
 * Get game statistics
 */
export const getGameStats = (gameState: GameState) => {
  const totalAnswers = gameState.rounds.reduce((total, round) => total + round.playerAnswers.length, 0);
  const correctAnswers = gameState.rounds.reduce((total, round) => {
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
