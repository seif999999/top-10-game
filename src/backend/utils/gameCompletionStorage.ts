/**
 * Tracks single-player game completions for interstitial ad frequency.
 * Keys: game_completion_count.
 * Used by GameScreen to show interstitial every 3 completed games.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const GAME_COMPLETION_COUNT_KEY = 'game_completion_count';

export async function getGameCompletionCount(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(GAME_COMPLETION_COUNT_KEY);
    if (raw == null) return 0;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  } catch {
    return 0;
  }
}

export async function incrementGameCompletionCount(): Promise<number> {
  const count = await getGameCompletionCount();
  const next = count + 1;
  try {
    await AsyncStorage.setItem(GAME_COMPLETION_COUNT_KEY, String(next));
  } catch {
    // non-fatal
  }
  return next;
}
