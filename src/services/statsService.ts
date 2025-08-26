import { saveGameStats, getPlayerStats, saveGameHistory, getGameHistory, GameStats, GameHistory } from './localStorage';

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
}

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
  timeTaken: number
): Promise<void> => {
  try {
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
      gameId: `game_${Date.now()}`,
      category,
      score,
      correctAnswers,
      totalQuestions,
      date: new Date().toISOString(),
      timeTaken
    };

    await saveGameHistory(userId, gameHistory);
  } catch (error) {
    console.error('Error updating game stats:', error);
  }
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
    console.error('Error getting total games played:', error);
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

    return {
      totalGames: stats.totalGames,
      totalScore: stats.totalScore,
      averageScore: stats.averageScore,
      bestScore: stats.bestScore,
      accuracy: Math.round(accuracy * 100) / 100,
      totalTime,
      averageTimePerQuestion: Math.round(averageTimePerQuestion),
      bestCategory,
      mostPlayedCategory,
      recentPerformance
    };
  } catch (error) {
    console.error('Error getting game performance:', error);
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
      recentPerformance: 'stable'
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
    console.error('Error getting category stats:', error);
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
    console.error('Error getting achievements:', error);
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
    console.error('Error getting leaderboard data:', error);
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
    console.error('Error exporting game stats:', error);
    return '';
  }
};
