/**
 * Mission Service
 * Handles mission progress tracking, updates, and rewards
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import { logger } from '../utils/logger';
import { COLLECTIONS } from '../utils/constants';
import { CoinService } from './CoinService';
import {
  MissionProgress,
  UserMissions,
  GameEventData,
  MissionUpdateResult,
  MissionBatchResult,
  MissionDefinition,
} from '../../shared/types/missions';
import { MISSION_DEFINITIONS, getMissionById } from './missionDefinitions';

const STORAGE_KEY = 'user_missions';

/**
 * Mission Service Class
 * Singleton pattern for consistent mission tracking
 */
class MissionService {
  private static instance: MissionService;
  private cachedMissions: { [userId: string]: UserMissions } = {};
  
  // Track answer streaks per user (in-memory for current session)
  private answerStreaks: { [userId: string]: { count: number; lastGameId: string } } = {};
  
  // Track consecutive #1 finishes for leaderboard champion mission
  private leaderboardStreaks: { [userId: string]: number } = {};

  private constructor() {}

  static getInstance(): MissionService {
    if (!MissionService.instance) {
      MissionService.instance = new MissionService();
    }
    return MissionService.instance;
  }

  /**
   * Get user's mission progress
   */
  async getUserMissions(userId: string): Promise<UserMissions> {
    try {
      // Check cache first
      if (this.cachedMissions[userId]) {
        return this.cachedMissions[userId];
      }

      // Try Firestore first
      const docRef = doc(db, COLLECTIONS.USER_PROFILES, userId, 'missions', 'progress');
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const missions: UserMissions = {
          userId,
          missions: data.missions || {},
          totalCoinsEarned: data.totalCoinsEarned || 0,
          categoriesPlayed: Array.isArray(data.categoriesPlayed) ? data.categoriesPlayed : [],
          localCategoriesPlayed: Array.isArray(data.localCategoriesPlayed) ? data.localCategoriesPlayed : [],
          multiplayerCategoriesPlayed: Array.isArray(data.multiplayerCategoriesPlayed) ? data.multiplayerCategoriesPlayed : [],
          lastUpdated: data.lastUpdated instanceof Timestamp 
            ? data.lastUpdated.toDate() 
            : new Date(data.lastUpdated || Date.now()),
        };
        this.cachedMissions[userId] = missions;
        return missions;
      }

      // Fallback to local storage
      const localData = await AsyncStorage.getItem(`${STORAGE_KEY}_${userId}`);
      if (localData) {
        const parsed = JSON.parse(localData);
        this.cachedMissions[userId] = parsed;
        return parsed;
      }

      // Initialize new user missions
      const newMissions: UserMissions = {
        userId,
        missions: {},
        totalCoinsEarned: 0,
        lastUpdated: new Date(),
      };
      this.cachedMissions[userId] = newMissions;
      return newMissions;
    } catch (error) {
      logger.error('Error getting user missions:', error);
      return {
        userId,
        missions: {},
        totalCoinsEarned: 0,
        lastUpdated: new Date(),
      };
    }
  }

  /**
   * Save user missions to storage
   */
  private async saveUserMissions(userMissions: UserMissions): Promise<void> {
    try {
      const { userId } = userMissions;
      userMissions.lastUpdated = new Date();
      
      // Update cache
      this.cachedMissions[userId] = userMissions;

      // Save to Firestore
      const docRef = doc(db, COLLECTIONS.USER_PROFILES, userId, 'missions', 'progress');
      await setDoc(docRef, {
        missions: userMissions.missions,
        totalCoinsEarned: userMissions.totalCoinsEarned,
        categoriesPlayed: userMissions.categoriesPlayed || [],
        localCategoriesPlayed: userMissions.localCategoriesPlayed || [],
        multiplayerCategoriesPlayed: userMissions.multiplayerCategoriesPlayed || [],
        lastUpdated: serverTimestamp(),
      }, { merge: true });

      // Also save locally as backup
      await AsyncStorage.setItem(
        `${STORAGE_KEY}_${userId}`,
        JSON.stringify(userMissions)
      );
    } catch (error) {
      logger.error('Error saving user missions:', error);
      // Still save locally even if Firestore fails
      try {
        await AsyncStorage.setItem(
          `${STORAGE_KEY}_${userMissions.userId}`,
          JSON.stringify(userMissions)
        );
      } catch (localError) {
        logger.error('Error saving missions locally:', localError);
      }
    }
  }

  /**
   * Get or initialize mission progress
   */
  private getOrCreateProgress(
    userMissions: UserMissions,
    missionId: string
  ): MissionProgress {
    if (!userMissions.missions[missionId]) {
      userMissions.missions[missionId] = {
        missionId,
        currentValue: 0,
        isCompleted: false,
        completionCount: 0,
        lastUpdated: new Date(),
      };
    }
    return userMissions.missions[missionId];
  }

  /**
   * Update a single mission's progress
   */
  private updateMissionProgress(
    userMissions: UserMissions,
    missionId: string,
    newValue: number,
    incrementBy?: number
  ): MissionUpdateResult {
    const mission = getMissionById(missionId);
    if (!mission) {
      logger.warn(`Mission ${missionId} not found`);
      return {
        missionId,
        previousValue: 0,
        newValue: 0,
        justCompleted: false,
        coinsEarned: 0,
      };
    }

    const progress = this.getOrCreateProgress(userMissions, missionId);
    const previousValue = progress.currentValue;
    
    // Calculate new value
    if (incrementBy !== undefined) {
      progress.currentValue += incrementBy;
    } else {
      progress.currentValue = Math.max(progress.currentValue, newValue);
    }
    
    progress.lastUpdated = new Date();

    // Check for completion
    let justCompleted = false;
    let coinsEarned = 0;

    if (progress.currentValue >= mission.targetValue) {
      if (!progress.isCompleted || mission.isRepeatable) {
        justCompleted = !progress.isCompleted || (
          mission.isRepeatable && 
          progress.currentValue >= mission.targetValue * (progress.completionCount + 1)
        );

        if (justCompleted) {
          progress.isCompleted = true;
          progress.completedAt = new Date();
          progress.completionCount++;
          progress.rewardClaimed = false; // User must open Missions and claim manually

          // Calculate reward (credited only when user claims)
          if (progress.completionCount === 1) {
            coinsEarned = mission.rewardCoins;
          } else if (mission.isRepeatable && mission.repeatRewardMultiplier) {
            coinsEarned = Math.floor(mission.rewardCoins * mission.repeatRewardMultiplier);
          }

          logger.log(`🎉 Mission completed: ${mission.name} (+${coinsEarned} coins – claim in Missions)`);
        }
      }
    }

    return {
      missionId,
      previousValue,
      newValue: progress.currentValue,
      justCompleted,
      coinsEarned,
    };
  }

  /**
   * Process a game event and update all relevant missions
   */
  async processGameEvent(event: GameEventData): Promise<MissionBatchResult> {
    const updates: MissionUpdateResult[] = [];
    let totalCoinsEarned = 0;
    const newlyCompletedMissions: string[] = [];

    try {
      const userMissions = await this.getUserMissions(event.userId);

      // Process answer event
      if (event.answer) {
        const answerUpdates = this.processAnswerEvent(userMissions, event);
        updates.push(...answerUpdates);
      }

      // Process game completion
      if (event.gameCompleted) {
        const completionUpdates = this.processGameCompletion(userMissions, event);
        updates.push(...completionUpdates);
      }

      // Process leaderboard position
      if (event.leaderboardPosition) {
        const leaderboardUpdates = this.processLeaderboardEvent(userMissions, event);
        updates.push(...leaderboardUpdates);
      }

      // Calculate totals and credit coins to balance
      for (const update of updates) {
        if (update.justCompleted) {
          totalCoinsEarned += update.coinsEarned;
          newlyCompletedMissions.push(update.missionId);
        }
      }

      // Save updated missions (rewards are claimed manually in Missions screen)
      await this.saveUserMissions(userMissions);

      return {
        updates,
        totalCoinsEarned,
        newlyCompletedMissions,
      };
    } catch (error) {
      logger.error('Error processing game event:', error);
      return {
        updates: [],
        totalCoinsEarned: 0,
        newlyCompletedMissions: [],
      };
    }
  }

  /**
   * Process answer-related missions
   */
  private processAnswerEvent(
    userMissions: UserMissions,
    event: GameEventData
  ): MissionUpdateResult[] {
    const updates: MissionUpdateResult[] = [];
    const { answer, userId, gameId } = event;
    
    if (!answer) return updates;

    // First correct answer mission
    if (answer.isCorrect) {
      updates.push(this.updateMissionProgress(userMissions, 'first_correct', 1));

      // Track answer streak
      if (!this.answerStreaks[userId]) {
        this.answerStreaks[userId] = { count: 0, lastGameId: '' };
      }
      
      const streak = this.answerStreaks[userId];
      if (streak.lastGameId === gameId || streak.lastGameId === '') {
        streak.count++;
        streak.lastGameId = gameId;
      } else {
        // New game, check if streak continues or resets
        streak.count++;
        streak.lastGameId = gameId;
      }

      // Update streak missions
      if (streak.count >= 3) {
        updates.push(this.updateMissionProgress(userMissions, 'answer_streak_3', streak.count));
      }
      if (streak.count >= 5) {
        updates.push(this.updateMissionProgress(userMissions, 'answer_streak_5', streak.count));
      }
      if (streak.count >= 10) {
        updates.push(this.updateMissionProgress(userMissions, 'answer_streak_10', streak.count));
      }

      // First Blood - #1 ranked answer
      if (answer.rank === 1) {
        updates.push(this.updateMissionProgress(userMissions, 'find_top_answer', 1));
      }

      // Speedster - fast answer
      if (answer.timeTaken && answer.timeTaken <= 5000) {
        updates.push(this.updateMissionProgress(userMissions, 'speedster', 1));
      }
    } else {
      // Wrong answer breaks streak
      if (this.answerStreaks[userId]) {
        this.answerStreaks[userId].count = 0;
      }
    }

    return updates;
  }

  /**
   * Process game completion missions
   */
  private processGameCompletion(
    userMissions: UserMissions,
    event: GameEventData
  ): MissionUpdateResult[] {
    const updates: MissionUpdateResult[] = [];
    const { gameCompleted, userId, isMultiplayer } = event;
    
    if (!gameCompleted) return updates;

    if (isMultiplayer) {
      updates.push(this.updateMissionProgress(userMissions, 'play_5_multiplayer_games', 0, 1));
      updates.push(this.updateMissionProgress(userMissions, 'multiplayer_veteran_25', 0, 1));
      updates.push(this.updateMissionProgress(userMissions, 'multiplayer_master_100', 0, 1));
    } else {
      updates.push(this.updateMissionProgress(userMissions, 'play_5_local_games', 0, 1));
      updates.push(this.updateMissionProgress(userMissions, 'local_veteran_25', 0, 1));
      updates.push(this.updateMissionProgress(userMissions, 'local_master_100', 0, 1));
    }

    // Score missions (cumulative across both modes — gameplay skill, not mode-specific)
    const currentScore = (userMissions.missions['score_500']?.currentValue || 0) + gameCompleted.totalScore;
    updates.push(this.updateMissionProgress(userMissions, 'score_500', currentScore));
    updates.push(this.updateMissionProgress(userMissions, 'score_1000', currentScore));
    updates.push(this.updateMissionProgress(userMissions, 'score_5000', currentScore));

    // Perfect game - all 10 answers
    if (gameCompleted.correctAnswers >= 10) {
      updates.push(this.updateMissionProgress(userMissions, 'perfect_game', gameCompleted.correctAnswers));
    }

    // Accuracy missions
    if (gameCompleted.accuracy >= 70) {
      updates.push(this.updateMissionProgress(userMissions, 'accuracy_70', gameCompleted.accuracy));
    }
    if (gameCompleted.accuracy >= 100 && gameCompleted.correctAnswers >= 5) {
      updates.push(this.updateMissionProgress(userMissions, 'accuracy_perfect', gameCompleted.accuracy));
    }

    // Category exploration — separate lists per mode
    const categoryListKey = isMultiplayer ? 'multiplayerCategoriesPlayed' : 'localCategoriesPlayed';
    if (!userMissions[categoryListKey]) {
      userMissions[categoryListKey] = [];
    }
    if (!userMissions[categoryListKey]!.includes(gameCompleted.category)) {
      userMissions[categoryListKey]!.push(gameCompleted.category);
    }
    const categoriesCount = userMissions[categoryListKey]!.length;

    if (isMultiplayer) {
      updates.push(this.updateMissionProgress(userMissions, 'play_3_multiplayer_categories', categoriesCount));
      updates.push(this.updateMissionProgress(userMissions, 'all_multiplayer_categories', categoriesCount));
    } else {
      updates.push(this.updateMissionProgress(userMissions, 'play_3_local_categories', categoriesCount));
      updates.push(this.updateMissionProgress(userMissions, 'all_local_categories', categoriesCount));
    }

    // Category master — track games per category per mode
    const categoryKey = `${isMultiplayer ? 'mp' : 'local'}_category_${gameCompleted.category}`;
    if (!userMissions.missions[categoryKey]) {
      userMissions.missions[categoryKey] = {
        missionId: categoryKey,
        currentValue: 0,
        isCompleted: false,
        completionCount: 0,
        lastUpdated: new Date(),
      };
    }
    userMissions.missions[categoryKey].currentValue++;

    const categoryMasterMissionId = isMultiplayer ? 'multiplayer_category_master' : 'local_category_master';
    if (userMissions.missions[categoryKey].currentValue >= 10) {
      updates.push(this.updateMissionProgress(
        userMissions,
        categoryMasterMissionId,
        userMissions.missions[categoryKey].currentValue
      ));
    }

    // Multiplayer wins
    if (isMultiplayer && gameCompleted.isWinner) {
      const currentWins = (userMissions.missions['multiplayer_win_3']?.currentValue || 0) + 1;
      updates.push(this.updateMissionProgress(userMissions, 'multiplayer_win_3', currentWins));
    }

    return updates;
  }

  /**
   * Process leaderboard position missions
   */
  private processLeaderboardEvent(
    userMissions: UserMissions,
    event: GameEventData
  ): MissionUpdateResult[] {
    const updates: MissionUpdateResult[] = [];
    const { leaderboardPosition, userId } = event;
    
    if (!leaderboardPosition) return updates;

    // Track consecutive #1 finishes
    if (!this.leaderboardStreaks[userId]) {
      this.leaderboardStreaks[userId] = 0;
    }

    if (leaderboardPosition.position === 1) {
      this.leaderboardStreaks[userId]++;
      
      // Leaderboard Champion - 5 consecutive #1 finishes
      if (this.leaderboardStreaks[userId] >= 5) {
        updates.push(this.updateMissionProgress(
          userMissions, 
          'leaderboard_champion', 
          this.leaderboardStreaks[userId]
        ));
      }
    } else {
      // Not #1, reset streak
      this.leaderboardStreaks[userId] = 0;
    }

    return updates;
  }

  /**
   * Update daily streak mission (called from daily reward service)
   */
  async updateDailyStreak(userId: string, currentStreak: number): Promise<MissionUpdateResult | null> {
    try {
      const userMissions = await this.getUserMissions(userId);
      const update = this.updateMissionProgress(userMissions, 'daily_streak_7', currentStreak);
      await this.saveUserMissions(userMissions);
      return update;
    } catch (error) {
      logger.error('Error updating daily streak mission:', error);
      return null;
    }
  }

  /**
   * Number of completed missions with unclaimed rewards (for badge)
   */
  async getUnclaimedRewardCount(userId: string): Promise<number> {
    const userMissions = await this.getUserMissions(userId);
    return Object.values(userMissions.missions).filter(
      (p) => p.isCompleted && p.rewardClaimed !== true
    ).length;
  }

  /**
   * Claim rewards for all completed, unclaimed missions. Returns total coins collected.
   */
  async claimAllMissionRewards(userId: string): Promise<{ totalCoins: number; claimedCount: number }> {
    const missionsWithProgress = await this.getMissionsWithProgress(userId);
    const claimable = missionsWithProgress.filter(
      (m) => m.progress.isCompleted && m.progress.rewardClaimed !== true
    );
    let totalCoins = 0;
    for (const m of claimable) {
      const result = await this.claimMissionReward(userId, m.id);
      if (result?.coins) totalCoins += result.coins;
    }
    return { totalCoins, claimedCount: claimable.length };
  }

  /**
   * Claim reward for a completed mission. Credits coins and marks as claimed.
   */
  async claimMissionReward(userId: string, missionId: string): Promise<{ coins: number } | null> {
    try {
      const userMissions = await this.getUserMissions(userId);
      const progress = userMissions.missions[missionId];
      const mission = getMissionById(missionId);
      if (!mission || !progress || !progress.isCompleted || progress.rewardClaimed) {
        return null;
      }
      let coins = 0;
      if (progress.completionCount === 1) {
        coins = mission.rewardCoins;
      } else if (mission.isRepeatable && mission.repeatRewardMultiplier) {
        coins = Math.floor(mission.rewardCoins * mission.repeatRewardMultiplier);
      }
      if (coins <= 0) return null;
      progress.rewardClaimed = true;
      userMissions.totalCoinsEarned += coins;
      await this.saveUserMissions(userMissions);
      await CoinService.getInstance().addCoins(userId, coins, `Mission reward: ${mission.name}`);
      logger.log('Mission reward claimed', { userId, missionId, coins });
      return { coins };
    } catch (error) {
      logger.error('Error claiming mission reward:', error);
      return null;
    }
  }

  /**
   * Get all missions with their current progress for a user
   */
  async getMissionsWithProgress(userId: string): Promise<Array<MissionDefinition & { progress: MissionProgress }>> {
    const userMissions = await this.getUserMissions(userId);
    
    return MISSION_DEFINITIONS.map(mission => ({
      ...mission,
      progress: userMissions.missions[mission.id] || {
        missionId: mission.id,
        currentValue: 0,
        isCompleted: false,
        completionCount: 0,
        lastUpdated: new Date(),
      },
    }));
  }

  /**
   * Get completed missions for a user
   */
  async getCompletedMissions(userId: string): Promise<string[]> {
    const userMissions = await this.getUserMissions(userId);
    return Object.entries(userMissions.missions)
      .filter(([_, progress]) => progress.isCompleted)
      .map(([missionId]) => missionId);
  }

  /**
   * Get mission progress percentage
   */
  getMissionProgressPercent(progress: MissionProgress, mission: MissionDefinition): number {
    return Math.min(100, Math.round((progress.currentValue / mission.targetValue) * 100));
  }

  /**
   * Reset answer streak (call when starting a new game or after wrong answer)
   */
  resetAnswerStreak(userId: string): void {
    if (this.answerStreaks[userId]) {
      this.answerStreaks[userId].count = 0;
    }
  }

  /**
   * Get current answer streak
   */
  getAnswerStreak(userId: string): number {
    return this.answerStreaks[userId]?.count || 0;
  }

  /**
   * Clear cache for a user
   */
  clearCache(userId: string): void {
    delete this.cachedMissions[userId];
    delete this.answerStreaks[userId];
    delete this.leaderboardStreaks[userId];
  }
}

// Export singleton instance
export const missionService = MissionService.getInstance();

export default missionService;
