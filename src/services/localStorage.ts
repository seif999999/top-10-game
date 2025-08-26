import AsyncStorage from '@react-native-async-storage/async-storage';

export interface GameStats {
  userId: string;
  totalGames: number;
  totalScore: number;
  averageScore: number;
  bestScore: number;
  correctAnswers: number;
  totalAnswers: number;
  favoriteCategories: string[];
  lastPlayedDate: string;
}

export interface GameHistory {
  gameId: string;
  category: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  date: string;
  timeTaken: number;
}

const STORAGE_KEYS = {
  GAME_STATS: 'game_stats',
  GAME_HISTORY: 'game_history',
  FAVORITE_CATEGORIES: 'favorite_categories',
  USER_PREFERENCES: 'user_preferences'
};

/**
 * Save game statistics for a user
 */
export const saveGameStats = async (userId: string, gameResults: any): Promise<void> => {
  try {
    const existingStats = await getPlayerStats(userId);
    const newStats: GameStats = {
      userId,
      totalGames: existingStats.totalGames + 1,
      totalScore: existingStats.totalScore + gameResults.finalScores[userId],
      averageScore: Math.round((existingStats.totalScore + gameResults.finalScores[userId]) / (existingStats.totalGames + 1)),
      bestScore: Math.max(existingStats.bestScore, gameResults.finalScores[userId]),
      correctAnswers: existingStats.correctAnswers + gameResults.roundResults.reduce((total: number, round: any) => {
        return total + (round.playerAnswers?.filter((answer: any) => answer.isCorrect)?.length || 0);
      }, 0),
      totalAnswers: existingStats.totalAnswers + gameResults.roundResults.reduce((total: number, round: any) => {
        return total + (round.playerAnswers?.length || 0);
      }, 0),
      favoriteCategories: existingStats.favoriteCategories,
      lastPlayedDate: new Date().toISOString()
    };

    const allStats = await getAllGameStats();
    allStats[userId] = newStats;
    
    await AsyncStorage.setItem(STORAGE_KEYS.GAME_STATS, JSON.stringify(allStats));
  } catch (error) {
    console.error('Error saving game stats:', error);
  }
};

/**
 * Get player statistics
 */
export const getPlayerStats = async (userId: string): Promise<GameStats> => {
  try {
    const allStats = await getAllGameStats();
    return allStats[userId] || {
      userId,
      totalGames: 0,
      totalScore: 0,
      averageScore: 0,
      bestScore: 0,
      correctAnswers: 0,
      totalAnswers: 0,
      favoriteCategories: [],
      lastPlayedDate: ''
    };
  } catch (error) {
    console.error('Error getting player stats:', error);
    return {
      userId,
      totalGames: 0,
      totalScore: 0,
      averageScore: 0,
      bestScore: 0,
      correctAnswers: 0,
      totalAnswers: 0,
      favoriteCategories: [],
      lastPlayedDate: ''
    };
  }
};

/**
 * Get all game statistics
 */
export const getAllGameStats = async (): Promise<{[userId: string]: GameStats}> => {
  try {
    const stats = await AsyncStorage.getItem(STORAGE_KEYS.GAME_STATS);
    return stats ? JSON.parse(stats) : {};
  } catch (error) {
    console.error('Error getting all game stats:', error);
    return {};
  }
};

/**
 * Save favorite categories for a user
 */
export const saveFavoriteCategories = async (userId: string, categories: string[]): Promise<void> => {
  try {
    const existingStats = await getPlayerStats(userId);
    existingStats.favoriteCategories = categories;
    
    const allStats = await getAllGameStats();
    allStats[userId] = existingStats;
    
    await AsyncStorage.setItem(STORAGE_KEYS.GAME_STATS, JSON.stringify(allStats));
  } catch (error) {
    console.error('Error saving favorite categories:', error);
  }
};

/**
 * Get cached questions for a category
 */
export const getCachedQuestions = async (category: string): Promise<any[]> => {
  try {
    const cached = await AsyncStorage.getItem(`questions_${category}`);
    return cached ? JSON.parse(cached) : [];
  } catch (error) {
    console.error('Error getting cached questions:', error);
    return [];
  }
};

/**
 * Cache questions for a category
 */
export const cacheQuestions = async (category: string, questions: any[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(`questions_${category}`, JSON.stringify(questions));
  } catch (error) {
    console.error('Error caching questions:', error);
  }
};

/**
 * Save game history
 */
export const saveGameHistory = async (userId: string, gameHistory: GameHistory): Promise<void> => {
  try {
    const existingHistory = await getGameHistory(userId);
    existingHistory.unshift(gameHistory);
    
    // Keep only last 50 games
    const limitedHistory = existingHistory.slice(0, 50);
    
    const allHistory = await getAllGameHistory();
    allHistory[userId] = limitedHistory;
    
    await AsyncStorage.setItem(STORAGE_KEYS.GAME_HISTORY, JSON.stringify(allHistory));
  } catch (error) {
    console.error('Error saving game history:', error);
  }
};

/**
 * Get game history for a user
 */
export const getGameHistory = async (userId: string): Promise<GameHistory[]> => {
  try {
    const allHistory = await getAllGameHistory();
    return allHistory[userId] || [];
  } catch (error) {
    console.error('Error getting game history:', error);
    return [];
  }
};

/**
 * Get all game history
 */
export const getAllGameHistory = async (): Promise<{[userId: string]: GameHistory[]}> => {
  try {
    const history = await AsyncStorage.getItem(STORAGE_KEYS.GAME_HISTORY);
    return history ? JSON.parse(history) : {};
  } catch (error) {
    console.error('Error getting all game history:', error);
    return {};
  }
};

/**
 * Save user preferences
 */
export const saveUserPreferences = async (userId: string, preferences: any): Promise<void> => {
  try {
    const allPreferences = await getAllUserPreferences();
    allPreferences[userId] = preferences;
    
    await AsyncStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(allPreferences));
  } catch (error) {
    console.error('Error saving user preferences:', error);
  }
};

/**
 * Get user preferences
 */
export const getUserPreferences = async (userId: string): Promise<any> => {
  try {
    const allPreferences = await getAllUserPreferences();
    return allPreferences[userId] || {
      soundEnabled: true,
      hapticEnabled: true,
      defaultTimer: 60,
      theme: 'dark'
    };
  } catch (error) {
    console.error('Error getting user preferences:', error);
    return {
      soundEnabled: true,
      hapticEnabled: true,
      defaultTimer: 60,
      theme: 'dark'
    };
  }
};

/**
 * Get all user preferences
 */
export const getAllUserPreferences = async (): Promise<{[userId: string]: any}> => {
  try {
    const preferences = await AsyncStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
    return preferences ? JSON.parse(preferences) : {};
  } catch (error) {
    console.error('Error getting all user preferences:', error);
    return {};
  }
};

/**
 * Clear all data for a user
 */
export const clearUserData = async (userId: string): Promise<void> => {
  try {
    const allStats = await getAllGameStats();
    delete allStats[userId];
    await AsyncStorage.setItem(STORAGE_KEYS.GAME_STATS, JSON.stringify(allStats));
    
    const allHistory = await getAllGameHistory();
    delete allHistory[userId];
    await AsyncStorage.setItem(STORAGE_KEYS.GAME_HISTORY, JSON.stringify(allHistory));
    
    const allPreferences = await getAllUserPreferences();
    delete allPreferences[userId];
    await AsyncStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(allPreferences));
  } catch (error) {
    console.error('Error clearing user data:', error);
  }
};

/**
 * Clear all cached data
 */
export const clearAllCachedData = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.GAME_STATS,
      STORAGE_KEYS.GAME_HISTORY,
      STORAGE_KEYS.FAVORITE_CATEGORIES,
      STORAGE_KEYS.USER_PREFERENCES
    ]);
  } catch (error) {
    console.error('Error clearing all cached data:', error);
  }
};
