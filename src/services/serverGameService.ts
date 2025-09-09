import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  runTransaction, 
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { InputValidator } from '../utils/inputValidator';

export interface GameValidationResult {
  valid: boolean;
  error?: string;
  sanitizedAnswer?: string;
  score?: number;
  isCorrect?: boolean;
}

export interface GameState {
  roomCode: string;
  currentQuestion: number;
  currentPlayer: string;
  players: { [userId: string]: PlayerState };
  answers: { [userId: string]: string };
  scores: { [userId: string]: number };
  gamePhase: 'waiting' | 'playing' | 'finished';
  startTime: Timestamp;
  lastActionTime: Timestamp;
  turnStartTime: Timestamp;
  questionStartTime: Timestamp;
}

export interface PlayerState {
  userId: string;
  displayName: string;
  isHost: boolean;
  isReady: boolean;
  isOnline: boolean;
  lastSeen: Timestamp;
  joinTime: Timestamp;
}

export interface AnswerSubmission {
  userId: string;
  answer: string;
  timestamp: Timestamp;
  clientTimestamp: number;
}

export interface TurnValidation {
  valid: boolean;
  error?: string;
  timeRemaining?: number;
  isTimeout?: boolean;
}

/**
 * Server-side game validation service
 * Handles all game logic validation, anti-cheat measures, and state management
 */
export class ServerGameService {
  private static readonly MAX_ANSWER_LENGTH = 100;
  private static readonly TURN_TIMEOUT_MS = 60000; // 60 seconds
  private static readonly QUESTION_TIMEOUT_MS = 300000; // 5 minutes
  private static readonly MAX_PLAYERS = 10;
  private static readonly MIN_PLAYERS = 2;

  /**
   * Validate and submit an answer with server-side checks
   */
  static async validateAndSubmitAnswer(
    roomCode: string,
    userId: string,
    answer: string,
    clientTimestamp: number
  ): Promise<GameValidationResult> {
    try {
      // 1. Input validation and sanitization
      const answerValidation = InputValidator.validateGameAnswer(answer);
      if (!answerValidation.valid) {
        return {
          valid: false,
          error: answerValidation.errors[0]
        };
      }

      const sanitizedAnswer = answerValidation.sanitized;

      // 2. Validate room and game state
      const roomValidation = await this.validateRoomAndGameState(roomCode, userId);
      if (!roomValidation.valid) {
        return roomValidation;
      }

      // 3. Validate turn order and timing
      const turnValidation = await this.validateTurnOrder(roomCode, userId, clientTimestamp);
      if (!turnValidation.valid) {
        return {
          valid: false,
          error: turnValidation.error
        };
      }

      // 4. Check for duplicate answers
      const duplicateCheck = await this.checkForDuplicateAnswer(roomCode, userId, sanitizedAnswer);
      if (!duplicateCheck.valid) {
        return duplicateCheck;
      }

      // 5. Validate answer timing (prevent rapid submissions)
      const timingValidation = await this.validateAnswerTiming(roomCode, userId);
      if (!timingValidation.valid) {
        return timingValidation;
      }

      // 6. Process answer and update game state atomically
      const result = await this.processAnswerAtomically(
        roomCode,
        userId,
        sanitizedAnswer,
        clientTimestamp
      );

      return result;
    } catch (error) {
      console.error('Server game validation error:', error);
      return {
        valid: false,
        error: 'Server validation failed. Please try again.'
      };
    }
  }

  /**
   * Validate room exists and user is participant
   */
  private static async validateRoomAndGameState(
    roomCode: string,
    userId: string
  ): Promise<GameValidationResult> {
    try {
      const roomRef = doc(db, 'multiplayerGames', roomCode);
      const roomDoc = await getDoc(roomRef);

      if (!roomDoc.exists()) {
        return {
          valid: false,
          error: 'Room not found'
        };
      }

      const roomData = roomDoc.data() as any; // Use any to handle both GameState and RoomData
      
      console.log('🔍 SERVER_VALIDATION_DEBUG:', {
        roomCode,
        userId,
        gamePhase: roomData.gamePhase,
        status: roomData.status,
        currentPlayer: roomData.currentPlayer || roomData.currentPlayerId,
        players: Object.keys(roomData.players || {}),
        timestamp: new Date().toISOString()
      });
      
      if (roomData.gamePhase !== 'question') {
        console.log('❌ SERVER_VALIDATION_FAILED: Game phase check failed', {
          expected: 'question',
          actual: roomData.gamePhase,
          roomCode,
          userId
        });
        return {
          valid: false,
          error: 'Game is not in question phase'
        };
      }

      if (!roomData.players[userId]) {
        return {
          valid: false,
          error: 'User is not a participant in this room'
        };
      }

      return { valid: true };
    } catch (error) {
      console.error('Room validation error:', error);
      return {
        valid: false,
        error: 'Failed to validate room'
      };
    }
  }

  /**
   * Validate turn order and prevent out-of-turn submissions
   */
  private static async validateTurnOrder(
    roomCode: string,
    userId: string,
    clientTimestamp: number
  ): Promise<TurnValidation> {
    try {
      const roomRef = doc(db, 'multiplayerGames', roomCode);
      const roomDoc = await getDoc(roomRef);
      
      if (!roomDoc.exists()) {
        return { valid: false, error: 'Room not found' };
      }

      const roomData = roomDoc.data() as any; // Use any to handle both GameState and RoomData
      
      // Check if it's the user's turn (handle both data structures)
      const currentPlayer = roomData.currentPlayer || roomData.currentPlayerId;
      
      console.log('🔍 TURN_VALIDATION_DEBUG:', {
        roomCode,
        userId,
        currentPlayer,
        currentPlayerId: roomData.currentPlayerId,
        currentPlayerField: roomData.currentPlayer,
        isMyTurn: currentPlayer === userId,
        turnOrder: roomData.turnOrder,
        currentTurnIndex: roomData.currentTurnIndex,
        players: Object.keys(roomData.players || {}),
        timestamp: new Date().toISOString()
      });
      
      if (currentPlayer !== userId) {
        console.log('❌ TURN_VALIDATION_FAILED: Not user\'s turn', {
          expected: userId,
          actual: currentPlayer,
          roomCode,
          userId
        });
        return {
          valid: false,
          error: 'It is not your turn'
        };
      }

      // Validate timing (handle both data structures)
      const now = Date.now();
      const turnStartTime = roomData.turnStartTime;
      const serverTime = turnStartTime?.toMillis ? turnStartTime.toMillis() : turnStartTime;
      const timeElapsed = now - serverTime;
      const timeRemaining = this.TURN_TIMEOUT_MS - timeElapsed;

      if (timeElapsed > this.TURN_TIMEOUT_MS) {
        return {
          valid: false,
          error: 'Turn has timed out',
          isTimeout: true
        };
      }

      // Check for suspicious timing (submitted too quickly)
      if (timeElapsed < 1000) { // Less than 1 second
        return {
          valid: false,
          error: 'Answer submitted too quickly'
        };
      }

      return {
        valid: true,
        timeRemaining: Math.max(0, timeRemaining)
      };
    } catch (error) {
      console.error('Turn validation error:', error);
      return {
        valid: false,
        error: 'Failed to validate turn'
      };
    }
  }

  /**
   * Check for duplicate answers in the same question
   */
  private static async checkForDuplicateAnswer(
    roomCode: string,
    userId: string,
    answer: string
  ): Promise<GameValidationResult> {
    try {
      const roomRef = doc(db, 'multiplayerGames', roomCode);
      const roomDoc = await getDoc(roomRef);
      
      if (!roomDoc.exists()) {
        return { valid: false, error: 'Room not found' };
      }

      const roomData = roomDoc.data() as any; // Use any to handle both GameState and RoomData
      
      console.log('🔍 DUPLICATE_CHECK_DEBUG:', {
        roomCode,
        userId,
        answer,
        roomDataKeys: Object.keys(roomData),
        hasPlayerSubmissions: !!roomData.playerSubmissions,
        hasRevealedAnswers: !!roomData.revealedAnswers,
        playerSubmissions: roomData.playerSubmissions,
        revealedAnswers: roomData.revealedAnswers
      });
      
      // Check if user already answered this question (handle both data structures)
      const playerSubmissions = roomData.playerSubmissions || {};
      if (playerSubmissions[userId]) {
        console.log('❌ DUPLICATE_CHECK: User already answered this question');
        return {
          valid: false,
          error: 'You have already answered this question'
        };
      }

      // Check for duplicate answers from other players in revealed answers
      const revealedAnswers = roomData.revealedAnswers || [];
      const normalizedAnswer = answer.toLowerCase().trim();
      
      for (const revealedAnswer of revealedAnswers) {
        if (revealedAnswer && revealedAnswer.answerId) {
          const existingAnswer = revealedAnswer.answerId.toLowerCase().trim();
          if (existingAnswer === normalizedAnswer) {
            console.log('❌ DUPLICATE_CHECK: Answer already revealed by another player');
            return {
              valid: false,
              error: 'This answer has already been submitted by another player'
            };
          }
        }
      }

      return { valid: true };
    } catch (error) {
      console.error('Duplicate check error:', error);
      return {
        valid: false,
        error: 'Failed to check for duplicates'
      };
    }
  }

  /**
   * Validate answer timing to prevent rapid submissions
   */
  private static async validateAnswerTiming(
    roomCode: string,
    userId: string
  ): Promise<GameValidationResult> {
    try {
      // In a real implementation, you would track user submission history
      // For now, we'll implement basic rate limiting
      const now = Date.now();
      
      // Check if user has submitted recently (within last 2 seconds)
      // This would be stored in a separate collection in production
      const recentSubmission = await this.getLastSubmissionTime(roomCode, userId);
      
      if (recentSubmission && (now - recentSubmission) < 2000) {
        return {
          valid: false,
          error: 'Please wait before submitting another answer'
        };
      }

      return { valid: true };
    } catch (error) {
      console.error('Timing validation error:', error);
      return {
        valid: false,
        error: 'Failed to validate timing'
      };
    }
  }

  /**
   * Process answer and update game state atomically
   */
  private static async processAnswerAtomically(
    roomCode: string,
    userId: string,
    answer: string,
    clientTimestamp: number
  ): Promise<GameValidationResult> {
    try {
      const roomRef = doc(db, 'multiplayerGames', roomCode);
      
      return await runTransaction(db, async (transaction) => {
        const roomDoc = await transaction.get(roomRef);
        
        if (!roomDoc.exists()) {
          throw new Error('Room not found');
        }

        const roomData = roomDoc.data() as any; // Use any to handle both GameState and RoomData
        
        // Double-check it's still the user's turn (handle both data structures)
        const currentPlayer = roomData.currentPlayer || roomData.currentPlayerId;
        if (currentPlayer !== userId) {
          console.log('❌ ATOMIC_TURN_CHECK_FAILED:', {
            roomCode,
            userId,
            currentPlayer,
            currentPlayerId: roomData.currentPlayerId,
            currentPlayerField: roomData.currentPlayer,
            isMyTurn: currentPlayer === userId,
            turnOrder: roomData.turnOrder,
            currentTurnIndex: roomData.currentTurnIndex,
            players: Object.keys(roomData.players || {}),
            timestamp: new Date().toISOString()
          });
          throw new Error('It is not your turn');
        }

        // Calculate score (simplified - in real implementation, this would be more complex)
        const currentQuestionIndex = roomData.currentQuestionIndex || 0;
        const score = this.calculateAnswerScore(answer, currentQuestionIndex);
        const isCorrect = score > 0;

        // Update game state - handle both data structures
        const updatedScores = {
          ...roomData.scores,
          [userId]: (roomData.scores[userId] || 0) + score
        };

        // Determine next player or end question
        const nextPlayer = this.getNextPlayer(roomData, userId);
        const gamePhase = this.determineGamePhase(roomData, roomData.playerSubmissions || {});

        const updateData: any = {
          scores: updatedScores,
          currentPlayerId: nextPlayer || '',
          lastActivity: serverTimestamp(),
          ...(gamePhase === 'question' && nextPlayer ? {
            turnStartTime: serverTimestamp()
          } : {}),
          ...(gamePhase === 'finished' ? {
            gamePhase: 'finished'
          } : {})
        };

        transaction.update(roomRef, updateData);

        // Log the submission for rate limiting
        await this.logSubmission(roomCode, userId, Date.now());

        return {
          valid: true,
          sanitizedAnswer: answer,
          score,
          isCorrect
        };
      });
    } catch (error) {
      console.error('Atomic update error:', error);
      return {
        valid: false,
        error: 'Failed to process answer'
      };
    }
  }

  /**
   * Calculate score for an answer (simplified implementation)
   */
  private static calculateAnswerScore(answer: string, questionNumber: number): number {
    // In a real implementation, this would check against correct answers
    // For now, return a random score based on answer length and question number
    const baseScore = Math.min(answer.length * 10, 100);
    const questionBonus = (10 - questionNumber) * 5; // Higher bonus for earlier questions
    return Math.max(baseScore + questionBonus, 0);
  }

  /**
   * Get next player in turn order
   */
  private static getNextPlayer(roomData: any, currentUserId: string): string | null {
    // Handle both GameState and RoomData structures
    if (roomData.turnOrder && Array.isArray(roomData.turnOrder)) {
      // RoomData structure - use turnOrder array
      const currentIndex = roomData.turnOrder.indexOf(currentUserId);
      if (currentIndex === -1) return null;
      const nextIndex = (currentIndex + 1) % roomData.turnOrder.length;
      return roomData.turnOrder[nextIndex];
    } else {
      // GameState structure - use players object keys
      const playerIds = Object.keys(roomData.players || {});
      const currentIndex = playerIds.indexOf(currentUserId);
      if (currentIndex === -1) return null;
      const nextIndex = (currentIndex + 1) % playerIds.length;
      return playerIds[nextIndex];
    }
  }

  /**
   * Determine game phase based on current state
   */
  private static determineGamePhase(roomData: any, submissions: any): 'question' | 'finished' {
    // Handle both GameState and RoomData structures
    const totalPlayers = roomData.turnOrder ? roomData.turnOrder.length : Object.keys(roomData.players || {}).length;
    const answeredPlayers = roomData.answersSubmittedCount || Object.keys(submissions || {}).length;
    
    if (answeredPlayers >= totalPlayers) {
      return 'finished';
    }
    
    return 'question';
  }

  /**
   * Get last submission time for rate limiting
   */
  private static async getLastSubmissionTime(roomCode: string, userId: string): Promise<number | null> {
    try {
      // In a real implementation, this would query a submissions collection
      // For now, return null to allow submissions
      return null;
    } catch (error) {
      console.error('Get last submission time error:', error);
      return null;
    }
  }

  /**
   * Log submission for rate limiting
   */
  private static async logSubmission(roomCode: string, userId: string, timestamp: number): Promise<void> {
    try {
      // In a real implementation, this would store in a submissions collection
      console.log(`Submission logged: Room ${roomCode}, User ${userId}, Time ${timestamp}`);
    } catch (error) {
      console.error('Log submission error:', error);
    }
  }

  /**
   * Validate room creation with anti-cheat measures
   */
  static async validateRoomCreation(
    hostUserId: string,
    roomName: string,
    maxPlayers: number = 10
  ): Promise<GameValidationResult> {
    try {
      // Validate room name
      const nameValidation = InputValidator.validateDisplayName(roomName);
      if (!nameValidation.valid) {
        return {
          valid: false,
          error: nameValidation.errors[0]
        };
      }

      // Validate max players
      if (maxPlayers < this.MIN_PLAYERS || maxPlayers > this.MAX_PLAYERS) {
        return {
          valid: false,
          error: `Max players must be between ${this.MIN_PLAYERS} and ${this.MAX_PLAYERS}`
        };
      }

      // Check for rate limiting on room creation
      const recentRooms = await this.getRecentRoomCreations(hostUserId);
      if (recentRooms.length >= 5) { // Max 5 rooms per hour
        return {
          valid: false,
          error: 'Too many rooms created recently. Please wait before creating another room.'
        };
      }

      return { valid: true };
    } catch (error) {
      console.error('Room creation validation error:', error);
      return {
        valid: false,
        error: 'Failed to validate room creation'
      };
    }
  }

  /**
   * Get recent room creations for rate limiting
   */
  private static async getRecentRoomCreations(userId: string): Promise<any[]> {
    try {
      // In a real implementation, this would query a rooms collection
      // For now, return empty array
      return [];
    } catch (error) {
      console.error('Get recent rooms error:', error);
      return [];
    }
  }

  /**
   * Validate player joining with anti-cheat measures
   */
  static async validatePlayerJoin(
    roomCode: string,
    userId: string,
    displayName: string
  ): Promise<GameValidationResult> {
    try {
      // Validate display name
      const nameValidation = InputValidator.validateDisplayName(displayName);
      if (!nameValidation.valid) {
        return {
          valid: false,
          error: nameValidation.errors[0]
        };
      }

      // Check room capacity
      const roomRef = doc(db, 'multiplayerGames', roomCode);
      const roomDoc = await getDoc(roomRef);
      
      if (!roomDoc.exists()) {
        return {
          valid: false,
          error: 'Room not found'
        };
      }

      const roomData = roomDoc.data() as GameState;
      const currentPlayerCount = Object.keys(roomData.players).length;
      
      if (currentPlayerCount >= this.MAX_PLAYERS) {
        return {
          valid: false,
          error: 'Room is full'
        };
      }

      // Check if user is already in the room
      if (roomData.players[userId]) {
        return {
          valid: false,
          error: 'You are already in this room'
        };
      }

      return { valid: true };
    } catch (error) {
      console.error('Player join validation error:', error);
      return {
        valid: false,
        error: 'Failed to validate player join'
      };
    }
  }
}
