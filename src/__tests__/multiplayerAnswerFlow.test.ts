import { submitAnswer } from '../backend/services/multiplayerGameFlowV2';
import { findBestMatch } from '../backend/services/fuzzyMatching';

// Mock Firebase
jest.mock('firebase/firestore', () => ({
  runTransaction: jest.fn(),
  doc: jest.fn(),
  serverTimestamp: jest.fn(() => ({ seconds: Date.now() / 1000, nanoseconds: 0 }))
}));

// Mock Firebase db
jest.mock('../services/firebase', () => ({
  db: {}
}));

describe('Multiplayer Answer Flow Integration', () => {
  const mockRoomData = {
    roomCode: 'TEST123',
    status: 'playing' as const,
    currentPlayerId: 'player1',
    answersSubmittedCount: 0,
    currentQuestionIndex: 0,
    questions: [{
      answers: [
        { text: 'Michael Jackson', rank: 1, points: 1, aliases: ['MJ', 'King of Pop'] },
        { text: 'Elvis Presley', rank: 2, points: 2, aliases: ['The King', 'Elvis'] },
        { text: 'Madonna', rank: 3, points: 3, aliases: ['Material Girl'] }
      ]
    }],
    revealedAnswers: [null, null, null, null, null, null, null, null, null, null],
    scores: { player1: 0 },
    turnOrder: ['player1', 'player2'],
    currentTurnIndex: 0,
    players: {
      player1: { id: 'player1', name: 'Player 1', score: 0, isHost: true, joinedAt: Date.now(), isConnected: true, lastSeen: Date.now() },
      player2: { id: 'player2', name: 'Player 2', score: 0, isHost: false, joinedAt: Date.now(), isConnected: true, lastSeen: Date.now() }
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Answer Submission Flow', () => {
    test('should handle correct answer submission', async () => {
      const { runTransaction } = require('firebase/firestore');
      
      // Mock successful transaction
      runTransaction.mockImplementation(async (db: any, callback: any) => {
        const mockTransaction = {
          get: jest.fn().mockResolvedValue({
            exists: () => true,
            data: () => mockRoomData
          }),
          update: jest.fn()
        };
        
        return await callback(mockTransaction);
      });

      const result = await submitAnswer('TEST123', 'player1', 'Michael Jackson');
      
      expect(result.success).toBe(true);
      expect(result.points).toBe(1);
    });

    test('should handle answer with typo', async () => {
      const { runTransaction } = require('firebase/firestore');
      
      runTransaction.mockImplementation(async (db: any, callback: any) => {
        const mockTransaction = {
          get: jest.fn().mockResolvedValue({
            exists: () => true,
            data: () => mockRoomData
          }),
          update: jest.fn()
        };
        
        return await callback(mockTransaction);
      });

      const result = await submitAnswer('TEST123', 'player1', 'Micheal Jackson');
      
      expect(result.success).toBe(true);
      expect(result.points).toBe(1);
    });

    test('should handle nickname answer', async () => {
      const { runTransaction } = require('firebase/firestore');
      
      runTransaction.mockImplementation(async (db: any, callback: any) => {
        const mockTransaction = {
          get: jest.fn().mockResolvedValue({
            exists: () => true,
            data: () => mockRoomData
          }),
          update: jest.fn()
        };
        
        return await callback(mockTransaction);
      });

      const result = await submitAnswer('TEST123', 'player1', 'MJ');
      
      expect(result.success).toBe(true);
      expect(result.points).toBe(1);
    });

    test('should handle wrong answer', async () => {
      const { runTransaction } = require('firebase/firestore');
      
      runTransaction.mockImplementation(async (db: any, callback: any) => {
        const mockTransaction = {
          get: jest.fn().mockResolvedValue({
            exists: () => true,
            data: () => mockRoomData
          }),
          update: jest.fn()
        };
        
        return await callback(mockTransaction);
      });

      const result = await submitAnswer('TEST123', 'player1', 'Random Person');
      
      expect(result.success).toBe(true);
      expect(result.points).toBe(0);
    });

    test('should handle already revealed answer', async () => {
      const { runTransaction } = require('firebase/firestore');
      
      const roomWithRevealedAnswer = {
        ...mockRoomData,
        revealedAnswers: [
          { answerId: 'Michael Jackson', playerId: 'player2', points: 1 },
          null, null, null, null, null, null, null, null, null
        ]
      };
      
      runTransaction.mockImplementation(async (db: any, callback: any) => {
        const mockTransaction = {
          get: jest.fn().mockResolvedValue({
            exists: () => true,
            data: () => roomWithRevealedAnswer
          }),
          update: jest.fn()
        };
        
        return await callback(mockTransaction);
      });

      const result = await submitAnswer('TEST123', 'player1', 'Michael Jackson');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Answer already revealed');
    });

    test('should handle not player turn', async () => {
      const { runTransaction } = require('firebase/firestore');
      
      const roomWithDifferentPlayer = {
        ...mockRoomData,
        currentPlayerId: 'player2'
      };
      
      runTransaction.mockImplementation(async (db: any, callback: any) => {
        const mockTransaction = {
          get: jest.fn().mockResolvedValue({
            exists: () => true,
            data: () => roomWithDifferentPlayer
          }),
          update: jest.fn()
        };
        
        return await callback(mockTransaction);
      });

      const result = await submitAnswer('TEST123', 'player1', 'Michael Jackson');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Not your turn');
    });

    test('should handle room not found', async () => {
      const { runTransaction } = require('firebase/firestore');
      
      runTransaction.mockImplementation(async (db: any, callback: any) => {
        const mockTransaction = {
          get: jest.fn().mockResolvedValue({
            exists: () => false
          }),
          update: jest.fn()
        };
        
        return await callback(mockTransaction);
      });

      const result = await submitAnswer('TEST123', 'player1', 'Michael Jackson');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Room not found');
    });
  });

  describe('Answer Matching Integration', () => {
    test('should match various answer formats', () => {
      const answers = [
        { text: 'Michael Jackson', rank: 1, points: 1, aliases: ['MJ', 'King of Pop'] }
      ];

      const testCases = [
        { input: 'Michael Jackson', expected: true },
        { input: 'Micheal Jackson', expected: true },
        { input: 'michael jackson', expected: true },
        { input: 'Mike Jackson', expected: true },
        { input: 'MJ', expected: true },
        { input: 'Dr. Michael Jackson', expected: true },
        { input: '  Michael   Jackson  ', expected: true },
        { input: 'Michael-Jackson!', expected: true },
        { input: 'Random Person', expected: false }
      ];

      testCases.forEach(({ input, expected }) => {
        const result = findBestMatch(input, answers);
        expect(result.isMatch).toBe(expected);
        if (expected) {
          expect(result.officialAnswer).toBe('Michael Jackson');
        }
      });
    });
  });
});
