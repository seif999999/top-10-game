// Integration tests for multiplayer functionality using Firebase Emulator
// This test simulates concurrent answer awarding to verify atomic transactions

import { initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  runTransaction 
} from 'firebase/firestore';
import { awardAnswer } from '../../services/multiplayerTransaction';
import { pointsForRank } from '../../services/scoring';

describe('Multiplayer Integration Tests', () => {
  let testEnv: RulesTestEnvironment;
  let db: any;

  beforeAll(async () => {
    // Initialize Firebase test environment
    testEnv = await initializeTestEnvironment({
      projectId: 'test-project',
      firestore: {
        rules: `
          rules_version = '2';
          service cloud.firestore {
            match /databases/{database}/documents {
              match /multiplayerGames/{roomCode} {
                allow read, write: if true; // Allow all for testing
              }
            }
          }
        `,
        host: 'localhost',
        port: 8080
      }
    });
    
    db = testEnv.authenticatedContext('test-user').firestore();
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  beforeEach(async () => {
    // Clean up before each test
    await testEnv.clearFirestore();
  });

  describe('Concurrent Answer Awarding', () => {
    test('should prevent double-awarding when two clients try to award the same answer simultaneously', async () => {
      const roomCode = 'TEST123';
      const answerText = 'Test Answer';
      const player1Id = 'player1';
      const player2Id = 'player2';
      const answerRank = 1;

      // Set up initial room data
      const roomRef = doc(db, 'multiplayerGames', roomCode);
      await setDoc(roomRef, {
        roomCode,
        hostId: 'host',
        createdAt: Date.now(),
        status: 'playing',
        category: 'test',
        questions: [],
        currentQuestionIndex: 0,
        players: {
          [player1Id]: { id: player1Id, name: 'Player 1', score: 0, isHost: false, joinedAt: Date.now(), isConnected: true, lastSeen: Date.now() },
          [player2Id]: { id: player2Id, name: 'Player 2', score: 0, isHost: false, joinedAt: Date.now(), isConnected: true, lastSeen: Date.now() }
        },
        gamePhase: 'question',
        questionStartTime: Date.now(),
        questionTimeLimit: 60,
        currentAnswers: [],
        revealedAnswers: [],
        answerOwners: {},
        playerSubmissions: {},
        maxPlayers: 8,
        isPrivate: false,
        lastActivity: Date.now()
      });

      // Simulate concurrent award attempts
      const [result1, result2] = await Promise.allSettled([
        awardAnswer(roomCode, answerText, player1Id, answerRank),
        awardAnswer(roomCode, answerText, player2Id, answerRank)
      ]);

      // One should succeed, one should fail
      const results = [result1, result2].map(r => r.status === 'fulfilled' ? r.value : null);
      const successCount = results.filter(r => r && r.success).length;
      const failureCount = results.filter(r => r && !r.success).length;

      expect(successCount).toBe(1);
      expect(failureCount).toBe(1);

      // Verify only one player got the points
      const roomSnap = await getDoc(roomRef);
      const roomData = roomSnap.data();
      
      const player1Score = roomData.players[player1Id].score;
      const player2Score = roomData.players[player2Id].score;
      const expectedPoints = pointsForRank(answerRank);

      // Only one player should have the points
      const totalPointsAwarded = player1Score + player2Score;
      expect(totalPointsAwarded).toBe(expectedPoints);
      expect(player1Score === expectedPoints || player2Score === expectedPoints).toBe(true);
      expect(player1Score === 0 || player2Score === 0).toBe(true);

      // Answer should be marked as revealed
      expect(roomData.revealedAnswers).toContain(answerText);
      expect(roomData.answerOwners[answerText]).toBeDefined();
    });

    test('should allow different answers to be awarded simultaneously', async () => {
      const roomCode = 'TEST456';
      const answer1Text = 'Answer 1';
      const answer2Text = 'Answer 2';
      const player1Id = 'player1';
      const player2Id = 'player2';
      const answerRank = 1;

      // Set up initial room data
      const roomRef = doc(db, 'multiplayerGames', roomCode);
      await setDoc(roomRef, {
        roomCode,
        hostId: 'host',
        createdAt: Date.now(),
        status: 'playing',
        category: 'test',
        questions: [],
        currentQuestionIndex: 0,
        players: {
          [player1Id]: { id: player1Id, name: 'Player 1', score: 0, isHost: false, joinedAt: Date.now(), isConnected: true, lastSeen: Date.now() },
          [player2Id]: { id: player2Id, name: 'Player 2', score: 0, isHost: false, joinedAt: Date.now(), isConnected: true, lastSeen: Date.now() }
        },
        gamePhase: 'question',
        questionStartTime: Date.now(),
        questionTimeLimit: 60,
        currentAnswers: [],
        revealedAnswers: [],
        answerOwners: {},
        playerSubmissions: {},
        maxPlayers: 8,
        isPrivate: false,
        lastActivity: Date.now()
      });

      // Award different answers simultaneously
      const [result1, result2] = await Promise.allSettled([
        awardAnswer(roomCode, answer1Text, player1Id, answerRank),
        awardAnswer(roomCode, answer2Text, player2Id, answerRank)
      ]);

      // Both should succeed
      const results = [result1, result2].map(r => r.status === 'fulfilled' ? r.value : null);
      const successCount = results.filter(r => r && r.success).length;

      expect(successCount).toBe(2);

      // Verify both players got points
      const roomSnap = await getDoc(roomRef);
      const roomData = roomSnap.data();
      
      const player1Score = roomData.players[player1Id].score;
      const player2Score = roomData.players[player2Id].score;
      const expectedPoints = pointsForRank(answerRank);

      expect(player1Score).toBe(expectedPoints);
      expect(player2Score).toBe(expectedPoints);

      // Both answers should be marked as revealed
      expect(roomData.revealedAnswers).toContain(answer1Text);
      expect(roomData.revealedAnswers).toContain(answer2Text);
      expect(roomData.answerOwners[answer1Text]).toBe(player1Id);
      expect(roomData.answerOwners[answer2Text]).toBe(player2Id);
    });
  });

  describe('Room State Consistency', () => {
    test('should maintain consistent room state during concurrent operations', async () => {
      const roomCode = 'TEST789';
      
      // Set up initial room
      const roomRef = doc(db, 'multiplayerGames', roomCode);
      await setDoc(roomRef, {
        roomCode,
        hostId: 'host',
        createdAt: Date.now(),
        status: 'lobby',
        category: 'test',
        questions: [],
        currentQuestionIndex: 0,
        players: {},
        gamePhase: 'lobby',
        questionStartTime: 0,
        questionTimeLimit: 60,
        currentAnswers: [],
        revealedAnswers: [],
        answerOwners: {},
        playerSubmissions: {},
        maxPlayers: 8,
        isPrivate: false,
        lastActivity: Date.now()
      });

      // Simulate multiple players joining simultaneously
      const playerIds = ['player1', 'player2', 'player3'];
      const joinPromises = playerIds.map(playerId => 
        runTransaction(db, async (transaction) => {
          const roomSnap = await transaction.get(roomRef);
          const roomData = roomSnap.data();
          
          const updatedPlayers = {
            ...roomData.players,
            [playerId]: {
              id: playerId,
              name: `Player ${playerId}`,
              score: 0,
              isHost: false,
              joinedAt: Date.now(),
              isConnected: true,
              lastSeen: Date.now()
            }
          };

          transaction.update(roomRef, {
            players: updatedPlayers,
            lastActivity: Date.now()
          });
        })
      );

      await Promise.all(joinPromises);

      // Verify all players were added
      const roomSnap = await getDoc(roomRef);
      const roomData = roomSnap.data();
      
      expect(Object.keys(roomData.players)).toHaveLength(3);
      playerIds.forEach(playerId => {
        expect(roomData.players[playerId]).toBeDefined();
        expect(roomData.players[playerId].name).toBe(`Player ${playerId}`);
      });
    });
  });
});
