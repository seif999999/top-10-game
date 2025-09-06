/**
 * Clean Multiplayer Game Flow Implementation
 * Based on the user's requirements for turn-based multiplayer system
 */

import { runTransaction, doc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { RoomData } from '../types/game';

/**
 * Start the game - transitions from lobby to playing
 * Only the host can start the game
 */
export async function startGame(
  roomCode: string,
  hostId: string
): Promise<{ success: boolean; error?: string }> {
  console.log(`🎮 START_GAME: Room ${roomCode}, Host ${hostId}`);
  
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
        throw new Error('Only the host can start the game');
      }
      
      // Check if room is in lobby state
      if (roomData.status !== 'lobby') {
        throw new Error(`Room is not in lobby state (current: ${roomData.status})`);
      }
      
      // Check minimum players
      const playerIds = Object.keys(roomData.players);
      if (playerIds.length < 1) {
        throw new Error('Need at least 1 player to start');
      }
      
      // Validate questions
      if (!roomData.questions || roomData.questions.length === 0) {
        throw new Error('No questions available');
      }
      
      // Get first question
      const firstQuestion = roomData.questions[0];
      if (!firstQuestion) {
        throw new Error('First question not found');
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
      
      console.log(`✅ START_GAME: Game started, first player: ${turnOrder[0]}`);
      return { success: true };
    });
    
    return result;
  } catch (error) {
    console.error(`❌ START_GAME: Failed to start game:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
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
  console.log(`📝 SUBMIT_ANSWER: Room ${roomCode}, Player ${playerId}, Answer: "${answer}"`);
  
  try {
    const result = await runTransaction(db, async (transaction) => {
      const roomRef = doc(db, 'multiplayerGames', roomCode);
      const roomSnap = await transaction.get(roomRef);
      
      if (!roomSnap.exists()) {
        throw new Error('Room not found');
      }
      
      const roomData = roomSnap.data() as RoomData;
      
      // Verify it's the current player's turn
      if (roomData.currentPlayerId !== playerId) {
        throw new Error('Not your turn');
      }
      
      // Check if game is in question phase
      if (roomData.gamePhase !== 'question') {
        throw new Error('Cannot submit answers at this time');
      }
      
      // Calculate points for the answer
      let points = 0;
      const correctAnswer = roomData.currentAnswers.find(a => 
        a.text.toLowerCase() === answer.toLowerCase() || 
        a.aliases?.some(alias => alias.toLowerCase() === answer.toLowerCase())
      );
      
      if (correctAnswer) {
        points = correctAnswer.rank <= 10 ? (11 - correctAnswer.rank) * 10 : 0;
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
          console.log(`🏁 SUBMIT_ANSWER: Game finished - all questions completed`);
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
          console.log(`✅ SUBMIT_ANSWER: Moved to question ${nextQuestionIndex}`);
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
        console.log(`✅ SUBMIT_ANSWER: Turn advanced to player ${nextPlayerId}`);
      }
      
      return { success: true };
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
 * End the game (host only)
 * Immediately ends the game and kicks all players
 */
export async function endGame(
  roomCode: string,
  hostId: string
): Promise<{ success: boolean; error?: string }> {
  console.log(`🏁 END_GAME: Room ${roomCode}, Host ${hostId}`);
  
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
        throw new Error('Only the host can end the game');
      }
      
      // End the game
      const updates = {
        status: 'finished' as const,
        gamePhase: 'finished' as const,
        lastActivity: serverTimestamp()
      };
      
      transaction.update(roomRef, updates);
      
      console.log(`✅ END_GAME: Game ended by host`);
      return { success: true };
    });
    
    return result;
  } catch (error) {
    console.error(`❌ END_GAME: Failed to end game:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
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
  console.log(`⏰ ADVANCE_TURN_TIMEOUT: Room ${roomCode}, Calling Player ${callingPlayerId}`);
  
  try {
    const result = await runTransaction(db, async (transaction) => {
      const roomRef = doc(db, 'multiplayerGames', roomCode);
      const roomSnap = await transaction.get(roomRef);
      
      if (!roomSnap.exists()) {
        throw new Error('Room not found');
      }
      
      const roomData = roomSnap.data() as RoomData;
      
      // Check if turn has actually expired
      const now = Date.now();
      const turnStartTime = typeof roomData.turnStartTime === 'object' && roomData.turnStartTime && 'seconds' in roomData.turnStartTime
        ? (roomData.turnStartTime as any).seconds * 1000
        : typeof roomData.turnStartTime === 'number'
        ? roomData.turnStartTime
        : 0;
      
      const turnExpired = turnStartTime > 0 && (now - turnStartTime) > (roomData.turnTimeLimit || 60) * 1000;
      
      if (!turnExpired) {
        throw new Error('Turn has not expired yet');
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
          console.log(`🏁 ADVANCE_TURN_TIMEOUT: Game finished - all questions completed`);
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
          console.log(`✅ ADVANCE_TURN_TIMEOUT: Moved to question ${nextQuestionIndex}`);
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
        console.log(`✅ ADVANCE_TURN_TIMEOUT: Turn advanced to player ${nextPlayerId}`);
      }
      
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
