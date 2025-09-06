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
      if (roomData.revealedAnswers?.some(ra => ra && ra.answerId === answerText)) {
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
 * Host starts the game atomically - transitions from lobby to playing and starts first round
 * This is the single source of truth for game start
 */
export async function hostStartGame(
  roomCode: string,
  hostId: string,
  timeLimit: number = 60
): Promise<{ success: boolean; error?: string }> {
  console.log(`🎮 HOST_START_GAME: Room ${roomCode}, Host ${hostId}, TimeLimit ${timeLimit}s`);
  
  try {
    const result = await runTransaction(db, async (transaction) => {
      const roomRef = doc(db, 'multiplayerGames', roomCode);
      const roomSnap = await transaction.get(roomRef);
      
      if (!roomSnap.exists()) {
        throw new Error('Room not found');
      }
      
      const roomData = roomSnap.data() as RoomData;
      console.log(`🔍 HOST_START_GAME: Current room status: ${roomData.status}, hostId: ${roomData.hostId}`);
      
      // Verify host
      if (roomData.hostId !== hostId) {
        throw new Error('Only the host can start the game');
      }
      
      // Check if room is in lobby state
      if (roomData.status !== 'lobby') {
        throw new Error(`Room is not in lobby state (current: ${roomData.status})`);
      }
      
      // Check minimum players
      if (Object.keys(roomData.players).length < 1) {
        throw new Error('Need at least 1 player to start');
      }
      
      // Validate questions array
      if (!roomData.questions || roomData.questions.length === 0) {
        throw new Error('No questions available. Please select questions before starting the game.');
      }
      
      // Get first question
      const currentQuestion = roomData.questions[0];
      if (!currentQuestion) {
        throw new Error('First question not found');
      }
      
      // Create turn order from player IDs
      const playerIds = Object.keys(roomData.players);
      const turnOrder = playerIds.sort(); // Simple alphabetical order, can be randomized later
      
      // Atomic transition: lobby -> playing + start first round + initialize turns
      const updates = {
        status: 'playing' as const,
        gamePhase: 'question' as const,
        currentQuestionIndex: 0,
        questionStartTime: serverTimestamp(),
        questionTimeLimit: timeLimit,
        roundStartTs: serverTimestamp(),
        roundDurationSeconds: timeLimit,
        currentAnswers: currentQuestion.answers,
        revealedAnswers: [],
        answerOwners: {},
        playerSubmissions: {},
        lastActivity: serverTimestamp(),
        startedAt: serverTimestamp(),
        startedBy: hostId,
        // Initialize turn system
        currentPlayerId: turnOrder[0], // First player starts
        turnStartTime: serverTimestamp(),
        turnTimeLimit: 60, // 60 seconds per turn
        turnOrder: turnOrder,
        currentTurnIndex: 0
      };
      
      transaction.update(roomRef, updates);
      
      console.log(`✅ HOST_START_GAME: Game started in room ${roomCode}, status: lobby -> playing`);
      
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
 * Start a new round atomically (for subsequent rounds)
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
 * Advance to next player's turn atomically
 * Called when current player submits answer or turn times out
 */
export async function advanceTurn(
  roomCode: string,
  playerId: string
): Promise<{ success: boolean; error?: string }> {
  console.log(`🔄 ADVANCE_TURN: Room ${roomCode}, Player ${playerId}`);
  
  try {
    const result = await runTransaction(db, async (transaction) => {
      const roomRef = doc(db, 'multiplayerGames', roomCode);
      const roomSnap = await transaction.get(roomRef);
      
      if (!roomSnap.exists()) {
        throw new Error('Room not found');
      }
      
      const roomData = roomSnap.data() as RoomData;
      
      // Verify it's the current player's turn or allow if turn has expired
      const now = Date.now();
      const turnStartTime = typeof roomData.turnStartTime === 'object' && roomData.turnStartTime && 'seconds' in roomData.turnStartTime
        ? (roomData.turnStartTime as any).seconds * 1000
        : typeof roomData.turnStartTime === 'number'
        ? roomData.turnStartTime
        : 0;
      
      const turnExpired = turnStartTime > 0 && (now - turnStartTime) > (roomData.turnTimeLimit || 60) * 1000;
      
      if (roomData.currentPlayerId !== playerId && !turnExpired) {
        throw new Error('Not your turn');
      }
      
      // Check if we've completed a full round of turns
      const nextTurnIndex = (roomData.currentTurnIndex + 1) % roomData.turnOrder.length;
      const nextPlayerId = roomData.turnOrder[nextTurnIndex];
      
      // If we're back to the first player, we've completed a full round
      if (nextTurnIndex === 0) {
        // All players have had their turn for this question
        // Move to next question or end game
        const nextQuestionIndex = (roomData.currentQuestionIndex || 0) + 1;
        const totalQuestions = roomData.questions?.length || 0;
        
        if (nextQuestionIndex >= totalQuestions) {
          // Game finished - all questions completed
          const updates = {
            status: 'finished' as const,
            gamePhase: 'finished' as const,
            lastActivity: serverTimestamp()
          };
          
          transaction.update(roomRef, updates);
          console.log(`🏁 ADVANCE_TURN: Game finished - all questions completed`);
        } else {
          // Move to next question and reset turn system
          const nextQuestion = roomData.questions?.[nextQuestionIndex];
          if (nextQuestion) {
            const updates = {
              currentQuestionIndex: nextQuestionIndex,
              gamePhase: 'question' as const,
              questionStartTime: serverTimestamp(),
              roundStartTs: serverTimestamp(),
              currentAnswers: nextQuestion.answers,
              revealedAnswers: [],
              answerOwners: {},
              playerSubmissions: {},
              // Reset turn system for new question
              currentPlayerId: roomData.turnOrder[0], // Start with first player
              turnStartTime: serverTimestamp(),
              currentTurnIndex: 0,
              lastActivity: serverTimestamp()
            };
            
            transaction.update(roomRef, updates);
            console.log(`✅ ADVANCE_TURN: Moved to question ${nextQuestionIndex}, reset turn system`);
          }
        }
      } else {
        // Continue with next player in current question
        const updates = {
          currentPlayerId: nextPlayerId,
          turnStartTime: serverTimestamp(),
          currentTurnIndex: nextTurnIndex,
          lastActivity: serverTimestamp()
        };
        
        transaction.update(roomRef, updates);
        console.log(`✅ ADVANCE_TURN: Turn advanced to player ${nextPlayerId} (index ${nextTurnIndex})`);
      }
      
      return { success: true };
    });
    
    return result;
  } catch (error) {
    console.error(`❌ ADVANCE_TURN: Failed to advance turn:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Force advance turn when current player's turn has expired
 * Can be called by any client when turn timeout is detected
 */
export async function forceAdvanceExpiredTurn(
  roomCode: string,
  callingPlayerId: string
): Promise<{ success: boolean; error?: string }> {
  console.log(`🔄 FORCE_ADVANCE_EXPIRED_TURN: Room ${roomCode}, Calling Player ${callingPlayerId}`);
  
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
      
      // Check if we've completed a full round of turns
      const nextTurnIndex = (roomData.currentTurnIndex + 1) % roomData.turnOrder.length;
      const nextPlayerId = roomData.turnOrder[nextTurnIndex];
      
      // If we're back to the first player, we've completed a full round
      if (nextTurnIndex === 0) {
        // All players have had their turn for this question
        // Move to next question or end game
        const nextQuestionIndex = (roomData.currentQuestionIndex || 0) + 1;
        const totalQuestions = roomData.questions?.length || 0;
        
        if (nextQuestionIndex >= totalQuestions) {
          // Game finished - all questions completed
          const updates = {
            status: 'finished' as const,
            gamePhase: 'finished' as const,
            lastActivity: serverTimestamp()
          };
          
          transaction.update(roomRef, updates);
          console.log(`🏁 FORCE_ADVANCE_EXPIRED_TURN: Game finished - all questions completed`);
        } else {
          // Move to next question and reset turn system
          const nextQuestion = roomData.questions?.[nextQuestionIndex];
          if (nextQuestion) {
            const updates = {
              currentQuestionIndex: nextQuestionIndex,
              gamePhase: 'question' as const,
              questionStartTime: serverTimestamp(),
              roundStartTs: serverTimestamp(),
              currentAnswers: nextQuestion.answers,
              revealedAnswers: [],
              answerOwners: {},
              playerSubmissions: {},
              // Reset turn system for new question
              currentPlayerId: roomData.turnOrder[0], // Start with first player
              turnStartTime: serverTimestamp(),
              currentTurnIndex: 0,
              lastActivity: serverTimestamp()
            };
            
            transaction.update(roomRef, updates);
            console.log(`✅ FORCE_ADVANCE_EXPIRED_TURN: Moved to question ${nextQuestionIndex}, reset turn system`);
          }
        }
      } else {
        // Continue with next player in current question
        const updates = {
          currentPlayerId: nextPlayerId,
          turnStartTime: serverTimestamp(),
          currentTurnIndex: nextTurnIndex,
          lastActivity: serverTimestamp()
        };
        
        transaction.update(roomRef, updates);
        console.log(`✅ FORCE_ADVANCE_EXPIRED_TURN: Turn advanced to player ${nextPlayerId} (index ${nextTurnIndex})`);
      }
      
      return { success: true };
    });
    
    return result;
  } catch (error) {
    console.error(`❌ FORCE_ADVANCE_EXPIRED_TURN: Failed to advance expired turn:`, error);
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
export async function submitTurnAnswer(
  roomCode: string,
  playerId: string,
  answers: string[]
): Promise<{ success: boolean; error?: string }> {
  console.log(`📝 SUBMIT_TURN_ANSWER: Room ${roomCode}, Player ${playerId}, Answers: ${answers.length}`);
  
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
      
      // Calculate points for submitted answers
      let totalPoints = 0;
      answers.forEach((answer, index) => {
        const correctAnswer = roomData.currentAnswers.find(a => 
          a.text.toLowerCase() === answer.toLowerCase() || 
          a.aliases?.some(alias => alias.toLowerCase() === answer.toLowerCase())
        );
        if (correctAnswer) {
          totalPoints += correctAnswer.rank <= 10 ? (11 - correctAnswer.rank) * 10 : 0;
        }
      });
      
      // Update player submission
      const playerSubmissions = {
        ...roomData.playerSubmissions,
        [playerId]: {
          answers: answers,
          submittedAt: Date.now(),
          points: totalPoints
        }
      };
      
      // Update player score
      const updatedPlayers = {
        ...roomData.players,
        [playerId]: {
          ...roomData.players[playerId],
          score: roomData.players[playerId].score + totalPoints
        }
      };
      
      // Advance to next turn
      const nextTurnIndex = (roomData.currentTurnIndex + 1) % roomData.turnOrder.length;
      const nextPlayerId = roomData.turnOrder[nextTurnIndex];
      
      const updates = {
        playerSubmissions,
        players: updatedPlayers,
        currentPlayerId: nextPlayerId,
        turnStartTime: serverTimestamp(),
        currentTurnIndex: nextTurnIndex,
        lastActivity: serverTimestamp()
      };
      
      transaction.update(roomRef, updates);
      
      console.log(`✅ SUBMIT_TURN_ANSWER: Player ${playerId} submitted ${answers.length} answers for ${totalPoints} points`);
      
      return { success: true };
    });
    
    return result;
  } catch (error) {
    console.error(`❌ SUBMIT_TURN_ANSWER: Failed to submit answer:`, error);
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
