import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  onSnapshot, 
  Unsubscribe,
  serverTimestamp,
  arrayUnion,
  deleteField,
  query,
  where,
  getDocs,
  deleteDoc,
  runTransaction,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { AuthService } from './authService';
import { EdgeCaseHandler } from './edgeCaseHandler';
import { distance } from 'fastest-levenshtein';
import { Question, Answer, RoomData, Player, GamePhase, RoomStatus, LegacyQuestion } from '../../shared/types/game';
import { normalizeQuestion, safeToLower, assertQuestionShape } from './questionsService';
import { pointsForRank } from './scoring';
import { awardAnswer, startRound, endRound, updatePlayerPresence, hostStartGame, advanceTurn, submitTurnAnswer as submitTurnAnswerTransaction, forceAdvanceExpiredTurn } from './multiplayerTransaction';
import { startGame as startGameFlow, submitAnswer as submitAnswerFlow, endGame as endGameFlow, advanceTurnOnTimeout } from './multiplayerGameFlow';
import { hostStartGame as hostStartGameV2, submitAnswer as submitAnswerOriginal, submitAnswerRoundBased, advanceTurnOnTimeout as advanceTurnOnTimeoutV2, hostEndGame as hostEndGameV2, getServerOffset, calculateTimeRemaining, isAllowedToSubmit, resetRoomStatus, skipTurn as skipTurnV2, handleHostDisconnection, terminateGame } from './multiplayerGameFlowV2';
import { AppError, toAppError } from '../../shared/errors';
import { getServerTimeOffset, formatTimeRemaining } from './timeSync';
import { findBestMatch, normalizeAnswerEnhanced } from './fuzzyMatching';
import { ServerGameService } from './serverGameService';
import { logger } from '../utils/logger';
import { generateSecureRoomCode } from '../utils/secureRandom';
import { RateLimitService } from './rateLimitService';
import { AnswerValidationService } from './answerValidationService';
import { TIMING, COLLECTIONS } from '../utils/constants';

// Re-export types from unified game types
export type { Player, Question, RoomData, AnswerResult, GameResult } from '../../shared/types/game';

class MultiplayerService {
  private async startGameCore(options: {
    roomCode: string;
    hostId: string;
    label: string;
    start: () => Promise<{ success: boolean; error?: string }>;
    reset?: () => Promise<{ success: boolean; error?: string }>;
  }): Promise<void> {
    const { roomCode, hostId, label, start, reset } = options;
    logger.log(`🎮 ${label}: Starting game in room ${roomCode} for host ${hostId}`);

    try {
      const result = await start();
      if (!result.success) {
        if (reset && result.error?.includes('not in lobby state')) {
          logger.log(`🔄 ${label}: Room in invalid state, attempting reset...`);
          const resetResult = await reset();
          if (resetResult.success) {
            logger.log(`✅ ${label}: Room reset successful, retrying start...`);
            const retryResult = await start();
            if (!retryResult.success) {
              throw new AppError({
                code: 'MP_START_GAME_FAILED',
                message: retryResult.error || 'Failed to start game after reset',
                userMessage: retryResult.error || 'Failed to start game after reset.'
              });
            }
          } else {
            throw new AppError({
              code: 'MP_RESET_FAILED',
              message: `Failed to reset room: ${resetResult.error}`,
              userMessage: `Failed to reset room: ${resetResult.error}`
            });
          }
        } else {
          throw new AppError({
            code: 'MP_START_GAME_FAILED',
            message: result.error || 'Failed to start game',
            userMessage: result.error || 'Failed to start game.'
          });
        }
      }

      logger.log(`✅ ${label}: Game started successfully`);
    } catch (error) {
      const appError = toAppError(error, {
        code: 'MP_START_GAME_FAILED',
        message: 'Failed to start game',
        userMessage: 'Failed to start game.'
      });
      logger.error(`❌ ${label}: Error starting game:`, appError);
      throw appError;
    }
  }
  private unsubscribeFunctions: Map<string, () => void> = new Map();
  private authService = AuthService.getInstance();
  private edgeCaseHandler = EdgeCaseHandler.getInstance();
  private connectionMonitor: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Ensures the user is authenticated, signs them in anonymously if not
   */
  private async ensureAuthenticated(): Promise<string> {
    return this.authService.ensureAuthenticated();
  }

  /**
   * Generates a unique 6-digit room code
   * ✅ SECURITY: Uses cryptographically secure random generation
   */
  private async generateRoomCode(): Promise<string> {
    return generateSecureRoomCode();
  }

  /**
   * Checks if a room code is already in use
   */
  private async isRoomCodeAvailable(roomCode: string): Promise<boolean> {
    try {
      const roomRef = doc(db, COLLECTIONS.MULTIPLAYER_GAMES, roomCode);
      const roomSnap = await getDoc(roomRef);
      return !roomSnap.exists();
    } catch (error) {
      logger.error('Error checking room code availability:', error);
      return false;
    }
  }

  /**
   * Creates a new multiplayer room with comprehensive edge case handling
   */
  async createRoom(hostId: string, category: string, questions: Array<Question | LegacyQuestion>, hostName?: string, selectedAvatar?: string): Promise<string> {
    try {
      // Check current auth state
      const currentUser = this.authService.getCurrentUserId();
      
      // Ensure authentication with edge case handling
      const userId = await this.ensureAuthenticated();
      
      // Validate that the authenticated user matches the hostId parameter
      if (userId !== hostId) {
        logger.warn('⚠️ Authenticated user ID does not match hostId parameter:', { userId, hostId });
        // Use the authenticated user ID instead of the parameter
        hostId = userId;
      }
      
      // Check rate limiting for room creation
      const rateLimitResult = await RateLimitService.checkRateLimit(
        userId,
        'roomCreation',
        { ipAddress: 'unknown', userAgent: 'mobile' }
      );
      
      if (!rateLimitResult.allowed) {
        throw new AppError({
          code: 'RATE_LIMIT_EXCEEDED',
          message: rateLimitResult.error || 'Too many room creation attempts. Please wait before creating another room.',
          userMessage: 'Too many room creation attempts. Please wait before creating another room.'
        });
      }
      
      // Server-side validation for room creation
      const roomName = hostName || `Room by ${userId}`;
      const validationResult = await ServerGameService.validateRoomCreation(
        userId,
        roomName,
        10 // max players
      );
      
      if (!validationResult.valid) {
        throw new AppError({
          code: 'ROOM_CREATION_VALIDATION_FAILED',
          message: validationResult.error || 'Room creation validation failed',
          userMessage: 'Room creation validation failed. Please try again.'
        });
      }
      
      // Note: Removed test collection write - it was causing production failures
      // because Firestore rules block test collection access. Firebase connectivity
      // will be tested when creating the actual room document.
      
      // Generate unique room code with collision handling
      // ✅ SECURITY: Uses cryptographically secure random generation
      let roomCode: string;
      let attempts = 0;
      do {
        roomCode = await this.generateRoomCode();
        attempts++;
        if (attempts > 10) {
          // Handle duplicate room code edge case
          roomCode = await this.edgeCaseHandler.handleDuplicateRoomCode(roomCode);
          break;
        }
      } while (!(await this.isRoomCodeAvailable(roomCode)));

      const now = Date.now();
      
      // Normalize questions to unified format
      const preparedQuestions = (questions || []).map(q => normalizeQuestion(q));
      
      const roomData: RoomData = {
        roomCode,
        hostId: userId, // Use the authenticated user ID
        createdAt: now,
        status: 'lobby',
        category: category || 'General',
        questions: preparedQuestions,
        currentQuestionIndex: 0,
        players: {
          [userId]: {
            id: userId,
            name: hostName || 'Player', // Use provided host name
            score: 0,
            isHost: true,
            joinedAt: now,
            isConnected: true,
            lastSeen: now,
            // Firestore rejects undefined; user may have no avatar selected yet
            selectedAvatar: selectedAvatar ?? '',
          }
        },
        gamePhase: 'lobby',
        questionStartTime: 0, // Use 0 instead of null for Firestore compatibility
        questionTimeLimit: 60, // 60 seconds per question
        currentAnswers: [],
        // Initialize V2 fields
        revealedAnswers: Array(10).fill(null),
        scores: { [userId]: 0 },
        answersSubmittedCount: 0,
        // Turn system fields
        turnTimeLimit: 60,
        turnOrder: [userId],
        currentTurnIndex: 0,
        // Legacy fields
        answerOwners: {},
        playerSubmissions: {},
        maxPlayers: 8,
        isPrivate: false,
        lastActivity: now
      };

      // Debug log room data before sanitization
      this.debugLogObject(roomData, 'Room data before sanitization');
      
      // Sanitize room data to remove undefined values
      const sanitizedRoomData = this.sanitizeObjectForFirestore(roomData);
      this.debugLogObject(sanitizedRoomData, 'Room data after sanitization');
      
      // Validate that no undefined values remain
      const hasUndefined = JSON.stringify(sanitizedRoomData).includes('undefined');
      if (hasUndefined) {
        logger.error('❌ Sanitized data still contains undefined values:', sanitizedRoomData);
        throw new AppError({
          code: 'DATA_SANITIZATION_FAILED',
          message: 'Data sanitization failed - undefined values detected',
          userMessage: 'Invalid data format. Please try again.'
        });
      }
      
      // Validate room data structure
      if (!this.validateRoomDataStructure(sanitizedRoomData)) {
        throw new AppError({
          code: 'ROOM_DATA_VALIDATION_FAILED',
          message: 'Room data validation failed',
          userMessage: 'Room data validation failed. Please try again.'
        });
      }
      
      // Apply additional Firestore compatibility validation
      const validatedRoomData = this.validateRoomDataForFirestore(sanitizedRoomData);
      
      // Write to Firestore directly - no need for concurrent state change handling on creation
      const roomRef = doc(db, COLLECTIONS.MULTIPLAYER_GAMES, roomCode);
      await setDoc(roomRef, validatedRoomData);

      // Verify room was created successfully
      const verifyRef = doc(db, COLLECTIONS.MULTIPLAYER_GAMES, roomCode);
      const verifySnap = await getDoc(verifyRef);
      if (!verifySnap.exists()) {
        throw new AppError({
          code: 'ROOM_CREATION_VERIFICATION_FAILED',
          message: 'Failed to create room - verification failed',
          userMessage: 'Room creation failed. Please try again.'
        });
      }

      // Start connection monitoring for the host
      this.startConnectionMonitoring(roomCode, userId, true);

      await RateLimitService.recordAction(userId, 'roomCreation', { ipAddress: 'unknown', userAgent: 'mobile' }).catch(() => {});

      logger.log('✅ Room created successfully:', roomCode);
      return roomCode;
    } catch (error) {
      logger.error('❌ Error in createRoom:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: (error as { code?: string })?.code
      });
      
      // Handle authentication failures
      if (error instanceof Error && error.message.includes('authentication')) {
        await this.edgeCaseHandler.handleAuthenticationFailure(hostId);
      }
      
      throw new AppError({
        code: 'ROOM_CREATION_FAILED',
        message: 'Failed to create room',
        userMessage: 'Failed to create room. Please try again.'
      });
    }
  }

  /**
   * Simplified room creation for testing
   */
  async createRoomSimple(): Promise<string> {
    try {
      logger.log('🔍 Testing simplified room creation...');
      
      // Ensure user is authenticated
      const userId = await this.ensureAuthenticated();
      logger.log('Creating room with user:', userId);
      
      // ✅ SECURITY: Generate secure room code using cryptographically secure random
      const roomCode = await generateSecureRoomCode();
      
      // Minimal room data
      const roomData = {
        roomCode: roomCode,
        hostId: userId,
        createdAt: serverTimestamp(),
        status: 'lobby'
      };
      
      // Try to write
      const roomRef = doc(db, COLLECTIONS.MULTIPLAYER_GAMES, roomCode);
      await setDoc(roomRef, roomData);
      
      logger.log('✅ Simple room created:', roomCode);
      return roomCode;
      
    } catch (error) {
      logger.error('❌ Simple room creation failed:', error);
      throw error;
    }
  }

  /**
   * Joins an existing room with comprehensive edge case handling
   */
  async joinRoom(roomCode: string, playerId: string, playerName: string, selectedAvatar?: string): Promise<boolean> {
    try {
      await this.ensureAuthenticated();
      
      // Check rate limiting for room joining
      const rateLimitResult = await RateLimitService.checkRateLimit(
        playerId,
        'roomJoining',
        { roomCode, ipAddress: 'unknown', userAgent: 'mobile' }
      );
      
      if (!rateLimitResult.allowed) {
        throw new AppError({
          code: 'RATE_LIMIT_EXCEEDED',
          message: rateLimitResult.error || 'Too many room joining attempts. Please wait before trying again.',
          userMessage: 'Too many room joining attempts. Please wait before trying again.'
        });
      }
      
      // Server-side validation for player joining
      const validationResult = await ServerGameService.validatePlayerJoin(
        roomCode,
        playerId,
        playerName
      );
      
      if (!validationResult.valid) {
        throw new AppError({
          code: 'PLAYER_JOIN_VALIDATION_FAILED',
          message: validationResult.error || 'Player join validation failed',
          userMessage: 'Player join validation failed. Please try again.'
        });
      }
      
      // Check for malicious activity
      if (await this.handleMaliciousActivity(roomCode, playerId, 'join_room')) {
        throw new Error('Suspicious activity detected. Please try again later.');
      }
      
      const roomRef = doc(db, COLLECTIONS.MULTIPLAYER_GAMES, roomCode);
      const roomSnap = await getDoc(roomRef);
      
      if (!roomSnap.exists()) {
        logger.log(`❌ Room ${roomCode} not found in Firestore`);
        throw new AppError({
          code: 'ROOM_NOT_FOUND',
          message: `Room ${roomCode} not found`,
          userMessage: 'Room not found. Please check the room code and try again.'
        });
      }

      const roomData = roomSnap.data() as RoomData;
      
      // Validate room data integrity
      if (!(await this.validateRoomData(roomCode))) {
        throw new Error('Room data is corrupted. Please try again.');
      }
      
      // Check for late join attempt
      const joinCheck = await this.edgeCaseHandler.handleLateJoinAttempt(roomCode, playerId);
      if (!joinCheck.allowed) {
        throw new Error(joinCheck.reason || 'Cannot join room at this time');
      }
      
      // Check if room is full
      const currentPlayerCount = Object.keys(roomData.players || {}).length;
      
      if (currentPlayerCount >= roomData.maxPlayers) {
        throw new AppError({
          code: 'ROOM_FULL',
          message: 'Room is full',
          userMessage: 'This room is full. Please try joining a different room.'
        });
      }

      // Check if room is still in lobby
      if (roomData.status !== 'lobby') {
        throw new AppError({
          code: 'GAME_ALREADY_STARTED',
          message: 'Game has already started',
          userMessage: 'This game has already started. You cannot join now.'
        });
      }

      // Add player to room with concurrent state change handling
      const now = Date.now();
      const newPlayer: Player = {
        id: playerId,
        name: playerName,
        score: 0,
        isHost: false,
        joinedAt: now,
        isConnected: true,
        lastSeen: now,
        // Firestore rejects undefined; user may have no avatar selected yet
        selectedAvatar: selectedAvatar ?? '',
      };

      // Update room with new player directly
      await updateDoc(roomRef, {
        [`players.${playerId}`]: newPlayer,
        lastActivity: serverTimestamp()
      });

      // Start connection monitoring for the player
      this.startConnectionMonitoring(roomCode, playerId, false);

      await RateLimitService.recordAction(playerId, 'roomJoining', { roomCode, ipAddress: 'unknown', userAgent: 'mobile' }).catch(() => {});

      logger.log(`✅ Player ${playerName} joined room ${roomCode}`);
      return true;
    } catch (error) {
      logger.error('Error joining room:', error);
      
      // Handle authentication failures
      if (error instanceof Error && error.message.includes('authentication')) {
        await this.edgeCaseHandler.handleAuthenticationFailure(playerId);
      }
      
      throw error;
    }
  }

  /**
   * Leaves a room
   */
  async leaveRoom(roomCode: string, playerId: string): Promise<void> {
    try {
      const rateLimitResult = await RateLimitService.checkRateLimit(playerId, 'leaveRoom', { roomCode });
      if (!rateLimitResult.allowed) {
        throw new AppError({
          code: 'MP_RATE_LIMITED',
          message: rateLimitResult.error || 'Too many leave attempts. Please wait.',
          userMessage: rateLimitResult.error || 'Too many leave attempts. Please wait before trying again.',
        });
      }

      const roomRef = doc(db, COLLECTIONS.MULTIPLAYER_GAMES, roomCode);
      const roomSnap = await getDoc(roomRef);
      
      if (!roomSnap.exists()) {
        return; // Room doesn't exist, nothing to do
      }

      const roomData = roomSnap.data() as RoomData;
      
      // Validate room data
      if (!roomData.hostId) {
        logger.error('❌ Room has no hostId, cannot process leave request');
        // Try to delete the corrupted room
        try {
          await deleteDoc(roomRef);
          logger.log('✅ Deleted corrupted room with no hostId');
        } catch (deleteError) {
          logger.error('❌ Failed to delete corrupted room:', deleteError);
        }
        return;
      }
      
      if (!roomData.players || !roomData.players[playerId]) {
        logger.error('❌ Player not found in room, cannot process leave request');
        return;
      }
      
      // Handle host disconnection with proper validation
      if (roomData.hostId === playerId) {
        logger.log(`🚪 HOST_LEAVING: Host ${playerId} is leaving room ${roomCode}`);
        
        // Get remaining players (excluding the leaving host)
        const remainingPlayerIds = Object.keys(roomData.players).filter(id => id !== playerId);
        logger.log(`📊 HOST_LEAVING: Remaining players: ${remainingPlayerIds.length}`, remainingPlayerIds);
        
        if (remainingPlayerIds.length === 0) {
          // No players left, delete the room
          logger.log(`🏁 HOST_LEAVING: No players left, deleting room ${roomCode}`);
          await deleteDoc(roomRef);
          return;
        }
        
        // Host exit always terminates the game - show leaderboard to all remaining players
        logger.log(`🏁 HOST_LEAVING: Terminating game in room ${roomCode} (host left)`);
        await runTransaction(db, async (transaction) => {
          const roomRef = doc(db, COLLECTIONS.MULTIPLAYER_GAMES, roomCode);
          const roomSnap = await transaction.get(roomRef);
          
          if (!roomSnap.exists()) {
            throw new Error('Room not found during termination');
          }
          
          // Set game as finished and add system message so remaining players see leaderboard
          transaction.update(roomRef, {
            status: 'finished',
            gamePhase: 'finished',
            lastActivity: serverTimestamp(),
            systemMessage: {
              type: 'game_terminated',
              message: 'The host left the game, so the game has been terminated.',
              timestamp: serverTimestamp()
            }
          });
        });
        
        // Remove the leaving host from the room
        await updateDoc(roomRef, {
          [`players.${playerId}`]: deleteField(),
          lastActivity: serverTimestamp()
        });
        
        logger.log(`✅ HOST_LEAVING: Game terminated and host removed from room ${roomCode}`);
      } else {
        // Regular player leaving - game continues for others
        logger.log(`👤 PLAYER_LEAVING: Player ${playerId} is leaving room ${roomCode}`);
        
        await updateDoc(roomRef, {
          [`players.${playerId}`]: deleteField(),
          lastActivity: serverTimestamp()
        });
      }

      await RateLimitService.recordAction(playerId, 'leaveRoom', { roomCode }).catch(() => {});
      logger.log(`✅ Player ${playerId} left room ${roomCode}`);
    } catch (error) {
      logger.error('Error leaving room:', error);
      throw error;
    }
  }

  /**
   * Starts the game (host only) - atomic transition from lobby to playing
   */
  async startGame(roomCode: string, hostId: string, timeLimit: number = 60): Promise<void> {
    const rateLimitResult = await RateLimitService.checkRateLimit(hostId, 'startGame', { roomCode });
    if (!rateLimitResult.allowed) {
      throw new AppError({
        code: 'MP_RATE_LIMITED',
        message: rateLimitResult.error || 'Too many game start attempts.',
        userMessage: rateLimitResult.error || 'Too many game start attempts. Please wait before trying again.',
      });
    }
    await this.startGameCore({
      roomCode,
      hostId,
      label: 'ROOM_START',
      start: () => hostStartGame(roomCode, hostId, timeLimit),
    });
    await RateLimitService.recordAction(hostId, 'startGame', { roomCode }).catch(() => {});
  }

  /**
   * Ends the game (host only)
   */
  async endGame(roomCode: string, hostId: string): Promise<void> {
    try {
      const roomRef = doc(db, COLLECTIONS.MULTIPLAYER_GAMES, roomCode);
      const roomSnap = await getDoc(roomRef);
      
      if (!roomSnap.exists()) {
        throw new Error('Room not found');
      }

      const roomData = roomSnap.data() as RoomData;
      
      // Verify host
      if (roomData.hostId !== hostId) {
        throw new Error('Only the host can end the game');
      }

      await updateDoc(roomRef, {
        status: 'finished',
        gamePhase: 'finished',
        lastActivity: Date.now()
      });

      logger.log(`✅ Game ended in room ${roomCode}`);
    } catch (error) {
      logger.error('Error ending game:', error);
      throw error;
    }
  }

  /**
   * Kicks a player from the room (host only)
   */
  async kickPlayer(roomCode: string, hostId: string, targetPlayerId: string): Promise<void> {
    try {
      const rateLimitResult = await RateLimitService.checkRateLimit(hostId, 'kickPlayer', { roomCode });
      if (!rateLimitResult.allowed) {
        throw new AppError({
          code: 'MP_RATE_LIMITED',
          message: rateLimitResult.error || 'Too many kick attempts.',
          userMessage: rateLimitResult.error || 'Too many kick attempts. Please wait before trying again.',
        });
      }

      const roomRef = doc(db, COLLECTIONS.MULTIPLAYER_GAMES, roomCode);
      const roomSnap = await getDoc(roomRef);
      
      if (!roomSnap.exists()) {
        throw new Error('Room not found');
      }

      const roomData = roomSnap.data() as RoomData;
      
      // Verify host
      if (roomData.hostId !== hostId) {
        throw new Error('Only the host can kick players');
      }

      // Can't kick host
      if (targetPlayerId === hostId) {
        throw new Error('Host cannot kick themselves');
      }

      // Remove player from the players map using deleteField (players is an object, not an array)
      await updateDoc(roomRef, {
        [`players.${targetPlayerId}`]: deleteField(),
        lastActivity: Date.now()
      });

      logger.log(`✅ Player ${targetPlayerId} kicked from room ${roomCode}`);
    } catch (error) {
      logger.error('Error kicking player:', error);
      throw error;
    }
  }

  /**
   * Submits answers for the current question using the same logic as single player
   */
  async submitAnswer(roomCode: string, playerId: string, answers: string[]): Promise<void> {
    try {
      // Validate inputs
      if (!roomCode || !playerId || !answers) {
        throw new Error('Missing required parameters');
      }

      if (!Array.isArray(answers) || answers.length === 0) {
        throw new Error('Answers must be a non-empty array');
      }

      // Validate each answer using safe string handling
      const validAnswers = answers.filter(answer => 
        answer && typeof answer === 'string' && safeToLower(answer).length > 0
      );

      if (validAnswers.length === 0) {
        throw new Error('No valid answers provided');
      }

      const roomRef = doc(db, COLLECTIONS.MULTIPLAYER_GAMES, roomCode);
      const roomSnap = await getDoc(roomRef);
      
      if (!roomSnap.exists()) {
        throw new Error('Room not found');
      }

      const roomData = roomSnap.data() as RoomData;
      
      // Check if player is in room
      if (!roomData.players || !roomData.players[playerId]) {
        throw new Error('Player not in room');
      }

      // Check if game is in question phase
      if (roomData.gamePhase !== 'question') {
        throw new Error('Cannot submit answers at this time');
      }

      const now = Date.now();
      
      // Process each answer and award points atomically
      let totalPoints = 0;
      const processedAnswers: Array<{ answer: string; isCorrect: boolean; points: number; rank: number }> = [];
      
      for (const answer of validAnswers) {
        try {
          // Find matching answer in current question
          const currentQuestion = roomData.questions?.[roomData.currentQuestionIndex || 0];
          if (!currentQuestion) {
            logger.log(`Answer "${answer}" - no current question`);
            continue;
          }

          const matchedAnswer = this.findMatchingAnswer(answer, currentQuestion.answers);
          if (matchedAnswer) {
            // Award points atomically using transaction
            const awardResult = await awardAnswer(roomCode, answer, playerId, matchedAnswer.rank);
            if (awardResult.success) {
              totalPoints += awardResult.points;
              processedAnswers.push({
                answer,
                isCorrect: true,
                points: awardResult.points,
                rank: matchedAnswer.rank
              });
              logger.log(`✅ AWARD_ANSWER: Awarded ${awardResult.points} points for "${answer}"`);
            } else {
              logger.log(`⚠️ AWARD_ANSWER: Failed to award points for "${answer}": ${awardResult.error}`);
            }
          } else {
            logger.log(`Answer "${answer}" was not correct`);
          }
        } catch (error) {
          logger.log(`Answer "${answer}" processing error:`, error instanceof Error ? error.message : 'Unknown error');
        }
      }

      // Update player submissions (non-awarded answers)
      await updateDoc(roomRef, {
        [`playerSubmissions.${playerId}`]: {
          answers: validAnswers,
          submittedAt: now,
          points: totalPoints,
          processedAnswers
        },
        lastActivity: now
      });

      logger.log(`✅ Player ${playerId} submitted answers for room ${roomCode}, earned ${totalPoints} points`);
    } catch (error) {
      logger.error('Error submitting answers:', error);
      throw error;
    }
  }

  /**
   * Advance to next player's turn
   */
  async advanceTurn(roomCode: string, playerId: string): Promise<void> {
    try {
      const rateLimitResult = await RateLimitService.checkRateLimit(playerId, 'advanceTurn', { roomCode });
      if (!rateLimitResult.allowed) {
        throw new AppError({
          code: 'MP_RATE_LIMITED',
          message: rateLimitResult.error || 'Too many turn advances.',
          userMessage: rateLimitResult.error || 'Too many turn advances. Please wait before trying again.',
        });
      }

      logger.log(`🔄 ADVANCE_TURN: Advancing turn in room ${roomCode} for player ${playerId}`);
      
      const result = await advanceTurn(roomCode, playerId);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to advance turn');
      }
      
      await RateLimitService.recordAction(playerId, 'advanceTurn', { roomCode }).catch(() => {});
      logger.log(`✅ ADVANCE_TURN: Turn advanced successfully`);
    } catch (error) {
      logger.error('❌ ADVANCE_TURN: Error advancing turn:', error);
      throw error;
    }
  }

  /**
   * Force advance turn when it has expired
   */
  async forceAdvanceExpiredTurn(roomCode: string, playerId: string): Promise<void> {
    try {
      logger.log(`🔄 FORCE_ADVANCE_EXPIRED_TURN: Force advancing expired turn in room ${roomCode} for player ${playerId}`);
      
      const result = await forceAdvanceExpiredTurn(roomCode, playerId);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to force advance expired turn');
      }
      
      logger.log(`✅ FORCE_ADVANCE_EXPIRED_TURN: Expired turn advanced successfully`);
    } catch (error) {
      logger.error('❌ FORCE_ADVANCE_EXPIRED_TURN: Error force advancing expired turn:', error);
      throw error;
    }
  }

  /**
   * Submit answer for current player's turn (turn-based system)
   */
  async submitTurnAnswer(roomCode: string, playerId: string, answers: string[]): Promise<void> {
    try {
      logger.log(`📝 SUBMIT_TURN_ANSWER: Submitting turn answer in room ${roomCode} for player ${playerId}`);
      
      const result = await submitTurnAnswerTransaction(roomCode, playerId, answers);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to submit turn answer');
      }
      
      logger.log(`✅ SUBMIT_TURN_ANSWER: Turn answer submitted successfully`);
    } catch (error) {
      logger.error('❌ SUBMIT_TURN_ANSWER: Error submitting turn answer:', error);
      throw error;
    }
  }

  /**
   * Clean game flow methods
   */
  async startGameClean(roomCode: string, hostId: string): Promise<void> {
    await this.startGameCore({
      roomCode,
      hostId,
      label: 'START_GAME_CLEAN',
      start: () => startGameFlow(roomCode, hostId),
    });
  }

  async submitAnswerClean(roomCode: string, playerId: string, answer: string): Promise<void> {
    try {
      logger.log(`📝 SUBMIT_ANSWER_CLEAN: Submitting answer in room ${roomCode} for player ${playerId}`);
      
      const result = await submitAnswerFlow(roomCode, playerId, answer);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to submit answer');
      }
      
      logger.log(`✅ SUBMIT_ANSWER_CLEAN: Answer submitted successfully`);
    } catch (error) {
      logger.error('❌ SUBMIT_ANSWER_CLEAN: Error submitting answer:', error);
      throw error;
    }
  }

  async endGameClean(roomCode: string, hostId: string): Promise<void> {
    try {
      logger.log(`🏁 END_GAME_CLEAN: Ending game in room ${roomCode}`);
      
      const result = await endGameFlow(roomCode, hostId);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to end game');
      }
      
      logger.log(`✅ END_GAME_CLEAN: Game ended successfully`);
    } catch (error) {
      logger.error('❌ END_GAME_CLEAN: Error ending game:', error);
      throw error;
    }
  }

  async advanceTurnOnTimeoutClean(roomCode: string, playerId: string): Promise<void> {
    try {
      logger.log(`⏰ ADVANCE_TURN_TIMEOUT_CLEAN: Advancing turn on timeout in room ${roomCode}`);
      
      const result = await advanceTurnOnTimeout(roomCode, playerId);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to advance turn on timeout');
      }
      
      logger.log(`✅ ADVANCE_TURN_TIMEOUT_CLEAN: Turn advanced successfully`);
    } catch (error) {
      logger.error('❌ ADVANCE_TURN_TIMEOUT_CLEAN: Error advancing turn:', error);
      throw error;
    }
  }

  /**
   * V2 Game Flow Methods - Following exact specification
   */
  async startGameV2(roomCode: string, hostId: string, turnTimeLimitSec: number = 60): Promise<void> {
    const rateLimitResult = await RateLimitService.checkRateLimit(hostId, 'startGame', { roomCode });
    if (!rateLimitResult.allowed) {
      throw new AppError({
        code: 'MP_RATE_LIMITED',
        message: rateLimitResult.error || 'Too many game start attempts.',
        userMessage: rateLimitResult.error || 'Too many game start attempts. Please wait before trying again.',
      });
    }
    await this.startGameCore({
      roomCode,
      hostId,
      label: 'START_GAME_V2',
      start: () => hostStartGameV2(roomCode, hostId, turnTimeLimitSec),
      reset: () => resetRoomStatus(roomCode, hostId),
    });
    await RateLimitService.recordAction(hostId, 'startGame', { roomCode }).catch(() => {});
  }

  async submitAnswerV2(roomCode: string, playerId: string, answerText: string): Promise<{ success: boolean; points?: number; error?: string; roundEnded?: boolean }> {
    try {
      // 🔧 SERVICE - INPUT DEBUG LOGGING
      logger.log('🔧 SERVICE - INPUT:', { 
        roomCode, 
        playerId, 
        answerText,
        timestamp: new Date().toISOString()
      });
      
      logger.log(`📝 SUBMIT_ANSWER_V2: Submitting answer in room ${roomCode} for player ${playerId}`);
      
      // 1. Check rate limiting for answer submissions
      const rateLimitResult = await RateLimitService.checkRateLimit(
        playerId,
        'answerSubmission',
        { roomCode }
      );
      
      if (!rateLimitResult.allowed) {
        logger.error(`❌ SUBMIT_ANSWER_V2: Rate limit exceeded:`, rateLimitResult.error);
        return { 
          success: false, 
          error: rateLimitResult.error || 'Too many answer submissions. Please wait before trying again.' 
        };
      }
      
      // 2. Client-side validation with AnswerValidationService
      const formatValidation = AnswerValidationService.validateFormat(answerText);
      if (!formatValidation.isValid) {
        logger.error(`❌ SUBMIT_ANSWER_V2: Format validation failed:`, formatValidation.error);
        return { 
          success: false, 
          error: formatValidation.error || 'Answer format is invalid' 
        };
      }
      
      // 3. Proceed directly with the turn-based game flow (which has its own validation)
      logger.log('🔧 CLIENT_SUBMIT_DEBUG:', {
        roomCode,
        playerId,
        answerText,
        timestamp: new Date().toISOString()
      });
      
      logger.log('🔧 SERVICE - CALLING TURN-BASED GAME FLOW...');
      const result = await submitAnswerOriginal(roomCode, playerId, answerText);
      
      // 🔧 SERVICE - GAME FLOW RESULT DEBUG LOGGING
      logger.log('🔧 SERVICE - GAME FLOW RESULT:', {
        success: result.success,
        points: result.points,
        error: result.error,
        timestamp: new Date().toISOString()
      });
      
      if (!result.success) {
        logger.log('❌ SERVICE - GAME FLOW FAILED:', result.error);
        return { success: false, error: result.error };
      }

      await RateLimitService.recordAction(playerId, 'answerSubmission', { roomCode }).catch(() => {});

      logger.log(`✅ SUBMIT_ANSWER_V2: Answer submitted successfully, points: ${result.points}, roundEnded: ${result.roundEnded || false}`);
      return { success: true, points: result.points, roundEnded: result.roundEnded };
    } catch (error) {
      logger.error('❌ SUBMIT_ANSWER_V2: Error submitting answer:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async skipTurnV2(roomCode: string, playerId: string): Promise<{ success: boolean; error?: string }> {
    try {
      logger.log(`⏭️ SKIP_TURN_V2: Skipping turn in room ${roomCode} for player ${playerId}`);
      
      // Check rate limiting for skip turn
      const rateLimitResult = await RateLimitService.checkRateLimit(
        playerId,
        'skipTurn',
        { roomCode }
      );
      
      if (!rateLimitResult.allowed) {
        logger.error(`❌ SKIP_TURN_V2: Rate limit exceeded:`, rateLimitResult.error);
        return { 
          success: false, 
          error: rateLimitResult.error || 'Too many skip attempts. Please wait before trying again.' 
        };
      }
      
      const result = await skipTurnV2(roomCode, playerId);
      
      if (!result.success) {
        logger.log('❌ SKIP_TURN_V2: Failed to skip turn:', result.error);
        return { success: false, error: result.error };
      }

      await RateLimitService.recordAction(playerId, 'skipTurn', { roomCode }).catch(() => {});

      logger.log(`✅ SKIP_TURN_V2: Turn skipped successfully`);
      return { success: true };
    } catch (error) {
      logger.error('❌ SKIP_TURN_V2: Error skipping turn:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async handleHostDisconnectionV2(roomCode: string, disconnectedHostId: string): Promise<{ action: 'migrated' | 'terminated' | 'error'; newHostId?: string; newHostName?: string; error?: string }> {
    try {
      logger.log(`🚪 HOST_DISCONNECTION_V2: Handling host disconnection in room ${roomCode}`);
      
      const result = await handleHostDisconnection(roomCode, disconnectedHostId);
      
      logger.log(`✅ HOST_DISCONNECTION_V2: Result:`, result);
      return result;
    } catch (error) {
      logger.error('❌ HOST_DISCONNECTION_V2: Error handling host disconnection:', error);
      return {
        action: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async terminateGameV2(roomCode: string, disconnectedPlayerId: string): Promise<{ success: boolean; error?: string }> {
    try {
      logger.log(`🏁 TERMINATE_GAME_V2: Terminating game in room ${roomCode} for player ${disconnectedPlayerId}`);
      
      const result = await terminateGame(roomCode, disconnectedPlayerId);
      
      if (!result.success) {
        logger.log('❌ TERMINATE_GAME_V2: Failed to terminate game:', result.error);
        return { success: false, error: result.error };
      }
      
      logger.log(`✅ TERMINATE_GAME_V2: Game terminated successfully`);
      return { success: true };
    } catch (error) {
      logger.error('❌ TERMINATE_GAME_V2: Error terminating game:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async endGameV2(roomCode: string, hostId: string): Promise<void> {
    try {
      logger.log(`🏁 END_GAME_V2: Ending game in room ${roomCode}`);
      
      const result = await hostEndGameV2(roomCode, hostId);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to end game');
      }
      
      logger.log(`✅ END_GAME_V2: Game ended successfully`);
    } catch (error) {
      logger.error('❌ END_GAME_V2: Error ending game:', error);
      throw error;
    }
  }

  async advanceTurnOnTimeoutV2(roomCode: string, playerId: string): Promise<void> {
    try {
      logger.log(`⏰ ADVANCE_TURN_TIMEOUT_V2: Advancing turn on timeout in room ${roomCode}`);
      
      const result = await advanceTurnOnTimeoutV2(roomCode, playerId);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to advance turn on timeout');
      }
      
      logger.log(`✅ ADVANCE_TURN_TIMEOUT_V2: Turn advanced successfully`);
    } catch (error) {
      logger.error('❌ ADVANCE_TURN_TIMEOUT_V2: Error advancing turn:', error);
      throw error;
    }
  }

  async getServerOffsetV2(): Promise<number> {
    return await getServerOffset();
  }

  calculateTimeRemainingV2(turnStartTime: number | Timestamp | { seconds: number } | null | undefined, turnTimeLimitSec: number, serverOffset: number): number {
    return calculateTimeRemaining(turnStartTime, turnTimeLimitSec, serverOffset);
  }

  isAllowedToSubmitV2(playerId: string, room: RoomData): { allowed: boolean; reason?: string } {
    return isAllowedToSubmit(playerId, room);
  }

  async resetRoomStatusV2(roomCode: string, hostId: string): Promise<void> {
    try {
      logger.log(`🔄 RESET_ROOM_STATUS_V2: Resetting room ${roomCode}`);
      
      const result = await resetRoomStatus(roomCode, hostId);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to reset room status');
      }
      
      logger.log(`✅ RESET_ROOM_STATUS_V2: Room reset successfully`);
    } catch (error) {
      logger.error('❌ RESET_ROOM_STATUS_V2: Error resetting room:', error);
      throw error;
    }
  }

  /**
   * Reveals an answer and awards points (host only)
   */
  async revealAnswer(roomCode: string, hostId: string, answer: string): Promise<void> {
    try {
      const rateLimitResult = await RateLimitService.checkRateLimit(hostId, 'revealAnswer', { roomCode: roomCode });
      if (!rateLimitResult.allowed) {
        throw new AppError({
          code: 'MP_RATE_LIMITED',
          message: rateLimitResult.error || 'Too many reveal attempts.',
          userMessage: rateLimitResult.error || 'Too many reveal attempts. Please wait before trying again.',
        });
      }

      const roomRef = doc(db, COLLECTIONS.MULTIPLAYER_GAMES, roomCode);
      const roomSnap = await getDoc(roomRef);
      
      if (!roomSnap.exists()) {
        throw new Error('Room not found');
      }

      const roomData = roomSnap.data() as RoomData;
      
      // Verify host
      if (roomData.hostId !== hostId) {
        throw new Error('Only the host can reveal answers');
      }

      // Ensure revealedAnswers is an array
      if (!Array.isArray(roomData.revealedAnswers)) {
        logger.warn('⚠️ SERVICE: revealedAnswers is not an array, initializing:', roomData.revealedAnswers);
        roomData.revealedAnswers = Array(10).fill(null);
      }
      
      // Check if answer is already revealed
      if (roomData.revealedAnswers.some(ra => ra && ra.answerId === answer)) {
        throw new Error('Answer already revealed');
      }

      // Check if answer is correct (find matching answer in currentAnswers)
      const matchedAnswer = roomData.currentAnswers.find(a => 
        safeToLower(a.text) === safeToLower(answer)
      );
      if (!matchedAnswer) {
        throw new Error('Answer is not correct');
      }

      // Add to revealed answers
      const newRevealedAnswers = [...roomData.revealedAnswers, answer];
      
      // Award points to players who submitted this answer
      const playerSubmissions = { ...roomData.playerSubmissions };
      const answerIndex = roomData.currentAnswers.findIndex(a => 
        safeToLower(a.text) === safeToLower(answer)
      );
      const points = pointsForRank(matchedAnswer.rank);
      
      Object.keys(playerSubmissions).forEach(playerId => {
        const submission = playerSubmissions[playerId];
        // Check if player submitted this answer (with fuzzy matching)
        const hasAnswer = submission.answers.some(submittedAnswer => 
          this.isAnswerCorrect(submittedAnswer, [answer])
        );
        
        if (hasAnswer) {
          submission.points += points;
          logger.log(`✅ Player ${playerId} awarded ${points} points for answer "${answer}"`);
        }
      });

      await updateDoc(roomRef, {
        revealedAnswers: newRevealedAnswers,
        playerSubmissions,
        lastActivity: Date.now()
      });

      await RateLimitService.recordAction(hostId, 'revealAnswer', { roomCode }).catch(() => {});
      logger.log(`✅ Answer "${answer}" revealed in room ${roomCode}`);
    } catch (error) {
      logger.error('Error revealing answer:', error);
      throw error;
    }
  }

  /**
   * Moves to the next question (host only)
   */
  async nextQuestion(roomCode: string, hostId: string): Promise<void> {
    try {
      const roomRef = doc(db, COLLECTIONS.MULTIPLAYER_GAMES, roomCode);
      const roomSnap = await getDoc(roomRef);
      
      if (!roomSnap.exists()) {
        throw new Error('Room not found');
      }

      const roomData = roomSnap.data() as RoomData;
      
      // Verify host
      if (roomData.hostId !== hostId) {
        throw new Error('Only the host can advance questions');
      }

      const nextIndex = roomData.currentQuestionIndex + 1;
      
      if (nextIndex >= roomData.questions.length) {
        // Game finished
        await updateDoc(roomRef, {
          status: 'finished',
          gamePhase: 'finished',
          lastActivity: Date.now()
          });
        } else {
        // Next question
        const nextQuestion = roomData.questions[nextIndex];
        
        await updateDoc(roomRef, {
          currentQuestionIndex: nextIndex,
          gamePhase: 'question',
          questionStartTime: serverTimestamp(), // Use server timestamp for synchronization
          currentAnswers: nextQuestion.answers,
          revealedAnswers: [],
          playerSubmissions: {},
          lastActivity: serverTimestamp()
        });
      }

      logger.log(`✅ Advanced to question ${nextIndex + 1} in room ${roomCode}`);
    } catch (error) {
      logger.error('Error advancing question:', error);
      throw error;
    }
  }

  /**
   * Find matching answer using enhanced fuzzy matching
   */
  private findMatchingAnswer(userAnswer: string, correctAnswers: Answer[]): Answer | null {
    if (!userAnswer || !correctAnswers || correctAnswers.length === 0) {
      return null;
    }

    // Use enhanced fuzzy matching
    const matchResult = findBestMatch(userAnswer, correctAnswers);
    
    if (matchResult.isMatch && matchResult.matchedAnswer) {
      logger.log(`✅ FUZZY MATCH: "${userAnswer}" -> "${matchResult.officialAnswer}" (confidence: ${matchResult.confidence}, similarity: ${matchResult.similarity.toFixed(3)})`);
      return matchResult.matchedAnswer;
    }
    
    logger.log(`❌ NO MATCH: "${userAnswer}" (best similarity: ${matchResult.similarity.toFixed(3)})`);
    return null;
  }

  /**
   * Calculates points for submitted answers using unified scoring system
   */
  private calculatePoints(submittedAnswers: string[], correctAnswers: Answer[]): number {
    let totalPoints = 0;
    
    for (const submittedAnswer of submittedAnswers) {
      const matchedAnswer = this.findMatchingAnswer(submittedAnswer, correctAnswers);
      if (matchedAnswer) {
        totalPoints += pointsForRank(matchedAnswer.rank);
      }
    }
    
    return totalPoints;
  }

  /**
   * Checks if a submitted answer matches any correct answer (with fuzzy matching)
   */
  private isAnswerCorrect(submittedAnswer: string, correctAnswers: string[]): boolean {
    const normalizedSubmitted = submittedAnswer.toLowerCase().trim();
    
    for (const correct of correctAnswers) {
      const normalizedCorrect = correct.toLowerCase().trim();
      
      // Exact match
      if (normalizedSubmitted === normalizedCorrect) {
        return true;
      }
      
      // Fuzzy match with 80% similarity threshold
      const similarity = 1 - (distance(normalizedSubmitted, normalizedCorrect) / Math.max(normalizedSubmitted.length, normalizedCorrect.length));
      if (similarity >= 0.8) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Subscribes to room updates
   */
  subscribeToRoom(roomCode: string, callback: (roomData: RoomData | null) => void): () => void {
    const roomRef = doc(db, COLLECTIONS.MULTIPLAYER_GAMES, roomCode);
    
    const unsubscribe = onSnapshot(roomRef, (snapshot) => {
      if (snapshot.exists()) {
        const roomData = snapshot.data() as RoomData;
        
        // Validate and sanitize room data before passing to callback
        const validatedRoomData = this.validateRoomDataForFirestore(roomData);
        
        callback(validatedRoomData);
      } else {
        callback(null);
      }
    }, (error) => {
      logger.error('Error listening to room updates:', error);
      callback(null);
    });

    // Store unsubscribe function
    this.unsubscribeFunctions.set(roomCode, unsubscribe);
    
    return () => {
      unsubscribe();
      this.unsubscribeFunctions.delete(roomCode);
    };
  }

  /**
   * Cleans up all subscriptions
   */
  cleanup(): void {
    this.unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    this.unsubscribeFunctions.clear();
    
    // Clean up connection monitoring
    this.connectionMonitor.forEach(timer => clearTimeout(timer));
    this.connectionMonitor.clear();
    
    // Clean up edge case handler
    this.edgeCaseHandler.cleanupListeners();
  }

  // ========================================
  // EDGE CASE HANDLING METHODS
  // ========================================

  /**
   * Start connection monitoring for a player
   */
  private startConnectionMonitoring(roomCode: string, playerId: string, isHost: boolean): void {
    const monitorKey = `${roomCode}-${playerId}`;
    
    // Clear existing monitor
    const existingTimer = this.connectionMonitor.get(monitorKey);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }
    
    // Start new monitor with proper presence check
    const timer = setTimeout(async () => {
      try {
        // Check if player is actually disconnected by verifying room state
        const roomRef = doc(db, COLLECTIONS.MULTIPLAYER_GAMES, roomCode);
        const roomSnap = await getDoc(roomRef);
        
        if (!roomSnap.exists()) {
          logger.log(`Room ${roomCode} no longer exists, stopping monitoring for ${playerId}`);
          return;
        }
        
        const roomData = roomSnap.data() as RoomData;
        const player = roomData.players?.[playerId];
        
        // Only trigger disconnection if player is not in room or marked as disconnected
        if (!player || !player.isConnected) {
          logger.log(`Player ${playerId} confirmed disconnected, handling disconnection`);
          if (isHost) {
            await this.edgeCaseHandler.handleHostDisconnection(roomCode, playerId);
          } else {
            await this.edgeCaseHandler.handlePlayerDisconnection(roomCode, playerId);
          }
        } else {
          logger.log(`Player ${playerId} still connected, extending monitoring`);
          // Player is still connected, extend monitoring
          this.startConnectionMonitoring(roomCode, playerId, isHost);
        }
      } catch (error) {
        logger.error(`Error in connection monitoring for ${playerId}:`, error);
        // On error, don't trigger disconnection to avoid false positives
      }
    }, isHost ? TIMING.TIMEOUT_30_SECONDS : TIMING.TIMEOUT_60_SECONDS);
    
    this.connectionMonitor.set(monitorKey, timer);
  }

  /**
   * Stop connection monitoring for a player
   */
  private stopConnectionMonitoring(roomCode: string, playerId: string): void {
    const monitorKey = `${roomCode}-${playerId}`;
    const timer = this.connectionMonitor.get(monitorKey);
    
    if (timer) {
      clearTimeout(timer);
      this.connectionMonitor.delete(monitorKey);
    }
  }

  /**
   * Handle malicious player activity
   */
  private async handleMaliciousActivity(roomCode: string, playerId: string, action: string): Promise<boolean> {
    return await this.edgeCaseHandler.handleMaliciousPlayer(roomCode, playerId, action);
  }

  /**
   * Validate room data integrity
   */
  private async validateRoomData(roomCode: string): Promise<boolean> {
    try {
      const roomRef = doc(db, COLLECTIONS.MULTIPLAYER_GAMES, roomCode);
      const roomSnap = await getDoc(roomRef);
      
      if (!roomSnap.exists()) {
        return false;
      }
      
      const roomData = roomSnap.data() as RoomData;
      
      // Check for required fields
      if (!roomData.roomCode || !roomData.hostId || !roomData.players) {
        logger.log('🚨 Room data corruption detected, attempting repair...');
        await this.edgeCaseHandler.handleRoomDataCorruption(roomCode);
        return false;
      }
      
      return true;
    } catch (error) {
      logger.error('❌ Error validating room data:', error);
      return false;
    }
  }

  /**
   * Sanitize object for Firestore compatibility by removing undefined values
   */
  private sanitizeObjectForFirestore(obj: unknown): unknown {
    if (obj === null || obj === undefined) {
      return null;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObjectForFirestore(item)).filter(item => item !== undefined);
    }
    
    if (typeof obj === 'object') {
      const sanitized: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined) {
          sanitized[key] = this.sanitizeObjectForFirestore(value);
        }
      }
      return sanitized;
    }
    
    return obj;
  }

  /**
   * Validate room data structure before Firestore write
   */
  private validateRoomDataStructure(roomData: unknown): boolean {
    const requiredFields = [
      'roomCode', 'hostId', 'createdAt', 'status', 'category', 
      'questions', 'currentQuestionIndex', 'players', 'gamePhase'
    ];
    
    for (const field of requiredFields) {
      if (roomData[field] === undefined) {
        logger.error(`❌ Required field '${field}' is undefined`);
        return false;
      }
    }
    
    // Validate questions array
    if (!Array.isArray(roomData.questions)) {
      logger.error('❌ Questions is not an array');
      return false;
    }
    
    if (roomData.questions.length === 0) {
      logger.error('❌ Questions array is empty');
      return false;
    }
    
    for (let i = 0; i < roomData.questions.length; i++) {
      const question = roomData.questions[i];
      if (!question.id || !question.text || question.text.trim() === '') {
        logger.error(`❌ Invalid question structure at index ${i}:`, question);
        return false;
      }
      if (!Array.isArray(question.answers) || question.answers.length === 0) {
        logger.error(`❌ Invalid answers array for question at index ${i}:`, question);
        return false;
      }
    }
    
    return true;
  }

  /**
   * Debug log object and detect undefined values
   */
  private debugLogObject(obj: unknown, name: string): void {
    // Debug logging disabled for production
  }

  /**
   * Prepare questions for room creation with proper structure
   */
  private prepareQuestionsForRoom(questions: Question[]): Question[] {
    if (!questions || questions.length === 0) {
      throw new Error('No questions provided for room creation.');
    }
    
    const preparedQuestions = questions
      .filter(question => {
        // More lenient validation - just check for basic structure
        const isValid = question && 
          question.text && 
          question.text.trim() !== '' && 
          Array.isArray(question.answers) && 
          question.answers.length > 0;
        
        if (!isValid) {
          logger.warn('⚠️ Skipping invalid question:', question);
        }
        
        return isValid;
      })
      .map((question, index) => {
        // Clean and prepare each question - handle both string[] and Answer[] formats
        const cleanAnswers: Answer[] = question.answers
          .filter(a => a !== undefined && a !== null)
          .map((a, answerIndex) => {
            if (typeof a === 'string') {
              return {
                id: `${question.id || `question_${index}`}_answer_${answerIndex}`,
                text: safeToLower(a),
                rank: answerIndex + 1,
                aliases: []
              };
            } else {
              return {
                id: a.id || `${question.id || `question_${index}`}_answer_${answerIndex}`,
                text: safeToLower(a.text),
                rank: a.rank || (answerIndex + 1),
                aliases: a.aliases || []
              };
            }
          });
        
        return {
          id: question.id || `question_${index}_${Date.now()}`,
          text: safeToLower(question.text),
          answers: cleanAnswers,
          category: question.category || 'General',
          difficulty: question.difficulty || 'medium'
        };
      });
    
    if (preparedQuestions.length === 0) {
      throw new Error('No valid questions found after processing. Please check your question data.');
    }
    
    return preparedQuestions;
  }

  /**
   * Validate room data for Firestore compatibility
   */
  private validateRoomDataForFirestore(roomData: RoomData): Record<string, unknown> {
    // Remove any undefined values and ensure all fields are Firestore-compatible
    const validated = { ...roomData };
    
    // Ensure all required fields have valid values
    validated.roomCode = validated.roomCode || '';
    validated.hostId = validated.hostId || '';
    validated.category = validated.category || 'General';
    validated.status = validated.status || 'lobby';
    validated.gamePhase = validated.gamePhase || 'lobby';
    validated.questions = validated.questions || [];
    validated.currentQuestionIndex = validated.currentQuestionIndex || 0;
    validated.questionStartTime = validated.questionStartTime || 0;
    validated.questionTimeLimit = validated.questionTimeLimit || 60;
    validated.currentAnswers = validated.currentAnswers || [];
    validated.revealedAnswers = validated.revealedAnswers || [];
    validated.playerSubmissions = validated.playerSubmissions || {};
    validated.maxPlayers = validated.maxPlayers || 8;
    validated.isPrivate = validated.isPrivate || false;
    validated.createdAt = validated.createdAt || Date.now();
    validated.lastActivity = validated.lastActivity || Date.now();
    
    // Ensure players object is valid
    if (!validated.players || typeof validated.players !== 'object') {
      validated.players = {};
    }
    
    // Validate each player object
    Object.keys(validated.players).forEach(playerId => {
      const player = validated.players[playerId];
      if (player) {
        player.id = player.id || playerId;
        player.name = player.name || 'Player';
        player.score = player.score || 0;
        player.isHost = player.isHost || false;
        player.joinedAt = player.joinedAt || Date.now();
        player.isConnected = player.isConnected || false;
        player.lastSeen = player.lastSeen || Date.now();
      }
    });
    
    return validated;
  }

  /**
   * Gets room data without subscribing
   */
  async getRoom(roomCode: string): Promise<RoomData | null> {
    try {
      const roomRef = doc(db, COLLECTIONS.MULTIPLAYER_GAMES, roomCode);
      const roomSnap = await getDoc(roomRef);
      
      if (roomSnap.exists()) {
        return roomSnap.data() as RoomData;
      }
      return null;
    } catch (error) {
      logger.error('Error getting room:', error);
      return null;
    }
  }
}

// Export singleton instance
const multiplayerService = new MultiplayerService();
export default multiplayerService;



