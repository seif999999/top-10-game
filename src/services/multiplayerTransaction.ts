// Atomic transaction helpers for multiplayer operations
// Provides both Firestore and Realtime Database transaction patterns

import { 
  runTransaction, 
  doc, 
  getDoc,
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { pointsForRank } from './scoring';
import { RoomData, Answer } from '../types/game';

/**
 * Award an answer to a player atomically
 * Prevents double-awarding and ensures consistent scoring
 */
export async function awardAnswer(
  roomCode: string,
  answerText: string,
  playerId: string,
  answerRank: number
): Promise<{ success: boolean; points: number; error?: string }> {
  console.log(`🏆 AWARD_ANSWER: Room ${roomCode}, Answer "${answerText}", Player ${playerId}, Rank ${answerRank}`);
  
  try {
    const result = await runTransaction(db, async (transaction) => {
      const roomRef = doc(db, 'multiplayerGames', roomCode);
      const roomSnap = await transaction.get(roomRef);
      
      if (!roomSnap.exists()) {
        throw new Error('Room not found');
      }
      
      const roomData = roomSnap.data() as RoomData;
      
      // Check if answer is already revealed
      if (roomData.revealedAnswers?.includes(answerText)) {
        console.log(`⚠️ Answer "${answerText}" already revealed, skipping award`);
        throw new Error('Answer already revealed');
      }
      
      // Check if player exists in room
      if (!roomData.players?.[playerId]) {
        throw new Error('Player not in room');
      }
      
      // Calculate points
      const points = pointsForRank(answerRank);
      
      // Prepare updates
      const newRevealedAnswers = [...(roomData.revealedAnswers || []), answerText];
      const newAnswerOwners = {
        ...(roomData.answerOwners || {}),
        [answerText]: playerId
      };
      
      // Update player score
      const updatedPlayers = { ...roomData.players };
      if (updatedPlayers[playerId]) {
        updatedPlayers[playerId].score += points;
      }
      
      // Update player submissions
      const updatedSubmissions = { ...roomData.playerSubmissions };
      if (!updatedSubmissions[playerId]) {
        updatedSubmissions[playerId] = {
          answers: [],
          submittedAt: Date.now(),
          points: 0
        };
      }
      updatedSubmissions[playerId].points += points;
      
      // Apply all updates in transaction
      transaction.update(roomRef, {
        revealedAnswers: newRevealedAnswers,
        answerOwners: newAnswerOwners,
        players: updatedPlayers,
        playerSubmissions: updatedSubmissions,
        lastActivity: serverTimestamp()
      });
      
      console.log(`✅ AWARD_ANSWER: Awarded ${points} points to player ${playerId} for answer "${answerText}"`);
      
      return { success: true, points };
    });
    
    return result;
  } catch (error) {
    console.error(`❌ AWARD_ANSWER: Failed to award answer:`, error);
    return {
      success: false,
      points: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Start a new round atomically
 * Only the host can start rounds
 */
export async function startRound(
  roomCode: string,
  hostId: string,
  questionIndex: number,
  timeLimit: number = 60
): Promise<{ success: boolean; error?: string }> {
  console.log(`🎮 START_ROUND: Room ${roomCode}, Host ${hostId}, Question ${questionIndex}, TimeLimit ${timeLimit}s`);
  
  try {
    const result = await runTransaction(db, async (transaction) => {
      const roomRef = doc(db, 'multiplayerGames', roomCode);
      const roomSnap = await transaction.get(roomRef);
      
      if (!roomSnap.exists()) {
        throw new Error('Room not found');
      }
      
      const roomData = roomSnap.data() as RoomData;
      
      // Verify host
      if (roomData.hostId !== hostId) {
        throw new Error('Only the host can start rounds');
      }
      
      // Check if room is in correct state
      if (roomData.status !== 'playing') {
        throw new Error('Room is not in playing state');
      }
      
      // Get current question
      const currentQuestion = roomData.questions?.[questionIndex];
      if (!currentQuestion) {
        throw new Error('Question not found');
      }
      
      // Prepare updates
      const updates = {
        currentQuestionIndex: questionIndex,
        gamePhase: 'question' as const,
        questionStartTime: serverTimestamp(),
        questionTimeLimit: timeLimit,
        roundStartTs: serverTimestamp(),
        roundDurationSeconds: timeLimit,
        currentAnswers: currentQuestion.answers,
        revealedAnswers: [],
        answerOwners: {},
        playerSubmissions: {},
        lastActivity: serverTimestamp()
      };
      
      transaction.update(roomRef, updates);
      
      console.log(`✅ START_ROUND: Started question ${questionIndex} in room ${roomCode}`);
      
      return { success: true };
    });
    
    return result;
  } catch (error) {
    console.error(`❌ START_ROUND: Failed to start round:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * End the current round atomically
 * Only the host can end rounds
 */
export async function endRound(
  roomCode: string,
  hostId: string
): Promise<{ success: boolean; error?: string }> {
  console.log(`🏁 END_ROUND: Room ${roomCode}, Host ${hostId}`);
  
  try {
    const result = await runTransaction(db, async (transaction) => {
      const roomRef = doc(db, 'multiplayerGames', roomCode);
      const roomSnap = await transaction.get(roomRef);
      
      if (!roomSnap.exists()) {
        throw new Error('Room not found');
      }
      
      const roomData = roomSnap.data() as RoomData;
      
      // Verify host
      if (roomData.hostId !== hostId) {
        throw new Error('Only the host can end rounds');
      }
      
      // Check if room is in question phase
      if (roomData.gamePhase !== 'question') {
        throw new Error('Room is not in question phase');
      }
      
      // Move to next question or finish game
      const nextQuestionIndex = (roomData.currentQuestionIndex || 0) + 1;
      const totalQuestions = roomData.questions?.length || 0;
      
      if (nextQuestionIndex >= totalQuestions) {
        // Game finished
        transaction.update(roomRef, {
          status: 'finished',
          gamePhase: 'finished',
          lastActivity: serverTimestamp()
        });
        console.log(`🏁 END_ROUND: Game finished in room ${roomCode}`);
      } else {
        // Move to next question
        const nextQuestion = roomData.questions?.[nextQuestionIndex];
        if (nextQuestion) {
          transaction.update(roomRef, {
            currentQuestionIndex: nextQuestionIndex,
            gamePhase: 'question',
            questionStartTime: serverTimestamp(),
            roundStartTs: serverTimestamp(),
            currentAnswers: nextQuestion.answers,
            revealedAnswers: [],
            answerOwners: {},
            playerSubmissions: {},
            lastActivity: serverTimestamp()
          });
          console.log(`✅ END_ROUND: Moved to question ${nextQuestionIndex} in room ${roomCode}`);
        }
      }
      
      return { success: true };
    });
    
    return result;
  } catch (error) {
    console.error(`❌ END_ROUND: Failed to end round:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Update player presence atomically
 * Used for connection monitoring and reconnection
 */
export async function updatePlayerPresence(
  roomCode: string,
  playerId: string,
  isConnected: boolean = true
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await runTransaction(db, async (transaction) => {
      const roomRef = doc(db, 'multiplayerGames', roomCode);
      const roomSnap = await transaction.get(roomRef);
      
      if (!roomSnap.exists()) {
        throw new Error('Room not found');
      }
      
      const roomData = roomSnap.data() as RoomData;
      
      // Check if player exists
      if (!roomData.players?.[playerId]) {
        throw new Error('Player not in room');
      }
      
      // Update player presence
      const updatedPlayers = { ...roomData.players };
      if (updatedPlayers[playerId]) {
        updatedPlayers[playerId].isConnected = isConnected;
        updatedPlayers[playerId].lastSeen = Date.now();
      }
      
      transaction.update(roomRef, {
        players: updatedPlayers,
        lastActivity: serverTimestamp()
      });
      
      return { success: true };
    });
    
    return result;
  } catch (error) {
    console.error(`❌ UPDATE_PRESENCE: Failed to update presence:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Log transaction system initialization
console.log('🔄 Multiplayer transaction system initialized with Firestore transactions');
