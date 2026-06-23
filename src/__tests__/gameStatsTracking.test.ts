import {
  saveGameStats,
  getPlayerStats,
  savePlayerStats,
  saveGameHistory,
  getGameHistory,
  GameStats,
} from '../backend/services/localStorage';
import { updateGameStats } from '../backend/services/statsService';
import { missionService } from '../backend/services/missionService';

jest.mock('../backend/services/localStorage', () => ({
  saveGameStats: jest.fn().mockResolvedValue(undefined),
  getPlayerStats: jest.fn(),
  savePlayerStats: jest.fn().mockResolvedValue(undefined),
  saveGameHistory: jest.fn().mockResolvedValue(undefined),
  getGameHistory: jest.fn().mockResolvedValue([]),
}));

jest.mock('../backend/services/missionService', () => ({
  missionService: {
    processGameEvent: jest.fn().mockResolvedValue({
      updates: [],
      totalCoinsEarned: 0,
      newlyCompletedMissions: [],
    }),
  },
}));

const baseStats = (overrides: Partial<GameStats> = {}): GameStats => ({
  userId: 'user-1',
  totalGames: 0,
  totalScore: 0,
  averageScore: 0,
  bestScore: 0,
  correctAnswers: 0,
  totalAnswers: 0,
  favoriteCategories: [],
  lastPlayedDate: '',
  wins: 0,
  losses: 0,
  multiplayerWins: 0,
  multiplayerLosses: 0,
  localGamesHosted: 0,
  multiplayerGames: 0,
  fastestAnswerTime: null,
  longestCorrectStreak: 0,
  currentCorrectStreak: 0,
  recordedCompletionKeys: [],
  ...overrides,
});

describe('game stats tracking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('records one local game per completion key', async () => {
    const afterSave = baseStats({ totalGames: 1, totalScore: 42 });
    (getPlayerStats as jest.Mock)
      .mockResolvedValueOnce(baseStats())
      .mockResolvedValueOnce(afterSave);

    await updateGameStats('user-1', 42, 'Sports', 8, 10, 120, false, false, undefined, undefined, 'sp-game-1');
    await updateGameStats('user-1', 42, 'Sports', 8, 10, 120, false, false, undefined, undefined, 'sp-game-1');

    expect(saveGameStats).toHaveBeenCalledTimes(1);
    expect(saveGameHistory).toHaveBeenCalledTimes(1);
    expect(missionService.processGameEvent).toHaveBeenCalledTimes(1);
    expect(savePlayerStats).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({
        localGamesHosted: 1,
        recordedCompletionKeys: ['sp-game-1'],
      })
    );
  });

  it('records one multiplayer game per completion key', async () => {
    const afterSave = baseStats({ totalGames: 1, totalScore: 30 });
    (getPlayerStats as jest.Mock)
      .mockResolvedValueOnce(baseStats())
      .mockResolvedValueOnce(afterSave);

    await updateGameStats('user-1', 30, 'Movies', 10, 10, 0, true, true, 1, 4, 'mp-room-abc');

    expect(savePlayerStats).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({
        multiplayerGames: 1,
        multiplayerWins: 1,
        wins: 1,
        recordedCompletionKeys: ['mp-room-abc'],
      })
    );
  });
});
