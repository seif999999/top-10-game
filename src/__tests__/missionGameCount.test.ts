import { missionService } from '../backend/services/missionService';
import type { UserMissions } from '../shared/types/missions';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

jest.mock('../backend/services/firebase', () => ({ db: {} }));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn().mockResolvedValue({ exists: () => false }),
  setDoc: jest.fn().mockResolvedValue(undefined),
  updateDoc: jest.fn(),
  serverTimestamp: jest.fn(),
  Timestamp: class {},
}));

jest.mock('../backend/services/CoinService', () => ({
  CoinService: {
    getInstance: () => ({
      addCoins: jest.fn(),
    }),
  },
}));

function createUserMissions(): UserMissions {
  return {
    userId: 'user-1',
    missions: {},
    totalCoinsEarned: 0,
    lastUpdated: new Date(),
    localCategoriesPlayed: ['Sports'],
    multiplayerCategoriesPlayed: [],
  };
}

describe('mission game count tracking by mode', () => {
  const processGameCompletion = (
    userMissions: UserMissions,
    isMultiplayer: boolean,
    category: string
  ) => {
    const service = missionService as unknown as {
      processGameCompletion: (
        userMissions: UserMissions,
        event: {
          userId: string;
          gameId: string;
          isMultiplayer: boolean;
          gameCompleted: {
            category: string;
            totalScore: number;
            correctAnswers: number;
            totalAnswers: number;
            accuracy: number;
            isWinner: boolean;
          };
        }
      ) => Array<{ missionId: string; newValue: number }>;
    };

    return service.processGameCompletion(userMissions, {
      userId: 'user-1',
      gameId: `game-${category}-${isMultiplayer ? 'mp' : 'local'}`,
      isMultiplayer,
      gameCompleted: {
        category,
        totalScore: 25,
        correctAnswers: 5,
        totalAnswers: 10,
        accuracy: 50,
        isWinner: false,
      },
    });
  };

  it('increments only local missions for single-player completion', () => {
    const userMissions = createUserMissions();
    processGameCompletion(userMissions, false, 'Movies');

    expect(userMissions.missions.play_5_local_games?.currentValue).toBe(1);
    expect(userMissions.missions.play_5_multiplayer_games?.currentValue).toBeUndefined();
    expect(userMissions.missions.local_veteran_25?.currentValue).toBe(1);
    expect(userMissions.missions.multiplayer_veteran_25?.currentValue).toBeUndefined();
    expect(userMissions.localCategoriesPlayed).toEqual(['Sports', 'Movies']);
    expect(userMissions.multiplayerCategoriesPlayed).toEqual([]);
    expect(userMissions.missions.play_3_local_categories?.currentValue).toBe(2);
    expect(userMissions.missions.play_3_multiplayer_categories?.currentValue).toBeUndefined();
  });

  it('increments only multiplayer missions for online completion', () => {
    const userMissions = createUserMissions();
    processGameCompletion(userMissions, true, 'Movies');

    expect(userMissions.missions.play_5_multiplayer_games?.currentValue).toBe(1);
    expect(userMissions.missions.play_5_local_games?.currentValue).toBeUndefined();
    expect(userMissions.missions.multiplayer_veteran_25?.currentValue).toBe(1);
    expect(userMissions.missions.local_veteran_25?.currentValue).toBeUndefined();
    expect(userMissions.multiplayerCategoriesPlayed).toEqual(['Movies']);
    expect(userMissions.localCategoriesPlayed).toEqual(['Sports']);
    expect(userMissions.missions.play_3_multiplayer_categories?.currentValue).toBe(1);
    expect(userMissions.missions.play_3_local_categories?.currentValue).toBeUndefined();
  });
});
