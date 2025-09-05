// Centralized scoring system for single-player and multiplayer consistency
// This ensures the same point calculation is used everywhere

/**
 * Calculate points for a given rank (1-10)
 * Rank 1 = 100 points, Rank 10 = 10 points
 * This is the canonical scoring function used across single-player and multiplayer
 */
export function pointsForRank(rank: number): number {
  if (rank < 1 || rank > 10) {
    console.warn(`Invalid rank ${rank}, using fallback calculation`);
    return Math.max(10, (11 - Math.max(1, Math.min(10, rank))) * 10);
  }
  return Math.max(10, (11 - rank) * 10);
}

/**
 * Calculate points for an answer based on its position in the answers array
 * @param answerIndex 0-based index in the answers array
 * @returns points for this answer
 */
export function pointsForAnswerIndex(answerIndex: number): number {
  const rank = answerIndex + 1; // Convert 0-based index to 1-based rank
  return pointsForRank(rank);
}

/**
 * Calculate total points for multiple correct answers
 * @param correctAnswers Array of correct answer indices
 * @returns total points
 */
export function calculateTotalPoints(correctAnswers: number[]): number {
  return correctAnswers.reduce((total, answerIndex) => {
    return total + pointsForAnswerIndex(answerIndex);
  }, 0);
}

/**
 * Get the rank for a given point value (inverse of pointsForRank)
 * @param points Point value
 * @returns rank (1-10) or null if invalid
 */
export function rankFromPoints(points: number): number | null {
  if (points < 10 || points > 100) return null;
  const rank = 11 - (points / 10);
  return Math.round(rank);
}

/**
 * Validate that a scoring calculation is correct
 * @param rank The rank (1-10)
 * @param expectedPoints The expected points
 * @returns true if the calculation is correct
 */
export function validateScoring(rank: number, expectedPoints: number): boolean {
  const calculatedPoints = pointsForRank(rank);
  return calculatedPoints === expectedPoints;
}

/**
 * Get scoring information for display
 * @param rank The rank (1-10)
 * @returns Object with rank, points, and display info
 */
export function getScoringInfo(rank: number): {
  rank: number;
  points: number;
  displayText: string;
} {
  const points = pointsForRank(rank);
  return {
    rank,
    points,
    displayText: `#${rank} = ${points} points`
  };
}

// Log scoring system initialization
console.log('🎯 Scoring system initialized with pointsForRank function');
console.log('🎯 Sample calculations:', {
  rank1: pointsForRank(1),    // 100
  rank5: pointsForRank(5),    // 60
  rank10: pointsForRank(10)   // 10
});
