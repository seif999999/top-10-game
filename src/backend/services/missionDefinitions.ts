/**
 * Mission Definitions
 * All available missions in the game, ordered by difficulty
 */

import { MissionDefinition } from '../../shared/types/missions';

/**
 * All mission definitions
 * Missions are designed to be progressively harder
 */
export const MISSION_DEFINITIONS: MissionDefinition[] = [
  // ============================================
  // EASY MISSIONS (Introductory)
  // ============================================
  {
    id: 'first_correct',
    name: 'First Steps',
    description: 'Get your first correct answer',
    icon: '🎯',
    category: 'score',
    difficulty: 'easy',
    targetValue: 1,
    rewardCoins: 5,
    isRepeatable: false,
  },
  {
    id: 'play_5_games',
    name: 'Getting Started',
    description: 'Play 5 games',
    icon: '🎮',
    category: 'games',
    difficulty: 'easy',
    targetValue: 5,
    rewardCoins: 10,
    isRepeatable: false,
  },
  {
    id: 'find_top_answer',
    name: 'First Blood',
    description: 'Find a #1 ranked answer',
    icon: '🥇',
    category: 'score',
    difficulty: 'easy',
    targetValue: 1,
    rewardCoins: 15,
    isRepeatable: false,
  },

  // ============================================
  // MEDIUM MISSIONS (Core gameplay)
  // ============================================
  {
    id: 'answer_streak_3',
    name: 'Hot Streak',
    description: 'Get 3 correct answers in a row',
    icon: '🔥',
    category: 'streak',
    difficulty: 'medium',
    targetValue: 3,
    rewardCoins: 25,
    isRepeatable: true,
    repeatRewardMultiplier: 0.5,
  },
  {
    id: 'score_500',
    name: 'Point Collector',
    description: 'Earn a cumulative score of 500 points',
    icon: '💯',
    category: 'score',
    difficulty: 'medium',
    targetValue: 500,
    rewardCoins: 30,
    isRepeatable: false,
  },
  {
    id: 'accuracy_70',
    name: 'Sharp Shooter',
    description: 'Achieve 70% accuracy in a single game',
    icon: '🎯',
    category: 'accuracy',
    difficulty: 'medium',
    targetValue: 70,
    rewardCoins: 25,
    isRepeatable: true,
    repeatRewardMultiplier: 0.3,
  },
  {
    id: 'speedster',
    name: 'Speedster',
    description: 'Submit a correct answer within 5 seconds',
    icon: '⚡',
    category: 'speed',
    difficulty: 'medium',
    targetValue: 5000, // 5000ms = 5 seconds
    rewardCoins: 20,
    isRepeatable: true,
    repeatRewardMultiplier: 0.25,
  },
  {
    id: 'play_3_categories',
    name: 'Explorer',
    description: 'Play games in 3 different categories',
    icon: '🗺️',
    category: 'exploration',
    difficulty: 'medium',
    targetValue: 3,
    rewardCoins: 25,
    isRepeatable: false,
  },

  // ============================================
  // HARD MISSIONS (Challenge)
  // ============================================
  {
    id: 'answer_streak_5',
    name: 'On Fire!',
    description: 'Get 5 correct answers in a row',
    icon: '🔥🔥',
    category: 'streak',
    difficulty: 'hard',
    targetValue: 5,
    rewardCoins: 50,
    isRepeatable: true,
    repeatRewardMultiplier: 0.4,
  },
  {
    id: 'perfect_game',
    name: 'Perfect Game',
    description: 'Find all 10 answers in a single game',
    icon: '⭐',
    category: 'score',
    difficulty: 'hard',
    targetValue: 10,
    rewardCoins: 75,
    isRepeatable: true,
    repeatRewardMultiplier: 0.5,
  },
  {
    id: 'score_1000',
    name: 'Score Master',
    description: 'Earn a cumulative score of 1,000 points',
    icon: '🏆',
    category: 'score',
    difficulty: 'hard',
    targetValue: 1000,
    rewardCoins: 50,
    isRepeatable: false,
  },
  {
    id: 'game_veteran_25',
    name: 'Game Veteran',
    description: 'Play 25 games',
    icon: '🎖️',
    category: 'games',
    difficulty: 'hard',
    targetValue: 25,
    rewardCoins: 60,
    isRepeatable: false,
  },
  {
    id: 'category_master',
    name: 'Category Master',
    description: 'Play 10 games in a single category',
    icon: '📚',
    category: 'exploration',
    difficulty: 'hard',
    targetValue: 10,
    rewardCoins: 50,
    isRepeatable: true,
    repeatRewardMultiplier: 0.3,
  },
  {
    id: 'multiplayer_win_3',
    name: 'Social Butterfly',
    description: 'Win 3 multiplayer games',
    icon: '👥',
    category: 'multiplayer',
    difficulty: 'hard',
    targetValue: 3,
    rewardCoins: 60,
    isRepeatable: true,
    repeatRewardMultiplier: 0.4,
  },
  {
    id: 'daily_streak_7',
    name: 'Daily Devotee',
    description: 'Claim daily rewards for 7 consecutive days',
    icon: '📅',
    category: 'daily',
    difficulty: 'hard',
    targetValue: 7,
    rewardCoins: 70,
    isRepeatable: true,
    repeatRewardMultiplier: 0.5,
  },

  // ============================================
  // LEGENDARY MISSIONS (Elite)
  // ============================================
  {
    id: 'leaderboard_champion',
    name: 'Leaderboard Champion',
    description: 'Become #1 on the leaderboard 5 consecutive times',
    icon: '👑',
    category: 'multiplayer',
    difficulty: 'legendary',
    targetValue: 5,
    rewardCoins: 150,
    isRepeatable: true,
    repeatRewardMultiplier: 0.5,
  },
  {
    id: 'answer_streak_10',
    name: 'Unstoppable',
    description: 'Get 10 correct answers in a row',
    icon: '💎',
    category: 'streak',
    difficulty: 'legendary',
    targetValue: 10,
    rewardCoins: 100,
    isRepeatable: true,
    repeatRewardMultiplier: 0.4,
  },
  {
    id: 'accuracy_perfect',
    name: 'Perfection',
    description: 'Achieve 100% accuracy in a game with 5+ answers',
    icon: '🌟',
    category: 'accuracy',
    difficulty: 'legendary',
    targetValue: 100,
    rewardCoins: 100,
    isRepeatable: true,
    repeatRewardMultiplier: 0.3,
  },
  {
    id: 'score_5000',
    name: 'Legend',
    description: 'Earn a cumulative score of 5,000 points',
    icon: '🏅',
    category: 'score',
    difficulty: 'legendary',
    targetValue: 5000,
    rewardCoins: 200,
    isRepeatable: false,
  },
  {
    id: 'game_master_100',
    name: 'Game Master',
    description: 'Play 100 games',
    icon: '🎓',
    category: 'games',
    difficulty: 'legendary',
    targetValue: 100,
    rewardCoins: 250,
    isRepeatable: false,
  },
  {
    id: 'all_categories',
    name: 'Omniscient',
    description: 'Play at least one game in every category',
    icon: '🌍',
    category: 'exploration',
    difficulty: 'legendary',
    targetValue: 9, // Number of main categories (excluding Custom)
    rewardCoins: 150,
    isRepeatable: false,
  },
];

/**
 * Get mission definition by ID
 */
export const getMissionById = (missionId: string): MissionDefinition | undefined => {
  return MISSION_DEFINITIONS.find(m => m.id === missionId);
};

/**
 * Get missions by category
 */
export const getMissionsByCategory = (category: MissionDefinition['category']): MissionDefinition[] => {
  return MISSION_DEFINITIONS.filter(m => m.category === category);
};

/**
 * Get missions by difficulty
 */
export const getMissionsByDifficulty = (difficulty: MissionDefinition['difficulty']): MissionDefinition[] => {
  return MISSION_DEFINITIONS.filter(m => m.difficulty === difficulty);
};

/**
 * Get all mission IDs
 */
export const getAllMissionIds = (): string[] => {
  return MISSION_DEFINITIONS.map(m => m.id);
};

export default MISSION_DEFINITIONS;
