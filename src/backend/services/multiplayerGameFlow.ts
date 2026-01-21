/**
 * Clean Multiplayer Game Flow Implementation
 * Based on the user's requirements for turn-based multiplayer system
 */

import { runTransaction, doc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import { RoomData } from '../../shared/types/game';
import { logger } from '../utils/logger';
import { AppError, toAppError } from '../../shared/errors';
import { COLLECTIONS } from '../utils/constants';

const getTurnStartMillis = (turnStartTime?: RoomData['turnStartTime']): number => {
  if (typeof turnStartTime === 'number') {
    return turnStartTime;
  }
  if (turnStartTime instanceof Timestamp) {
    return turnStartTime.toMillis();
  }
  return 0;
};

/**
 * Start the game - transitions from lobby to playing
 * Only the host can start the game
 */
export async function startGame(
  roomCode: string,
  hostId: string
): Promise<{ success: boolean; error?: string }> {
  logger.log(`🎮 START_GAME: Room ${roomCode}, Host ${hostId}`);
  
  try {
    const result = await runTransaction(db, async (transaction) => {
      const roomRef = doc(db, COLLECTIONS.MULTIPLAYER_GAMES, roomCode);
      const roomSnap = await transaction.get(roomRef);
      
      if (!roomSnap.exists()) {
        throw new AppError({
          code: 'MP_ROOM_NOT_FOUND',
          message: 'Room not found',
          userMessage: 'Room not found.'
        });
      }
      
      const roomData = roomSnap.data() as RoomData;
      
      // Verify host
      if (roomData.hostId !== hostId) {
        throw new AppError({
          code: 'MP_HOST_ONLY',
          message: 'Only the host can start the game',
          userMessage: 'Only the host can start the game.'
        });
      }
      
      // Check if room is in lobby state
      if (roomData.status !== 'lobby') {
        throw new AppError({
          code: 'MP_ROOM_INVALID_STATE',
          message: `Room is not in lobby state (current: ${roomData.status})`,
          userMessage: 'Room is not ready to start.'
        });
      }
      
      // Check minimum players
      const playerIds = Object.keys(roomData.players);
      if (playerIds.length < 1) {
        throw new AppError({
          code: 'MP_NO_PLAYERS',
          message: 'Need at least 1 player to start',
          userMessage: 'Need at least 1 player to start.'
        });
      }
      
      // Validate questions
      if (!roomData.questions || roomData.questions.length === 0) {
        throw new AppError({
          code: 'MP_NO_QUESTIONS',
          message: 'No questions available',
          userMessage: 'No questions available.'
        });
      }
      
      // Get first question
      const firstQuestion = roomData.questions[0];
      if (!firstQuestion) {
        throw new AppError({
          code: 'MP_QUESTION_NOT_FOUND',
          message: 'First question not found',
          userMessage: 'First question not found.'
        });
      }
      
      // Create turn order (simple alphabetical for now)
      const turnOrder = playerIds.sort();
      
      // Start the game with first player's turn
      const updates = {
        status: 'playing' as const,
        gamePhase: 'question' as const,
        currentQuestionIndex: 0,
        currentAnswers: firstQuestion.answers,
        revealedAnswers: [],
        answerOwners: {},
        playerSubmissions: {},
        // Initialize turn system
        currentPlayerId: turnOrder[0],
        turnStartTime: serverTimestamp(),
        turnTimeLimit: 60, // 60 seconds per turn
        turnOrder: turnOrder,
        currentTurnIndex: 0,
        lastActivity: serverTimestamp()
      };
      
      transaction.update(roomRef, updates);
      
      logger.log(`✅ START_GAME: Game started, first player: ${turnOrder[0]}`);
      return { success: true };
    });
    
    return result;
  } catch (error) {
    logger.error(`❌ START_GAME: Failed to start game:`, error);
    const appError = toAppError(error, {
      code: 'MP_START_GAME_FAILED',
      message: 'Failed to start game',
      userMessage: 'Failed to start game.'
    });
    return {
      success: false,
      error: appError.message
    };
  }
}

/**
 * Submit answer for current player's turn
 * Only the current player can submit answers
 */
export async function submitAnswer(
  roomCode: string,
  playerId: string,
  answer: string
): Promise<{ success: boolean; error?: string }> {
  logger.log(`📝 SUBMIT_ANSWER: Room ${roomCode}, Player ${playerId}, Answer: "${answer}"`);
  
  try {
    const result = await runTransaction(db, async (transaction) => {
      const roomRef = doc(db, COLLECTIONS.MULTIPLAYER_GAMES, roomCode);
      const roomSnap = await transaction.get(roomRef);
      
      if (!roomSnap.exists()) {
        throw new AppError({
          code: 'MP_ROOM_NOT_FOUND',
          message: 'Room not found',
          userMessage: 'Room not found.'
        });
      }
      
      const roomData = roomSnap.data() as RoomData;
      
      // Verify it's the current player's turn
      if (roomData.currentPlayerId !== playerId) {
        throw new AppError({
          code: 'MP_NOT_YOUR_TURN',
          message: 'Not your turn',
          userMessage: 'It is not your turn.'
        });
      }
      
      // Check if game is in question phase
      if (roomData.gamePhase !== 'question') {
        throw new AppError({
          code: 'MP_INVALID_PHASE',
          message: 'Cannot submit answers at this time',
          userMessage: 'You cannot submit answers right now.'
        });
      }
      
      // Calculate points for the answer
      let points = 0;
      const correctAnswer = roomData.currentAnswers.find(a => 
        a.text.toLowerCase() === answer.toLowerCase() || 
        a.aliases?.some(alias => alias.toLowerCase() === answer.toLowerCase())
      );
      
      if (correctAnswer) {
        points = correctAnswer.rank <= 10 ? correctAnswer.rank : 0;
      }
      
      // Update player submission and score
      const playerSubmissions = {
        ...roomData.playerSubmissions,
        [playerId]: {
          answers: [answer],
          submittedAt: Date.now(),
          points: points
        }
      };
      
      const updatedPlayers = {
        ...roomData.players,
        [playerId]: {
          ...roomData.players[playerId],
          score: roomData.players[playerId].score + points
        }
      };
      
      // Advance to next turn or next question
      const nextTurnIndex = (roomData.currentTurnIndex + 1) % roomData.turnOrder.length;
      const nextPlayerId = roomData.turnOrder[nextTurnIndex];
      
      if (nextTurnIndex === 0) {
        // All players have had their turn - move to next question
        const nextQuestionIndex = roomData.currentQuestionIndex + 1;
        const totalQuestions = roomData.questions.length;
        
        if (nextQuestionIndex >= totalQuestions) {
          // Game finished
          const updates = {
            playerSubmissions,
            players: updatedPlayers,
            status: 'finished' as const,
            gamePhase: 'finished' as const,
            lastActivity: serverTimestamp()
          };
          
          transaction.update(roomRef, updates);
          logger.log(`🏁 SUBMIT_ANSWER: Game finished - all questions completed`);
        } else {
          // Move to next question
          const nextQuestion = roomData.questions[nextQuestionIndex];
          const updates = {
            playerSubmissions,
            players: updatedPlayers,
            currentQuestionIndex: nextQuestionIndex,
            currentAnswers: nextQuestion.answers,
            revealedAnswers: [],
            answerOwners: {},
            // Reset turn system for new question
            currentPlayerId: roomData.turnOrder[0],
            turnStartTime: serverTimestamp(),
            currentTurnIndex: 0,
            lastActivity: serverTimestamp()
          };
          
          transaction.update(roomRef, updates);
          logger.log(`✅ SUBMIT_ANSWER: Moved to question ${nextQuestionIndex}`);
        }
      } else {
        // Continue with next player
        const updates = {
          playerSubmissions,
          players: updatedPlayers,
          currentPlayerId: nextPlayerId,
          turnStartTime: serverTimestamp(),
          currentTurnIndex: nextTurnIndex,
          lastActivity: serverTimestamp()
        };
        
        transaction.update(roomRef, updates);
        logger.log(`✅ SUBMIT_ANSWER: Turn advanced to player ${nextPlayerId}`);
      }
      
      return { success: true };
    });
    
    return result;
  } catch (error) {
    logger.error(`❌ SUBMIT_ANSWER: Failed to submit answer:`, error);
    const appError = toAppError(error, {
      code: 'MP_SUBMIT_FAILED',
      message: 'Failed to submit answer',
      userMessage: 'Failed to submit answer.'
    });
    return {
      success: false,
      error: appError.message
    };
  }
}

/**
 * End the game (host only)
 * Immediately ends the game and kicks all players
 */
export async function endGame(
  roomCode: string,
  hostId: string
): Promise<{ success: boolean; error?: string }> {
  logger.log(`🏁 END_GAME: Room ${roomCode}, Host ${hostId}`);
  
  try {
    const result = await runTransaction(db, async (transaction) => {
      const roomRef = doc(db, COLLECTIONS.MULTIPLAYER_GAMES, roomCode);
      const roomSnap = await transaction.get(roomRef);
      
      if (!roomSnap.exists()) {
        throw new AppError({
          code: 'MP_ROOM_NOT_FOUND',
          message: 'Room not found',
          userMessage: 'Room not found.'
        });
      }
      
      const roomData = roomSnap.data() as RoomData;
      
      // Verify host
      if (roomData.hostId !== hostId) {
        throw new AppError({
          code: 'MP_HOST_ONLY',
          message: 'Only the host can end the game',
          userMessage: 'Only the host can end the game.'
        });
      }
      
      // End the game
      const updates = {
        status: 'finished' as const,
        gamePhase: 'finished' as const,
        lastActivity: serverTimestamp()
      };
      
      transaction.update(roomRef, updates);
      
      logger.log(`✅ END_GAME: Game ended by host`);
      return { success: true };
    });
    
    return result;
  } catch (error) {
    logger.error(`❌ END_GAME: Failed to end game:`, error);
    const appError = toAppError(error, {
      code: 'MP_END_GAME_FAILED',
      message: 'Failed to end game',
      userMessage: 'Failed to end game.'
    });
    return {
      success: false,
      error: appError.message
    };
  }
}

/**
 * Advance turn when timer expires
 * Can be called by any client when turn timeout is detected
 */
export async function advanceTurnOnTimeout(
  roomCode: string,
  callingPlayerId: string
): Promise<{ success: boolean; error?: string }> {
  logger.log(`⏰ ADVANCE_TURN_TIMEOUT: Room ${roomCode}, Calling Player ${callingPlayerId}`);
  
  try {
    const result = await runTransaction(db, async (transaction) => {
      const roomRef = doc(db, COLLECTIONS.MULTIPLAYER_GAMES, roomCode);
      const roomSnap = await transaction.get(roomRef);
      
      if (!roomSnap.exists()) {
        throw new AppError({
          code: 'MP_ROOM_NOT_FOUND',
          message: 'Room not found',
          userMessage: 'Room not found.'
        });
      }
      
      const roomData = roomSnap.data() as RoomData;
      
      // Check if turn has actually expired
      const now = Date.now();
      const turnStartTime = getTurnStartMillis(roomData.turnStartTime);
      
      const turnExpired = turnStartTime > 0 && (now - turnStartTime) > (roomData.turnTimeLimit || 60) * 1000;
      
      if (!turnExpired) {
        throw new AppError({
          code: 'MP_TURN_NOT_EXPIRED',
          message: 'Turn has not expired yet',
          userMessage: 'Turn has not expired yet.'
        });
      }
      
      // Advance to next turn or next question
      const nextTurnIndex = (roomData.currentTurnIndex + 1) % roomData.turnOrder.length;
      const nextPlayerId = roomData.turnOrder[nextTurnIndex];
      
      if (nextTurnIndex === 0) {
        // All players have had their turn - move to next question
        const nextQuestionIndex = roomData.currentQuestionIndex + 1;
        const totalQuestions = roomData.questions.length;
        
        if (nextQuestionIndex >= totalQuestions) {
          // Game finished
          const updates = {
            status: 'finished' as const,
            gamePhase: 'finished' as const,
            lastActivity: serverTimestamp()
          };
          
          transaction.update(roomRef, updates);
          logger.log(`🏁 ADVANCE_TURN_TIMEOUT: Game finished - all questions completed`);
        } else {
          // Move to next question
          const nextQuestion = roomData.questions[nextQuestionIndex];
          const updates = {
            currentQuestionIndex: nextQuestionIndex,
            currentAnswers: nextQuestion.answers,
            revealedAnswers: [],
            answerOwners: {},
            // Reset turn system for new question
            currentPlayerId: roomData.turnOrder[0],
            turnStartTime: serverTimestamp(),
            currentTurnIndex: 0,
            lastActivity: serverTimestamp()
          };
          
          transaction.update(roomRef, updates);
          logger.log(`✅ ADVANCE_TURN_TIMEOUT: Moved to question ${nextQuestionIndex}`);
        }
      } else {
        // Continue with next player
        const updates = {
          currentPlayerId: nextPlayerId,
          turnStartTime: serverTimestamp(),
          currentTurnIndex: nextTurnIndex,
          lastActivity: serverTimestamp()
        };
        
        transaction.update(roomRef, updates);
        logger.log(`✅ ADVANCE_TURN_TIMEOUT: Turn advanced to player ${nextPlayerId}`);
      }
      
      return { success: true };
    });
    
    return result;
  } catch (error) {
    logger.error(`❌ ADVANCE_TURN_TIMEOUT: Failed to advance turn:`, error);
    const appError = toAppError(error, {
      code: 'MP_ADVANCE_TURN_FAILED',
      message: 'Failed to advance turn',
      userMessage: 'Failed to advance turn.'
    });
    return {
      success: false,
      error: appError.message
    };
  }
}
