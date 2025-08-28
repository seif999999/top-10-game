/**
 * Game utility functions for common operations
 */

/**
 * Normalize answer text for comparison
 */
export const normalizeAnswer = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' '); // Normalize whitespace
};

/**
 * Calculate similarity between two strings using Levenshtein distance
 */
export const fuzzyMatch = (str1: string, str2: string): number => {
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
 * Format time in seconds to MM:SS format
 */
export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Format time in seconds to human readable format
 */
export const formatTimeReadable = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds}s`;
  } else if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  }
};

/**
 * Generate a shareable game summary
 */
export const generateGameSummary = (gameResults: any): string => {
  const { category, finalScores, winner, totalTime, averageScore } = gameResults;
  
  const playerScores = Object.entries(finalScores)
    .map(([player, score]) => `${player}: ${score}pts`)
    .join(', ');
  
  return `🎮 Top 10 Game - ${category}\n` +
         `🏆 Winner: ${winner}\n` +
         `📊 Scores: ${playerScores}\n` +
         `⏱️ Total Time: ${formatTimeReadable(totalTime)}\n` +
         `📈 Average Score: ${Math.round(averageScore)}pts\n` +
         `🎯 Play Top 10 Game!`;
};

/**
 * Shuffle array using Fisher-Yates algorithm
 */
export const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * Get random element from array
 */
export const getRandomElement = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

/**
 * Calculate percentage
 */
export const calculatePercentage = (value: number, total: number): number => {
  return total > 0 ? (value / total) * 100 : 0;
};

/**
 * Format score with commas
 */
export const formatScore = (score: number): string => {
  return score.toLocaleString();
};

/**
 * Get rank suffix (1st, 2nd, 3rd, etc.)
 */
export const getRankSuffix = (rank: number): string => {
  if (rank >= 11 && rank <= 13) return 'th';
  
  switch (rank % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
};

/**
 * Format rank with suffix
 */
export const formatRank = (rank: number): string => {
  return `${rank}${getRankSuffix(rank)}`;
};

/**
 * Get difficulty color
 */
export const getDifficultyColor = (difficulty: 'easy' | 'medium' | 'hard'): string => {
  switch (difficulty) {
    case 'easy': return '#10B981'; // green
    case 'medium': return '#F59E0B'; // yellow
    case 'hard': return '#EF4444'; // red
    default: return '#6B7280'; // gray
  }
};

/**
 * Get difficulty label
 */
export const getDifficultyLabel = (difficulty: 'easy' | 'medium' | 'hard'): string => {
  switch (difficulty) {
    case 'easy': return 'Easy';
    case 'medium': return 'Medium';
    case 'hard': return 'Hard';
    default: return 'Unknown';
  }
};

/**
 * Calculate average from array of numbers
 */
export const calculateAverage = (numbers: number[]): number => {
  if (numbers.length === 0) return 0;
  return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
};

/**
 * Get maximum value from array
 */
export const getMaxValue = (numbers: number[]): number => {
  return Math.max(...numbers);
};

/**
 * Get minimum value from array
 */
export const getMinValue = (numbers: number[]): number => {
  return Math.min(...numbers);
};

/**
 * Debounce function
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Throttle function
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Generate random ID
 */
export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

/**
 * Capitalize first letter
 */
export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

/**
 * Check if string is empty or whitespace
 */
export const isEmpty = (str: string): boolean => {
  return !str || str.trim().length === 0;
};

/**
 * Remove duplicates from array
 */
export const removeDuplicates = <T>(array: T[]): T[] => {
  return [...new Set(array)];
};

/**
 * Sort array by property
 */
export const sortByProperty = <T, K extends keyof T>(
  array: T[],
  property: K,
  ascending: boolean = true
): T[] => {
  return [...array].sort((a, b) => {
    if (a[property] < b[property]) return ascending ? -1 : 1;
    if (a[property] > b[property]) return ascending ? 1 : -1;
    return 0;
  });
};

/**
 * Get player ranking from scores
 */
export const getPlayerRanking = (scores: { [playerId: string]: number }): Array<{ playerId: string; score: number; rank: number }> => {
  const players = Object.entries(scores).map(([playerId, score]) => ({ playerId, score }));
  players.sort((a, b) => b.score - a.score); // Sort by score descending
  
  return players.map((player, index) => ({
    ...player,
    rank: index + 1
  }));
};
