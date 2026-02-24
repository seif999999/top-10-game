/**
 * Daily game cap: first 8 games per day get full reward, games 9+ get reduced reward (5 coins).
 * Count resets at midnight (local date). Applies to both single-player and multiplayer combined.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../utils/logger';

const STORAGE_KEY = 'daily_game_cap';
const MAX_FULL_REWARD_GAMES = 8;
const REDUCED_REWARD = 5;

interface StoredData {
  date: string; // YYYY-MM-DD (local date)
  gamesPlayed: number;
}

function getTodayDateString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Get number of games played today (single + multiplayer combined).
 */
export async function getDailyGameCount(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw == null) return 0;
    const data: StoredData = JSON.parse(raw);
    const today = getTodayDateString();
    if (data.date !== today) return 0;
    const count = typeof data.gamesPlayed === 'number' && data.gamesPlayed >= 0
      ? data.gamesPlayed
      : 0;
    return count;
  } catch (e) {
    logger.warn('dailyGameCap: getDailyGameCount failed', e);
    return 0;
  }
}

/**
 * Increment daily game count. Call after awarding coins for a completed game.
 * Returns the new count for today.
 */
export async function incrementDailyGameCount(): Promise<number> {
  try {
    const today = getTodayDateString();
    const count = await getDailyGameCount();
    const newCount = count + 1;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
      date: today,
      gamesPlayed: newCount,
    } as StoredData));
    logger.log('dailyGameCap: games played today', { count: newCount });
    return newCount;
  } catch (e) {
    logger.warn('dailyGameCap: incrementDailyGameCount failed', e);
    return 0;
  }
}

/**
 * Get coin reward for a game. First 8 games today get fullReward, games 9+ get REDUCED_REWARD (5).
 * @param fullReward - Amount to award if under cap (e.g. 20 for single-player, or placement reward for multiplayer)
 */
export async function getGameReward(fullReward: number): Promise<number> {
  try {
    const count = await getDailyGameCount();
    const reward = count < MAX_FULL_REWARD_GAMES ? fullReward : REDUCED_REWARD;
    logger.log('dailyGameCap: getGameReward', { gamesPlayedToday: count, fullReward, reward, capped: count >= MAX_FULL_REWARD_GAMES });
    return reward;
  } catch (e) {
    logger.warn('dailyGameCap: getGameReward failed, using full reward', e);
    return fullReward;
  }
}
