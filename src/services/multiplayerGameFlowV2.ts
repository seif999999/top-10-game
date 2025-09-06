/**
 * Multiplayer Game Flow V2 - Following the exact specification
 * 
 * Key Features:
 * - Turn-based system: each player gets 60s turn to submit ONE answer
 * - Game ends when 10 answers are revealed OR host closes room
 * - Atomic transactions for all state changes
 * - Server timestamp synchronization
 * - Proper answer matching with aliases
 */

import { runTransaction, doc, serverTimestamp, collection, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';
import { RoomData, RevealedAnswer, Answer } from '../types/game';

// Server time offset cache
let serverOffset: number | null = null;
let serverOffsetTimestamp: number = 0;
const SERVER_OFFSET_CACHE_DURATION = 30000; // 30 seconds

/**
 * Get server time offset for client synchronization
 */
export async function getServerOffset(): Promise<number> {
  const now = Date.now();
  
  // Return cached offset if still valid
  if (serverOffset !== null && (now - serverOffsetTimestamp) < SERVER_OFFSET_CACHE_DURATION) {
    return serverOffset;
  }
  
  try {
    // Write temp doc with serverTimestamp then read it
    const tempRef = doc(collection(db, 'timeSync'));
    await setDoc(tempRef, { t: serverTimestamp() });
    const snap = await getDoc(tempRef);
    const serverTs = snap.data()?.t?.toMillis();
    await deleteDoc(tempRef);
    
    if (serverTs) {
      serverOffset = serverTs - now;
      serverOffsetTimestamp = now;
      console.log(`🕐 Server offset calculated: ${serverOffset}ms`);
      return serverOffset;
    }
  } catch (error) {
    console.error('❌ Failed to calculate server offset:', error);
  }
  
  // Fallback to 0 if calculation fails
  serverOffset = 0;
  serverOffsetTimestamp = now;
  return 0;
}

/**
 * Calculate time remaining for current turn
 */
export function calculateTimeRemaining(turnStartTime: any, turnTimeLimitSec: number, serverOffset: number): number {
  const now = Date.now() + serverOffset;
  const turnStart = typeof turnStartTime === 'object' && turnStartTime && 'seconds' in turnStartTime
    ? turnStartTime.seconds * 1000
    : typeof turnStartTime === 'number'
    ? turnStartTime
    : 0;
  
  const elapsed = now - turnStart;
  const remaining = Math.max(0, (turnTimeLimitSec * 1000) - elapsed);
  return Math.ceil(remaining / 1000); // Return seconds
}

/**
 * Normalize answer text for matching
 */
function normalizeAnswerText(text: string): string {
  return (text || '').toLowerCase().trim();
}

/**
 * Check if user answer matches a correct answer (with aliases support)
 */
function findMatchingAnswer(userAnswer: string, correctAnswers: Answer[]): { answer: Answer; index: number } | null {
  const normalizedUserAnswer = normalizeAnswerText(userAnswer);
  
  for (let i = 0; i < correctAnswers.length; i++) {
    const correctAnswer = correctAnswers[i];
    
    // Check main text
    if (normalizeAnswerText(correctAnswer.text) === normalizedUserAnswer) {
      return { answer: correctAnswer, index: i };
    }
    
    // Check aliases
    if (correctAnswer.aliases) {
      for (const alias of correctAnswer.aliases) {
        if (normalizeAnswerText(alias) === normalizedUserAnswer) {
          return { answer: correctAnswer, index: i };
        }
      }
    }
  }
  
  return null;
}

/**
 * Calculate points for answer based on rank
 */
function calculatePoints(rank: number): number {
  return rank <= 10 ? (11 - rank) * 10 : 0;
}

/**
 * Host starts the game atomically
 */
export async function hostStartGame(
  roomCode: string,
  hostId: string,
  turnTimeLimitSec: number = 60
): Promise<{ success: boolean; error?: string }> {
  console.log(`🎮 HOST_START_GAME: Room ${roomCode}, Host ${hostId}, TimeLimit ${turnTimeLimitSec}s`);
  
  try {
    const result = await runTransaction(db, async (transaction) => {
      const roomRef = doc(db, 'multiplayerGames', roomCode);
      const roomSnap = await transaction.get(roomRef);
      
      if (!roomSnap.exists()) {
        throw new Error('Room not found');
      }
      
      const room = roomSnap.data() as RoomData;
      
      // Transaction checks
      if (room.status !== 'lobby') {
        console.error(`❌ HOST_START_GAME: Room status check failed`, {
          roomCode,
          currentStatus: room.status,
          expectedStatus: 'lobby',
          roomData: {
            status: room.status,
            gamePhase: room.gamePhase,
            playersCount: Object.keys(room.players || {}).length,
            hostId: room.hostId,
            requestingHostId: hostId
          }
        });
        throw new Error(`Room is not in lobby state (current: ${room.status})`);
      }
      
      if (room.hostId !== hostId) {
        throw new Error('Only the host can start the game');
      }
      
      if (!room.questions || room.questions.length === 0) {
        throw new Error('No questions available');
      }
      
      // Create turn order (deterministic sort by player ID)
      const turnOrder = Object.keys(room.players).sort();
      
      // Initialize revealed answers array with 10 nulls
      const revealedAnswers: (null | RevealedAnswer)[] = Array(10).fill(null);
      
      // Initialize scores for all players
      const scores: { [playerId: string]: number } = {};
      for (const playerId of Object.keys(room.players)) {
        scores[playerId] = 0;
      }
      
      // Get first question
      const firstQuestion = room.questions[0];
      if (!firstQuestion) {
        throw new Error('First question not found');
      }
      
      // Transaction writes
      const updates = {
        status: 'playing' as const,
        gamePhase: 'question' as const,
        currentQuestionIndex: 0,
        currentAnswers: firstQuestion.answers,
        turnOrder,
        currentTurnIndex: 0,
        currentPlayerId: turnOrder[0],
        turnStartTime: serverTimestamp(),
        turnTimeLimit: turnTimeLimitSec,
        answersSubmittedCount: 0,
        revealedAnswers,
        scores,
        lastActivity: serverTimestamp()
      };
      
      transaction.update(roomRef, updates);
      
      console.log(`✅ HOST_START_GAME: Game started, first player: ${turnOrder[0]}`);
      return { success: true };
    });
    
    return result;
  } catch (error) {
    console.error(`❌ HOST_START_GAME: Failed to start game:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Submit answer for current player's turn
 */
export async function submitAnswer(
  roomCode: string,
  playerId: string,
  answerText: string
): Promise<{ success: boolean; error?: string; points?: number }> {
  console.log(`📝 SUBMIT_ANSWER: Room ${roomCode}, Player ${playerId}, Answer: "${answerText}"`);
  
  try {
    const result = await runTransaction(db, async (transaction) => {
      const roomRef = doc(db, 'multiplayerGames', roomCode);
      const roomSnap = await transaction.get(roomRef);
      
      if (!roomSnap.exists()) {
        throw new Error('Room not found');
      }
      
      const room = roomSnap.data() as RoomData;
      
      // Validation checks
      if (room.status !== 'playing') {
        throw new Error('Game is not in playing state');
      }
      
      if (room.currentPlayerId !== playerId) {
        throw new Error('Not your turn');
      }
      
      if (room.answersSubmittedCount >= 10) {
        throw new Error('All answers have been revealed for this question');
      }
      
      // Find matching answer
      const currentQuestion = room.questions[room.currentQuestionIndex];
      if (!currentQuestion) {
        throw new Error('No current question found');
      }
      
      const match = findMatchingAnswer(answerText, currentQuestion.answers);
      let points = 0;
      let newRevealedAnswers = [...room.revealedAnswers];
      let newScores = { ...room.scores };
      let newAnswersSubmittedCount = room.answersSubmittedCount;
      
      if (match) {
        // Correct answer found
        const { answer, index } = match;
        
        // Check if answer is already revealed
        if (room.revealedAnswers[index] !== null) {
          throw new Error('Answer already revealed');
        }
        
        // Calculate points
        points = calculatePoints(answer.rank);
        
        // Update room state atomically
        newRevealedAnswers[index] = {
          answerId: answer.id,
          playerId: playerId,
          points: points
        };
        
        newScores[playerId] = (newScores[playerId] || 0) + points;
        newAnswersSubmittedCount = room.answersSubmittedCount + 1;
        
        console.log(`✅ SUBMIT_ANSWER: Correct answer "${answerText}" awarded ${points} points`);
      } else {
        // Wrong answer - no points, but turn still advances
        console.log(`❌ SUBMIT_ANSWER: Wrong answer "${answerText}" - no points awarded`);
      }
      
      // Always advance turn (regardless of correct/wrong answer)
      const nextTurnIndex = (room.currentTurnIndex + 1) % room.turnOrder.length;
      const nextPlayerId = room.turnOrder[nextTurnIndex];
      
      let updates: any = {
        revealedAnswers: newRevealedAnswers,
        scores: newScores,
        answersSubmittedCount: newAnswersSubmittedCount,
        currentTurnIndex: nextTurnIndex,
        currentPlayerId: nextPlayerId,
        turnStartTime: serverTimestamp(),
        lastActivity: serverTimestamp()
      };
      
      // Check if question is complete (10 answers revealed) - only for correct answers
      if (newAnswersSubmittedCount >= 10) {
        // Question complete - move to next question or end game
        const nextQuestionIndex = room.currentQuestionIndex + 1;
        
        if (nextQuestionIndex >= room.questions.length) {
          // Game finished
          updates = {
            ...updates,
            status: 'finished' as const,
            gamePhase: 'finished' as const
          };
          console.log(`🏁 SUBMIT_ANSWER: Game finished - all questions completed`);
        } else {
          // Move to next question
          const nextQuestion = room.questions[nextQuestionIndex];
          updates = {
            ...updates,
            currentQuestionIndex: nextQuestionIndex,
            currentAnswers: nextQuestion.answers,
            revealedAnswers: Array(10).fill(null),
            answersSubmittedCount: 0,
            // Reset turn system for new question
            currentTurnIndex: 0,
            currentPlayerId: room.turnOrder[0],
            turnStartTime: serverTimestamp()
          };
          console.log(`✅ SUBMIT_ANSWER: Moved to question ${nextQuestionIndex}`);
        }
      } else {
        // Question not complete - just advance turn
        console.log(`✅ SUBMIT_ANSWER: Turn advanced to player ${nextPlayerId}`);
      }
      
      transaction.update(roomRef, updates);
      
      console.log(`✅ SUBMIT_ANSWER: Answer "${answerText}" awarded ${points} points`);
      return { success: true, points };
    });
    
    return result;
  } catch (error) {
    console.error(`❌ SUBMIT_ANSWER: Failed to submit answer:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Advance turn when timer expires
 */
export async function advanceTurnOnTimeout(
  roomCode: string,
  callingPlayerId: string
): Promise<{ success: boolean; error?: string }> {
  console.log(`⏰ ADVANCE_TURN_TIMEOUT: Room ${roomCode}, Calling Player ${callingPlayerId}`);
  
  try {
    const result = await runTransaction(db, async (transaction) => {
      const roomRef = doc(db, 'multiplayerGames', roomCode);
      const roomSnap = await transaction.get(roomRef);
      
      if (!roomSnap.exists()) {
        throw new Error('Room not found');
      }
      
      const room = roomSnap.data() as RoomData;
      
      // Check if game is in playing state
      if (room.status !== 'playing') {
        throw new Error('Game is not in playing state');
      }
      
      // Check if turn has actually expired
      const serverOffset = await getServerOffset();
      const timeRemaining = calculateTimeRemaining(room.turnStartTime, room.turnTimeLimit, serverOffset);
      
      if (timeRemaining > 0) {
        throw new Error('Turn has not expired yet');
      }
      
      // Advance turn
      const nextTurnIndex = (room.currentTurnIndex + 1) % room.turnOrder.length;
      const nextPlayerId = room.turnOrder[nextTurnIndex];
      
      const updates = {
        currentTurnIndex: nextTurnIndex,
        currentPlayerId: nextPlayerId,
        turnStartTime: serverTimestamp(),
        lastActivity: serverTimestamp()
      };
      
      transaction.update(roomRef, updates);
      
      console.log(`✅ ADVANCE_TURN_TIMEOUT: Turn advanced to player ${nextPlayerId}`);
      return { success: true };
    });
    
    return result;
  } catch (error) {
    console.error(`❌ ADVANCE_TURN_TIMEOUT: Failed to advance turn:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Host ends the game (closes room)
 */
export async function hostEndGame(
  roomCode: string,
  hostId: string
): Promise<{ success: boolean; error?: string }> {
  console.log(`🏁 HOST_END_GAME: Room ${roomCode}, Host ${hostId}`);
  
  try {
    const result = await runTransaction(db, async (transaction) => {
      const roomRef = doc(db, 'multiplayerGames', roomCode);
      const roomSnap = await transaction.get(roomRef);
      
      if (!roomSnap.exists()) {
        throw new Error('Room not found');
      }
      
      const room = roomSnap.data() as RoomData;
      
      // Verify host
      if (room.hostId !== hostId) {
        throw new Error('Only the host can end the game');
      }
      
      // Close the room
      const updates = {
        status: 'closed' as const,
        gamePhase: 'finished' as const,
        lastActivity: serverTimestamp()
      };
      
      transaction.update(roomRef, updates);
      
      console.log(`✅ HOST_END_GAME: Room closed by host`);
      return { success: true };
    });
    
    return result;
  } catch (error) {
    console.error(`❌ HOST_END_GAME: Failed to end game:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Reset room status to lobby if it's in an invalid state
 * This is a recovery function for corrupted room data
 */
export async function resetRoomStatus(
  roomCode: string,
  hostId: string
): Promise<{ success: boolean; error?: string }> {
  console.log(`🔄 RESET_ROOM_STATUS: Resetting room ${roomCode} to lobby state`);
  
  try {
    const result = await runTransaction(db, async (transaction) => {
      const roomRef = doc(db, 'multiplayerGames', roomCode);
      const roomSnap = await transaction.get(roomRef);
      
      if (!roomSnap.exists()) {
        throw new Error('Room not found');
      }
      
      const room = roomSnap.data() as RoomData;
      
      // Verify host
      if (room.hostId !== hostId) {
        throw new Error('Only the host can reset room status');
      }
      
      // Reset to lobby state
      const updates = {
        status: 'lobby' as const,
        gamePhase: 'lobby' as const,
        currentQuestionIndex: 0,
        currentAnswers: [],
        revealedAnswers: Array(10).fill(null),
        scores: Object.keys(room.players).reduce((acc, playerId) => {
          acc[playerId] = 0;
          return acc;
        }, {} as { [playerId: string]: number }),
        answersSubmittedCount: 0,
        currentPlayerId: null,
        turnStartTime: null,
        currentTurnIndex: 0,
        turnOrder: Object.keys(room.players),
        lastActivity: serverTimestamp()
      };
      
      transaction.update(roomRef, updates);
      
      console.log(`✅ RESET_ROOM_STATUS: Room reset to lobby state`);
      return { success: true };
    });
    
    return result;
  } catch (error) {
    console.error(`❌ RESET_ROOM_STATUS: Failed to reset room:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Check if player is allowed to submit answer
 */
export function isAllowedToSubmit(playerId: string, room: RoomData): { allowed: boolean; reason?: string } {
  if (room.status !== 'playing') {
    return { allowed: false, reason: 'Game is not in playing state' };
  }
  
  if (room.currentPlayerId !== playerId) {
    return { allowed: false, reason: 'Not your turn' };
  }
  
  if (room.answersSubmittedCount >= 10) {
    return { allowed: false, reason: 'All answers have been revealed' };
  }
  
  return { allowed: true };
}
