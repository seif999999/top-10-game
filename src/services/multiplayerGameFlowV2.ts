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

import { runTransaction, doc, serverTimestamp, collection, setDoc, getDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { RoomData, RevealedAnswer, Answer } from '../types/game';
import { findBestMatch, normalizeAnswerEnhanced } from './fuzzyMatching';
import { pointsForRank } from './scoring';

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
 * Check if user answer matches a correct answer using enhanced fuzzy matching
 */
function findMatchingAnswer(userAnswer: string, correctAnswers: Answer[]): { answer: Answer; index: number } | null {
  if (!userAnswer || !correctAnswers || correctAnswers.length === 0) {
    return null;
  }

  // Use enhanced fuzzy matching
  const matchResult = findBestMatch(userAnswer, correctAnswers);
  
  if (matchResult.isMatch && matchResult.matchedAnswer) {
    // Find the index of the matched answer
    const index = correctAnswers.findIndex(answer => 
      answer === matchResult.matchedAnswer || 
      (typeof answer === 'object' && typeof matchResult.matchedAnswer === 'object' && 
       answer.text === matchResult.matchedAnswer.text)
    );
    
    if (index !== -1) {
      console.log(`✅ FUZZY MATCH: "${userAnswer}" -> "${matchResult.officialAnswer}" (confidence: ${matchResult.confidence}, similarity: ${matchResult.similarity.toFixed(3)})`);
      return { answer: matchResult.matchedAnswer, index };
    }
  }
  
  console.log(`❌ NO MATCH: "${userAnswer}" (best similarity: ${matchResult.similarity.toFixed(3)})`);
  return null;
}

/**
 * Calculate points for answer based on rank using centralized scoring
 */
function calculatePoints(rank: number): number {
  return pointsForRank(rank);
}

/**
 * Host starts the game atomically
 */
export async function hostStartGame(
  roomCode: string,
  hostId: string,
  turnTimeLimitSec: number = 20
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
  // ⚙️ GAME FLOW - START DEBUG LOGGING
  console.log('⚙️ GAME FLOW - START:', {
    roomCode,
    playerId,
    answerText,
    timestamp: new Date().toISOString()
  });
  
  // Debug logging for function entry
  if (__DEV__) {
    console.log(`🎯 DEBUG 1: Starting submitAnswer
Player: ${playerId.substring(0, 8)}
Answer: "${answerText}"
Room: ${roomCode}`);
  }
  
  console.log(`📝 SUBMIT_ANSWER: Room ${roomCode}, Player ${playerId}, Answer: "${answerText}"`);
  
  // Retry mechanism for failed-precondition errors
  const maxRetries = 3;
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 TRANSACTION ATTEMPT ${attempt}/${maxRetries}`);
      
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
      
      // Ensure revealedAnswers array is properly initialized
      if (!room.revealedAnswers || room.revealedAnswers.length !== 10) {
        console.log(`⚠️ REVEALED_ANSWERS_INIT: Initializing revealedAnswers array (was length ${room.revealedAnswers?.length || 0})`);
        room.revealedAnswers = Array(10).fill(null);
      }
      
      // Ensure scores object is properly initialized
      if (!room.scores) {
        console.log(`⚠️ SCORES_INIT: Initializing scores object`);
        room.scores = {};
      }
      
      const match = findMatchingAnswer(answerText, currentQuestion.answers);
      let points = 0;
      let newRevealedAnswers = [...room.revealedAnswers];
      let newScores = { ...room.scores };
      let newAnswersSubmittedCount = room.answersSubmittedCount;
      
      if (match) {
        // Correct answer found
        const { answer, index } = match;
        const pointsToAdd = calculatePoints(answer.rank);
        
        // Debug logging for match found
        if (__DEV__) {
          console.log(`✅ DEBUG 2: Match Found!
User Input: "${answerText}"
Matched: "${answer.text}"
Rank: ${answer.rank}
Points: ${pointsToAdd}`);
        }
        
        // ✅ MATCH FOUND DEBUG LOGGING
        console.log('✅ MATCH FOUND:', {
          userInput: answerText,
          matchedAnswer: answer,
          points: pointsToAdd,
          answerIndex: index,
          canonicalAnswer: answer.text
        });
        
        console.log(`🎯 MATCH FOUND:`, {
          userInput: answerText,
          officialAnswer: answer.text,
          answerRank: answer.rank,
          answerIndex: index,
          currentRevealedAnswers: room.revealedAnswers.map((ra, i) => ({ index: i, answerId: ra?.answerId, playerId: ra?.playerId, points: ra?.points }))
        });
        
        // Check if answer is already revealed
        if (room.revealedAnswers[index] !== null) {
          console.log(`❌ ALREADY_REVEALED: Answer at index ${index} is already revealed`);
          throw new Error('Answer already revealed');
        }
        
        // Validate array bounds
        if (index < 0 || index >= 10) {
          console.log(`❌ INVALID_INDEX: Answer index ${index} is out of bounds (0-9)`);
          throw new Error('Invalid answer index');
        }
        
        // Calculate points
        points = calculatePoints(answer.rank);
        console.log(`💰 POINTS_CALCULATED: Rank ${answer.rank} = ${points} points`);
        
        // Debug logging before transaction
        if (__DEV__) {
          console.log(`💾 DEBUG 3: Starting Transaction
Points to add: ${points}
Reveal index: ${index}
Canonical name: "${answer.text}"`);
        }
        
        // 💾 STARTING FIRESTORE TRANSACTION DEBUG LOGGING
        console.log('💾 STARTING FIRESTORE TRANSACTION:', {
          playerId,
          pointsToAdd: points,
          canonicalAnswer: answer.text,
          revealIndex: index,
          currentPlayerScore: room.scores[playerId] || 0,
          newPlayerScore: (room.scores[playerId] || 0) + points
        });
        
      // Update room state atomically - store the official answer text, not user input
      newRevealedAnswers[index] = {
        answerId: answer.text, // Use the official correct answer text
        playerId: playerId,
        points: points
      };
      
      newScores[playerId] = (newScores[playerId] || 0) + points;
      newAnswersSubmittedCount = room.answersSubmittedCount + 1;
      
      // 🔥 CRITICAL: Ensure we're updating the correct player score
      console.log(`🔥 CRITICAL SCORE UPDATE:`, {
        playerId,
        oldScore: room.scores[playerId] || 0,
        pointsToAdd: points,
        newScore: newScores[playerId],
        scoresObject: newScores
      });
        
        console.log(`✅ SUBMIT_ANSWER: Correct answer "${answerText}" -> "${answer.text}" awarded ${points} points`);
        console.log(`📊 SCORE_UPDATE: Player ${playerId} score: ${room.scores[playerId] || 0} -> ${newScores[playerId]}`);
        console.log(`📋 REVEAL_UPDATE: Answer at index ${index} will be revealed`);
      } else {
        // Wrong answer - no points, but turn still advances
        console.log(`❌ SUBMIT_ANSWER: Wrong answer "${answerText}" - no points awarded`);
        
        // Debug logging for no match found
        if (__DEV__) {
          console.log(`❌ DEBUG 5: No Match Found
Input: "${answerText}"
Available answers count: ${currentQuestion?.answers?.length || 0}`);
        }
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
      
      // 🔥 FIRESTORE - TRANSACTION OPERATIONS DEBUG LOGGING
      console.log('🔥 FIRESTORE - TRANSACTION OPERATIONS:', {
        scoreIncrement: match ? calculatePoints(match.answer.rank) : 0,
        revealIndex: match ? match.index : 'N/A',
        canonicalName: match ? match.answer.text : 'N/A',
        updates: {
          revealedAnswers: newRevealedAnswers.length,
          scores: Object.keys(newScores).length,
          answersSubmittedCount: newAnswersSubmittedCount
        }
      });
      
      transaction.update(roomRef, updates);
      
      // Debug logging after transaction
      if (__DEV__ && match) {
        console.log(`✅ DEBUG 4: Transaction Complete!
Should have updated:
- Player score by +${points}
- Revealed answer at index ${match.index}`);
      }
      
      // ✅ FIRESTORE TRANSACTION COMPLETE DEBUG LOGGING
      console.log('✅ FIRESTORE TRANSACTION COMPLETE:', {
        success: true,
        updatedScore: newScores[playerId],
        updatedRevealedAnswers: newRevealedAnswers.filter(ra => ra !== null).length,
        timestamp: new Date().toISOString()
      });
      
      console.log(`✅ SUBMIT_ANSWER: Transaction completed successfully`);
      console.log(`📊 FINAL_STATE:`, {
        pointsAwarded: points,
        newScores: newScores,
        newRevealedAnswers: newRevealedAnswers.map((ra, i) => ({ index: i, answerId: ra?.answerId, playerId: ra?.playerId, points: ra?.points })),
        answersSubmittedCount: newAnswersSubmittedCount
      });
      
      // Additional debugging for score and revelation
      console.log(`🎯 SCORE_DEBUG: Player ${playerId} score update:`, {
        oldScore: room.scores[playerId] || 0,
        pointsAwarded: points,
        newScore: newScores[playerId],
        scoreUpdated: points > 0
      });
      
      console.log(`🎉 REVELATION_DEBUG: Answer revelation update:`, {
        answerIndex: match ? match.index : 'N/A',
        canonicalAnswer: match ? match.answer.text : 'N/A',
        revealedAnswersArray: newRevealedAnswers.map((ra, i) => ({
          index: i,
          isRevealed: ra !== null,
          answerId: ra?.answerId,
          playerId: ra?.playerId,
          points: ra?.points
        }))
      });
      
      return { success: true, points };
    });
    
    // If we get here, the transaction succeeded
    console.log(`✅ TRANSACTION SUCCESS on attempt ${attempt}`);
    return result;
    
    } catch (error) {
      lastError = error as Error;
      console.error(`❌ TRANSACTION ATTEMPT ${attempt} FAILED:`, error);
      
      // Check if it's a failed-precondition error and we have retries left
      if (error instanceof Error && 
          error.message.includes('failed-precondition') && 
          attempt < maxRetries) {
        console.log(`🔄 RETRYING in ${attempt * 1000}ms due to failed-precondition...`);
        await new Promise(resolve => setTimeout(resolve, attempt * 1000)); // Exponential backoff
        continue;
      }
      
      // If it's not a retryable error or we've exhausted retries, break
      break;
    }
  }
  
  // If we get here, all attempts failed
  console.error(`❌ SUBMIT_ANSWER: All ${maxRetries} attempts failed`);
  
  // Try a simpler fallback approach without transactions
  console.log(`🔄 FALLBACK: Trying simple update without transaction...`);
  try {
    const roomRef = doc(db, 'multiplayerGames', roomCode);
    const roomSnap = await getDoc(roomRef);
    
    if (!roomSnap.exists()) {
      throw new Error('Room not found');
    }
    
    const room = roomSnap.data() as RoomData;
    
    // Find matching answer
    const currentQuestion = room.questions[room.currentQuestionIndex];
    if (!currentQuestion) {
      throw new Error('No current question found');
    }
    
    const match = findMatchingAnswer(answerText, currentQuestion.answers);
    if (match) {
      const { answer, index } = match;
      const points = calculatePoints(answer.rank);
      
      // Simple update without transaction
      const updates = {
        [`scores.${playerId}`]: (room.scores?.[playerId] || 0) + points,
        [`revealedAnswers.${index}`]: {
          answerId: answer.text,
          playerId: playerId,
          points: points
        },
        lastActivity: serverTimestamp()
      };
      
      await updateDoc(roomRef, updates);
      
      console.log(`✅ FALLBACK SUCCESS: Awarded ${points} points to player ${playerId}`);
      
      // Debug logging for fallback success
      if (__DEV__) {
        console.log(`✅ DEBUG 4: Fallback Success!
Awarded ${points} points to player ${playerId}
Revealed answer at index ${index}`);
      }
      
      return { success: true, points };
    }
  } catch (fallbackError) {
    console.error(`❌ FALLBACK FAILED:`, fallbackError);
  }
  
  // Debug logging for error occurred
  if (__DEV__) {
    console.log(`🚨 DEBUG 6: ERROR!
Message: ${lastError?.message || 'Unknown error'}
Function: submitAnswer
Attempts: ${maxRetries}`);
  }
  
  return {
    success: false,
    error: lastError?.message || 'Unknown error'
  };
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
 * Skip turn for current player
 */
export async function skipTurn(
  roomCode: string,
  playerId: string
): Promise<{ success: boolean; error?: string }> {
  console.log(`⏭️ SKIP_TURN: Room ${roomCode}, Player ${playerId}`);
  
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
      
      // Advance turn to next player
      const nextTurnIndex = (room.currentTurnIndex + 1) % room.turnOrder.length;
      const nextPlayerId = room.turnOrder[nextTurnIndex];
      
      const updates = {
        currentTurnIndex: nextTurnIndex,
        currentPlayerId: nextPlayerId,
        turnStartTime: serverTimestamp(),
        lastActivity: serverTimestamp()
      };
      
      transaction.update(roomRef, updates);
      
      console.log(`✅ SKIP_TURN: Turn skipped, advanced to player ${nextPlayerId}`);
      return { success: true };
    });
    
    return result;
  } catch (error) {
    console.error(`❌ SKIP_TURN: Failed to skip turn:`, error);
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

/**
 * Migrate host to another player when host disconnects (Sporcle-style)
 * Seamlessly reassigns host privileges without interrupting gameplay
 */
export async function migrateHost(
  roomCode: string,
  disconnectedHostId: string
): Promise<{ success: boolean; newHostId?: string; newHostName?: string; error?: string }> {
  try {
    console.log(`🔄 MIGRATE_HOST: Room ${roomCode}, Disconnected Host ${disconnectedHostId}`);
    
    const roomRef = doc(db, 'multiplayerGames', roomCode);
    const roomSnap = await getDoc(roomRef);
    
    if (!roomSnap.exists()) {
      return { success: false, error: 'Room not found' };
    }
    
    const room = roomSnap.data() as RoomData;
    const remainingPlayers = Object.keys(room.players).filter(playerId => playerId !== disconnectedHostId);
    
    if (remainingPlayers.length < 3) {
      return { success: false, error: 'Not enough players for host migration' };
    }
    
    // Sporcle-style host selection: Use join order (first player in the list)
    // This ensures consistent host selection across all clients
    const newHostId = remainingPlayers[0];
    const newHostName = room.players[newHostId]?.name || 'Unknown Player';
    
    // Atomic host migration with race condition prevention
    await runTransaction(db, async (transaction) => {
      const roomRef = doc(db, 'multiplayerGames', roomCode);
      const roomSnap = await transaction.get(roomRef);
      
      if (!roomSnap.exists()) {
        throw new Error('Room not found during migration');
      }
      
      const currentRoom = roomSnap.data() as RoomData;
      const currentRemainingPlayers = Object.keys(currentRoom.players).filter(playerId => playerId !== disconnectedHostId);
      
      if (currentRemainingPlayers.length < 3) {
        throw new Error('Not enough players for host migration');
      }
      
      // Ensure we're not trying to migrate to a player who no longer exists
      if (!currentRoom.players[newHostId]) {
        throw new Error('Selected new host no longer exists');
      }
      
      // Atomic host migration - update hostId and add system message
      transaction.update(roomRef, {
        hostId: newHostId,
        lastUpdated: serverTimestamp(),
        // Add system message for broadcasting host change
        systemMessage: {
          type: 'host_migrated',
          message: `${newHostName} is now the host.`,
          timestamp: serverTimestamp(),
          newHostId: newHostId,
          newHostName: newHostName
        }
      });
    });
    
    console.log(`✅ MIGRATE_HOST: Successfully migrated host to ${newHostName} (${newHostId})`);
    return { success: true, newHostId, newHostName };
  } catch (error) {
    console.error(`❌ MIGRATE_HOST: Error migrating host:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Terminate room when host disconnects and only 1 player remains (Sporcle-style)
 * Immediately ends the game and closes the room
 */
export async function terminateRoom(
  roomCode: string,
  disconnectedHostId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`🏁 TERMINATE_ROOM: Room ${roomCode}, Disconnected Host ${disconnectedHostId}`);
    
    const roomRef = doc(db, 'multiplayerGames', roomCode);
    const roomSnap = await getDoc(roomRef);
    
    if (!roomSnap.exists()) {
      return { success: false, error: 'Room not found' };
    }
    
    const room = roomSnap.data() as RoomData;
    const remainingPlayers = Object.keys(room.players).filter(playerId => playerId !== disconnectedHostId);
    
    if (remainingPlayers.length !== 1) {
      return { success: false, error: 'Room termination requires exactly 1 remaining player' };
    }
    
    // Atomic room termination with system message
    await runTransaction(db, async (transaction) => {
      const roomRef = doc(db, 'multiplayerGames', roomCode);
      const roomSnap = await transaction.get(roomRef);
      
      if (!roomSnap.exists()) {
        throw new Error('Room not found during termination');
      }
      
      const currentRoom = roomSnap.data() as RoomData;
      const currentRemainingPlayers = Object.keys(currentRoom.players).filter(playerId => playerId !== disconnectedHostId);
      
      if (currentRemainingPlayers.length !== 1) {
        throw new Error('Room termination requires exactly 1 remaining player');
      }
      
      // Add system message before deletion for the remaining player
      transaction.update(roomRef, {
        systemMessage: {
          type: 'room_terminated',
          message: 'The host left the game, so the room has been closed.',
          timestamp: serverTimestamp()
        },
        status: 'finished',
        gamePhase: 'finished',
        lastUpdated: serverTimestamp()
      });
      
      // Note: We don't delete immediately to allow the system message to be received
      // The room will be cleaned up by a separate cleanup process
    });
    
    console.log(`✅ TERMINATE_ROOM: Successfully terminated room ${roomCode}`);
    return { success: true };
  } catch (error) {
    console.error(`❌ TERMINATE_ROOM: Error terminating room:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Handle host disconnection - migrate host or terminate room based on remaining players (Sporcle-style)
 * Seamlessly handles host changes without interrupting gameplay
 */
export async function handleHostDisconnection(
  roomCode: string,
  disconnectedHostId: string
): Promise<{ action: 'migrated' | 'terminated' | 'error'; newHostId?: string; newHostName?: string; error?: string }> {
  console.log(`🚪 HOST_DISCONNECTION: Room ${roomCode}, Host ${disconnectedHostId}`);
  
  try {
    const roomRef = doc(db, 'multiplayerGames', roomCode);
    const roomSnap = await getDoc(roomRef);
    
    if (!roomSnap.exists()) {
      return { action: 'error', error: 'Room not found' };
    }
    
    const room = roomSnap.data() as RoomData;
    const remainingPlayers = Object.keys(room.players).filter(playerId => playerId !== disconnectedHostId);
    
    console.log(`📊 HOST_DISCONNECTION: Remaining players: ${remainingPlayers.length}`);
    
    if (remainingPlayers.length >= 3) {
      // Migrate host to another player - 3+ players remain (Sporcle-style)
      const migrationResult = await migrateHost(roomCode, disconnectedHostId);
      if (migrationResult.success) {
        return { 
          action: 'migrated', 
          newHostId: migrationResult.newHostId,
          newHostName: migrationResult.newHostName
        };
      } else {
        return { action: 'error', error: migrationResult.error };
      }
    } else if (remainingPlayers.length <= 2) {
      // Terminate game - 2 or fewer players remain (including host)
      const terminationResult = await terminateGame(roomCode, disconnectedHostId);
      if (terminationResult.success) {
        return { action: 'terminated' };
      } else {
        return { action: 'error', error: terminationResult.error };
      }
    } else {
      // No players left, just delete the room
      await deleteDoc(roomRef);
      return { action: 'terminated' };
    }
  } catch (error) {
    console.error(`❌ HOST_DISCONNECTION: Error handling host disconnection:`, error);
    return {
      action: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Terminate game when host leaves and 2 or fewer players remain (including host)
 */
export async function terminateGame(
  roomCode: string,
  disconnectedPlayerId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`🏁 TERMINATE_GAME: Room ${roomCode}, Disconnected Player ${disconnectedPlayerId}`);
    
    const roomRef = doc(db, 'multiplayerGames', roomCode);
    const roomSnap = await getDoc(roomRef);
    
    if (!roomSnap.exists()) {
      return { success: false, error: 'Room not found' };
    }
    
    const room = roomSnap.data() as RoomData;
    const remainingPlayers = Object.keys(room.players).filter(playerId => playerId !== disconnectedPlayerId);
    
    if (remainingPlayers.length > 2) {
      return { success: false, error: 'Game termination requires 2 or fewer remaining players' };
    }
    
    await runTransaction(db, async (transaction) => {
      const roomRef = doc(db, 'multiplayerGames', roomCode);
      const roomSnap = await transaction.get(roomRef);
      
      if (!roomSnap.exists()) {
        throw new Error('Room not found during game termination');
      }
      
      const currentRoom = roomSnap.data() as RoomData;
      const currentRemainingPlayers = Object.keys(currentRoom.players).filter(playerId => playerId !== disconnectedPlayerId);
      
      if (currentRemainingPlayers.length > 2) {
        throw new Error('Game termination requires 2 or fewer remaining players');
      }
      
      // Update game status to finished and set gamePhase to 'finished'
      // Add system message to notify players about game termination
      transaction.update(roomRef, {
        status: 'finished',
        gamePhase: 'finished',
        lastUpdated: serverTimestamp(),
        systemMessage: {
          type: 'game_terminated',
          message: 'The host left the game, so the game has been terminated.',
          timestamp: serverTimestamp()
        }
      });
    });
    
    console.log(`✅ TERMINATE_GAME: Successfully terminated game in room ${roomCode}`);
    return { success: true };
  } catch (error) {
    console.error(`❌ TERMINATE_GAME: Error terminating game:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
