/**
 * Mission System Types
 * Extensible mission/achievement system for Top 10 Game
 */

export type MissionDifficulty = 'easy' | 'medium' | 'hard' | 'legendary';

export type MissionCategory = 
  | 'streak'        // Answer streaks, win streaks
  | 'score'         // Score-based achievements  
  | 'games'         // Game count achievements
  | 'accuracy'      // Accuracy-based achievements
  | 'speed'         // Time-based achievements
  | 'multiplayer'   // Multiplayer-specific achievements
  | 'exploration'   // Category exploration
  | 'daily'         // Daily activity achievements
  | 'special';      // Special/unique achievements

export interface MissionDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: MissionCategory;
  difficulty: MissionDifficulty;
  targetValue: number;           // Target to reach (e.g., 3 for "3 correct answers in a row")
  rewardCoins: number;           // Coins rewarded on completion
  isRepeatable: boolean;         // Can be completed multiple times
  repeatRewardMultiplier?: number; // Multiplier for repeat completions (e.g., 0.5 = 50% of original reward)
}

export interface MissionProgress {
  missionId: string;
  currentValue: number;          // Current progress value
  isCompleted: boolean;
  completedAt?: Date;
  completionCount: number;       // How many times completed (for repeatable missions)
  lastUpdated: Date;
  // Streak-specific tracking
  streakCount?: number;          // Current streak count
  lastStreakGameId?: string;     // Last game that contributed to streak
}

export interface UserMissions {
  userId: string;
  missions: { [missionId: string]: MissionProgress };
  totalCoinsEarned: number;
  lastUpdated: Date;
}

/**
 * Game event data for mission tracking
 * Passed to the mission service after game actions
 */
export interface GameEventData {
  userId: string;
  gameId: string;
  isMultiplayer: boolean;
  
  // Answer event data
  answer?: {
    isCorrect: boolean;
    rank?: number;           // 1-10 ranking of the answer
    points?: number;
    timeTaken?: number;      // Time in ms to submit answer
  };
  
  // Game completion data
  gameCompleted?: {
    category: string;
    totalScore: number;
    correctAnswers: number;
    totalAnswers: number;    // Usually 10
    accuracy: number;        // 0-100
    isWinner: boolean;       // For multiplayer
    finalRank?: number;      // Final position on leaderboard (1 = first place)
    playerCount?: number;    // For multiplayer
  };
  
  // Leaderboard event
  leaderboardPosition?: {
    position: number;        // 1 = first place
    previousPosition?: number;
    isNewTop1: boolean;
  };
  
  // Streak tracking
  answerStreak?: {
    currentStreak: number;
    isStreakBroken: boolean;
  };
}

/**
 * Mission update result
 */
export interface MissionUpdateResult {
  missionId: string;
  previousValue: number;
  newValue: number;
  justCompleted: boolean;    // True if this update completed the mission
  coinsEarned: number;
}

/**
 * Batch mission update result
 */
export interface MissionBatchResult {
  updates: MissionUpdateResult[];
  totalCoinsEarned: number;
  newlyCompletedMissions: string[];
}
