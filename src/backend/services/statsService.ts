import { saveGameStats, getPlayerStats, savePlayerStats, saveGameHistory, getGameHistory, GameStats, GameHistory } from './localStorage';
import { logger } from '../utils/logger';
import { missionService } from './missionService';
import { GameEventData, MissionBatchResult } from '../../shared/types/missions';

export interface GamePerformance {
  totalGames: number;
  totalScore: number;
  averageScore: number;
  bestScore: number;
  accuracy: number;
  totalTime: number;
  averageTimePerQuestion: number;
  bestCategory: string;
  mostPlayedCategory: string;
  recentPerformance: 'improving' | 'declining' | 'stable';
  currentStreak: number;
  bestStreak: number;
  wins: number;
  losses: number;
  winRate: number;
  multiplayerWins: number;
  multiplayerLosses: number;
  localGamesHosted: number;
  multiplayerGames: number;
  fastestAnswerTime: number | null;
  longestCorrectStreak: number;
  currentCorrectStreak: number;
}

export type PlayerStatistics = GamePerformance;

export interface CategoryStats {
  category: string;
  gamesPlayed: number;
  totalScore: number;
  averageScore: number;
  bestScore: number;
  accuracy: number;
  lastPlayed: string;
}

/**
 * Update game statistics after a game
 */
export const updateGameStats = async (
  userId: string, 
  score: number, 
  category: string, 
  correctAnswers: number,
  totalQuestions: number,
  timeTaken: number,
  isMultiplayer: boolean = false,
  isWinner: boolean = false,
  finalRank?: number,
  playerCount?: number,
  completionKey?: string
): Promise<MissionBatchResult | null> => {
  try {
    const existingStats = await getPlayerStats(userId);
    if (
      completionKey &&
      (existingStats.recordedCompletionKeys || []).includes(completionKey)
    ) {
      logger.log('Skipping duplicate game completion stats update', { userId, completionKey });
      return null;
    }

    const gameId = completionKey ? `game_${completionKey}` : `game_${Date.now()}`;
    
    // Create game results object
    const gameResults = {
      finalScores: { [userId]: score },
      roundResults: [{
        playerAnswers: [{
          isCorrect: correctAnswers > 0,
          points: score
        }]
      }]
    };

    // Save game stats
    await saveGameStats(userId, gameResults);

    // Save game history
    const gameHistory: GameHistory = {
      gameId,
      category,
      score,
      correctAnswers,
      totalQuestions,
      date: new Date().toISOString(),
      timeTaken,
      isMultiplayer,
      isWinner: isMultiplayer ? isWinner : undefined,
    };

    await saveGameHistory(userId, gameHistory);

    const statsAfterSave = await getPlayerStats(userId);
    const updatedStats: GameStats = { ...statsAfterSave };

    if (isMultiplayer) {
      updatedStats.multiplayerGames += 1;
      if (isWinner) {
        updatedStats.wins += 1;
        updatedStats.multiplayerWins += 1;
      } else {
        updatedStats.losses += 1;
        updatedStats.multiplayerLosses += 1;
      }
    } else {
      updatedStats.localGamesHosted += 1;
    }

    if (completionKey) {
      updatedStats.recordedCompletionKeys = [
        ...(statsAfterSave.recordedCompletionKeys || []).slice(-99),
        completionKey,
      ];
    }

    await savePlayerStats(userId, updatedStats);

    // Process mission events for game completion
    const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
    
    const gameEvent: GameEventData = {
      userId,
      gameId,
      isMultiplayer,
      gameCompleted: {
        category,
        totalScore: score,
        correctAnswers,
        totalAnswers: totalQuestions,
        accuracy,
        isWinner,
        finalRank,
        playerCount,
      },
    };

    // Process leaderboard position for multiplayer
    if (isMultiplayer && finalRank !== undefined) {
      gameEvent.leaderboardPosition = {
        position: finalRank,
        isNewTop1: finalRank === 1,
      };
    }

    // Process mission events and return results
    const missionResult = await missionService.processGameEvent(gameEvent);
    
    if (missionResult.newlyCompletedMissions.length > 0) {
      logger.log(`🎉 Missions completed: ${missionResult.newlyCompletedMissions.join(', ')}`);
      logger.log(`💰 Total coins earned from missions: ${missionResult.totalCoinsEarned}`);
    }

    return missionResult;
  } catch (error) {
    logger.error('Error updating game stats:', error);
    return null;
  }
};

/**
 * Process a correct answer for mission tracking
 */
export const processAnswerForMissions = async (
  userId: string,
  gameId: string,
  isCorrect: boolean,
  rank?: number,
  points?: number,
  timeTaken?: number,
  isMultiplayer: boolean = false
): Promise<MissionBatchResult | null> => {
  try {
    const gameEvent: GameEventData = {
      userId,
      gameId,
      isMultiplayer,
      answer: {
        isCorrect,
        rank,
        points,
        timeTaken,
      },
    };

    return await missionService.processGameEvent(gameEvent);
  } catch (error) {
    logger.error('Error processing answer for missions:', error);
    return null;
  }
};

/**
 * Track per-answer statistics (correct streak, fastest answer time)
 */
export const recordAnswerStats = async (
  userId: string,
  isCorrect: boolean,
  timeTakenSeconds: number
): Promise<void> => {
  try {
    const stats = await getPlayerStats(userId);
    const normalizedTime = Math.max(0, Math.floor(timeTakenSeconds));

    if (isCorrect) {
      const nextStreak = stats.currentCorrectStreak + 1;
      stats.currentCorrectStreak = nextStreak;
      stats.longestCorrectStreak = Math.max(stats.longestCorrectStreak, nextStreak);
      if (normalizedTime > 0) {
        stats.fastestAnswerTime =
          stats.fastestAnswerTime == null
            ? normalizedTime
            : Math.min(stats.fastestAnswerTime, normalizedTime);
      }
    } else {
      stats.currentCorrectStreak = 0;
    }

    await savePlayerStats(userId, stats);
  } catch (error) {
    logger.error('Error recording answer stats:', error);
  }
};

/**
 * Get full player statistics for profile display
 */
export const getPlayerStatistics = async (userId: string): Promise<PlayerStatistics> => {
  return getGamePerformance(userId);
};

/**
 * Calculate average score from game history
 */
export const calculateAverageScore = (gameHistory: GameHistory[]): number => {
  if (gameHistory.length === 0) return 0;
  
  const totalScore = gameHistory.reduce((sum, game) => sum + game.score, 0);
  return Math.round(totalScore / gameHistory.length);
};

/**
 * Calculate current and best streaks from game history
 */
export const calculateStreaks = (gameHistory: GameHistory[]): { currentStreak: number; bestStreak: number } => {
  if (gameHistory.length === 0) return { currentStreak: 0, bestStreak: 0 };

  // Sort games by date (most recent first)
  const sortedGames = [...gameHistory].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  let currentStreak = 0;
  let bestStreak = 0;
  let tempStreak = 0;

  // Calculate streaks (assuming a win is when score > 0)
  for (let i = 0; i < sortedGames.length; i++) {
    const game = sortedGames[i];
    
    if (game.score > 0) {
      // This is a win
      if (i === 0) {
        // Most recent game - start current streak
        currentStreak = 1;
        tempStreak = 1;
      } else {
        // Check if this is consecutive with previous game
        const prevGame = sortedGames[i - 1];
        const timeDiff = new Date(game.date).getTime() - new Date(prevGame.date).getTime();
        const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
        
        if (daysDiff <= 1) {
          // Consecutive days
          tempStreak++;
          if (i === 0) {
            currentStreak = tempStreak;
          }
        } else {
          // Streak broken
          if (tempStreak > bestStreak) {
            bestStreak = tempStreak;
          }
          tempStreak = 1;
          if (i === 0) {
            currentStreak = 1;
          }
        }
      }
    } else {
      // This is a loss - streak broken
      if (tempStreak > bestStreak) {
        bestStreak = tempStreak;
      }
      tempStreak = 0;
      if (i === 0) {
        currentStreak = 0;
      }
    }
  }

  // Check if tempStreak is better than bestStreak
  if (tempStreak > bestStreak) {
    bestStreak = tempStreak;
  }

  return { currentStreak, bestStreak };
};

/**
 * Win/loss streaks from online multiplayer games only
 */
export const calculateMultiplayerWinStreaks = (
  gameHistory: GameHistory[]
): { currentStreak: number; bestStreak: number } => {
  const multiplayerGames = gameHistory
    .filter((game) => game.isMultiplayer)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (multiplayerGames.length === 0) {
    return { currentStreak: 0, bestStreak: 0 };
  }

  let currentStreak = 0;
  let bestStreak = 0;
  let tempStreak = 0;
  let currentStreakSet = false;

  for (let i = 0; i < multiplayerGames.length; i++) {
    const won = multiplayerGames[i].isWinner === true;

    if (won) {
      tempStreak += 1;
      if (!currentStreakSet) {
        currentStreak = tempStreak;
        currentStreakSet = true;
      }
      bestStreak = Math.max(bestStreak, tempStreak);
    } else {
      if (!currentStreakSet) {
        currentStreak = 0;
        currentStreakSet = true;
      }
      tempStreak = 0;
    }
  }

  return { currentStreak, bestStreak };
};

/**
 * Get best category based on average score
 */
export const getBestCategory = (gameHistory: GameHistory[]): string => {
  if (gameHistory.length === 0) return '';

  const categoryStats: { [category: string]: { totalScore: number; games: number } } = {};
  
  gameHistory.forEach(game => {
    if (!categoryStats[game.category]) {
      categoryStats[game.category] = { totalScore: 0, games: 0 };
    }
    categoryStats[game.category].totalScore += game.score;
    categoryStats[game.category].games += 1;
  });

  let bestCategory = '';
  let bestAverage = 0;

  Object.entries(categoryStats).forEach(([category, stats]) => {
    const average = stats.totalScore / stats.games;
    if (average > bestAverage) {
      bestAverage = average;
      bestCategory = category;
    }
  });

  return bestCategory;
};

/**
 * Get total games played by user
 */
export const getTotalGamesPlayed = async (userId: string): Promise<number> => {
  try {
    const stats = await getPlayerStats(userId);
    return stats.totalGames;
  } catch (error) {
    logger.error('Error getting total games played:', error);
    return 0;
  }
};

/**
 * Get comprehensive game performance metrics
 */
export const getGamePerformance = async (userId: string): Promise<GamePerformance> => {
  try {
    const stats = await getPlayerStats(userId);
    const history = await getGameHistory(userId);

    // Calculate accuracy
    const accuracy = stats.totalAnswers > 0 ? (stats.correctAnswers / stats.totalAnswers) * 100 : 0;

    // Calculate total time and average time per question
    const totalTime = history.reduce((sum, game) => sum + game.timeTaken, 0);
    const averageTimePerQuestion = history.length > 0 ? totalTime / (history.length * 10) : 0; // Assuming 10 questions per game

    // Get best category
    const bestCategory = getBestCategory(history);

    // Get most played category
    const categoryCounts: { [category: string]: number } = {};
    history.forEach(game => {
      categoryCounts[game.category] = (categoryCounts[game.category] || 0) + 1;
    });
    
    const mostPlayedCategory = Object.entries(categoryCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || '';

    // Determine recent performance trend
    const recentPerformance = calculatePerformanceTrend(history);
    const { currentStreak, bestStreak } = calculateMultiplayerWinStreaks(history);
    const historyMultiplayer = history.filter((game) => game.isMultiplayer).length;
    const historyLocal = history.filter((game) => !game.isMultiplayer).length;
    const multiplayerGames = Math.max(stats.multiplayerGames, historyMultiplayer);
    const localGamesHosted = Math.max(stats.localGamesHosted, historyLocal);
    const totalGames = Math.max(stats.totalGames, history.length, localGamesHosted + multiplayerGames);
    const multiplayerWins = stats.multiplayerWins;
    const multiplayerLosses = stats.multiplayerLosses;
    const winRate = multiplayerWins + multiplayerLosses > 0
      ? Math.round((multiplayerWins / (multiplayerWins + multiplayerLosses)) * 100)
      : 0;

    return {
      totalGames,
      totalScore: stats.totalScore,
      averageScore: stats.averageScore,
      bestScore: stats.bestScore,
      accuracy: Math.round(accuracy * 100) / 100,
      totalTime,
      averageTimePerQuestion: Math.round(averageTimePerQuestion),
      bestCategory,
      mostPlayedCategory,
      recentPerformance,
      currentStreak,
      bestStreak,
      wins: multiplayerWins,
      losses: multiplayerLosses,
      winRate,
      multiplayerWins,
      multiplayerLosses,
      localGamesHosted,
      multiplayerGames,
      fastestAnswerTime: stats.fastestAnswerTime,
      longestCorrectStreak: stats.longestCorrectStreak,
      currentCorrectStreak: stats.currentCorrectStreak,
    };
  } catch (error) {
    logger.error('Error getting game performance:', error);
    return {
      totalGames: 0,
      totalScore: 0,
      averageScore: 0,
      bestScore: 0,
      accuracy: 0,
      totalTime: 0,
      averageTimePerQuestion: 0,
      bestCategory: '',
      mostPlayedCategory: '',
      recentPerformance: 'stable',
      currentStreak: 0,
      bestStreak: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      multiplayerWins: 0,
      multiplayerLosses: 0,
      localGamesHosted: 0,
      multiplayerGames: 0,
      fastestAnswerTime: null,
      longestCorrectStreak: 0,
      currentCorrectStreak: 0,
    };
  }
};

/**
 * Get category-specific statistics
 */
export const getCategoryStats = async (userId: string): Promise<CategoryStats[]> => {
  try {
    const history = await getGameHistory(userId);
    const categoryStats: { [category: string]: CategoryStats } = {};

    history.forEach(game => {
      if (!categoryStats[game.category]) {
        categoryStats[game.category] = {
          category: game.category,
          gamesPlayed: 0,
          totalScore: 0,
          averageScore: 0,
          bestScore: 0,
          accuracy: 0,
          lastPlayed: game.date
        };
      }

      const stats = categoryStats[game.category];
      stats.gamesPlayed += 1;
      stats.totalScore += game.score;
      stats.averageScore = Math.round(stats.totalScore / stats.gamesPlayed);
      stats.bestScore = Math.max(stats.bestScore, game.score);
      stats.accuracy = Math.round((game.correctAnswers / game.totalQuestions) * 100);
      stats.lastPlayed = game.date > stats.lastPlayed ? game.date : stats.lastPlayed;
    });

    return Object.values(categoryStats).sort((a, b) => b.gamesPlayed - a.gamesPlayed);
  } catch (error) {
    logger.error('Error getting category stats:', error);
    return [];
  }
};

/**
 * Calculate performance trend based on recent games
 */
const calculatePerformanceTrend = (history: GameHistory[]): 'improving' | 'declining' | 'stable' => {
  if (history.length < 3) return 'stable';

  // Get last 5 games
  const recentGames = history.slice(0, 5);
  const olderGames = history.slice(5, 10);

  if (olderGames.length === 0) return 'stable';

  const recentAverage = calculateAverageScore(recentGames);
  const olderAverage = calculateAverageScore(olderGames);

  const difference = recentAverage - olderAverage;
  
  if (difference > 5) return 'improving';
  if (difference < -5) return 'declining';
  return 'stable';
};

/**
 * Get achievement badges based on performance
 */
export const getAchievements = async (userId: string): Promise<string[]> => {
  try {
    const performance = await getGamePerformance(userId);
    const achievements: string[] = [];

    // First game
    if (performance.totalGames >= 1) {
      achievements.push('🎮 First Game');
    }

    // 10 games milestone
    if (performance.totalGames >= 10) {
      achievements.push('🏆 10 Games Played');
    }

    // 50 games milestone
    if (performance.totalGames >= 50) {
      achievements.push('🎯 50 Games Played');
    }

    // 100 games milestone
    if (performance.totalGames >= 100) {
      achievements.push('👑 100 Games Played');
    }

    // High score achievements
    if (performance.bestScore >= 50) {
      achievements.push('🔥 High Scorer');
    }

    if (performance.bestScore >= 80) {
      achievements.push('💎 Master Scorer');
    }

    // Accuracy achievements
    if (performance.accuracy >= 70) {
      achievements.push('🎯 Sharp Shooter');
    }

    if (performance.accuracy >= 90) {
      achievements.push('🎯 Perfect Aim');
    }

    // Speed achievements
    if (performance.averageTimePerQuestion <= 30) {
      achievements.push('⚡ Speed Demon');
    }

    // Category mastery
    if (performance.bestCategory) {
      achievements.push(`🏅 ${performance.bestCategory} Master`);
    }

    return achievements;
  } catch (error) {
    logger.error('Error getting achievements:', error);
    return [];
  }
};

/**
 * Get leaderboard data (for future multiplayer)
 */
export const getLeaderboardData = async (): Promise<Array<{ userId: string; score: number; games: number }>> => {
  try {
    // This would typically fetch from Firebase in a real app
    // For now, return mock data
    return [
      { userId: 'Player 1', score: 850, games: 15 },
      { userId: 'Player 2', score: 720, games: 12 },
      { userId: 'Player 3', score: 680, games: 10 },
      { userId: 'Player 4', score: 590, games: 8 },
      { userId: 'Player 5', score: 520, games: 7 }
    ];
  } catch (error) {
    logger.error('Error getting leaderboard data:', error);
    return [];
  }
};

/**
 * Export game statistics
 */
export const exportGameStats = async (userId: string): Promise<string> => {
  try {
    const performance = await getGamePerformance(userId);
    const categoryStats = await getCategoryStats(userId);
    const achievements = await getAchievements(userId);

    const exportData = {
      userId,
      performance,
      categoryStats,
      achievements,
      exportDate: new Date().toISOString()
    };

    return JSON.stringify(exportData, null, 2);
  } catch (error) {
    logger.error('Error exporting game stats:', error);
    return '';
  }
};
