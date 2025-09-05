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
  arrayRemove,
  query,
  where,
  getDocs,
  deleteDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { AuthService } from './authService';
import { EdgeCaseHandler } from './edgeCaseHandler';
import { distance } from 'fastest-levenshtein';
import { Question, Answer, RoomData, Player, GamePhase, RoomStatus } from '../types/game';
import { normalizeQuestion, safeToLower, assertQuestionShape } from './questionsService';
import { pointsForRank } from './scoring';
import { awardAnswer, startRound, endRound, updatePlayerPresence } from './multiplayerTransaction';
import { getServerTimeOffset, calculateTimeRemaining, formatTimeRemaining } from './timeSync';

// Re-export types from unified game types
export type { Player, Question, RoomData, AnswerResult, GameResult } from '../types/game';

class MultiplayerService {
  private unsubscribeFunctions: Map<string, () => void> = new Map();
  private authService = AuthService.getInstance();
  private edgeCaseHandler = EdgeCaseHandler.getInstance();
  private connectionMonitor: Map<string, NodeJS.Timeout> = new Map();
  private lastActivity: Map<string, number> = new Map();

  /**
   * Ensures the user is authenticated, signs them in anonymously if not
   */
  private async ensureAuthenticated(): Promise<string> {
    return this.authService.ensureAuthenticated();
  }

  /**
   * Generates a unique 6-character room code
   */
  private generateRoomCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Checks if a room code is already in use
   */
  private async isRoomCodeAvailable(roomCode: string): Promise<boolean> {
    try {
      const roomRef = doc(db, 'multiplayerGames', roomCode);
      const roomSnap = await getDoc(roomRef);
      return !roomSnap.exists();
    } catch (error) {
      console.error('Error checking room code availability:', error);
      return false;
    }
  }

  /**
   * Creates a new multiplayer room with comprehensive edge case handling
   */
  async createRoom(hostId: string, category: string, questions: any[]): Promise<string> {
    try {
      console.log('🔍 DEBUG: Starting room creation...');
      
      // Check current auth state
      const currentUser = this.authService.getCurrentUserId();
      console.log('🔍 DEBUG: Current user before auth:', currentUser);
      
      // Ensure authentication with edge case handling
      const userId = await this.ensureAuthenticated();
      console.log('🔍 DEBUG: User ID after auth:', userId);
      
      // Check for rate limiting
      if (await this.checkRateLimit(userId, 'room_creation')) {
        throw new Error('Too many room creation attempts. Please wait before creating another room.');
      }
      
      // Test a simple write first with Firebase outage handling
      console.log('🔍 DEBUG: Testing basic Firestore write...');
      try {
        const testRef = doc(db, 'test', 'testDoc');
        await setDoc(testRef, { 
          test: true, 
          userId: userId,
          timestamp: serverTimestamp()
        });
        console.log('✅ DEBUG: Basic Firestore write successful!');
      } catch (testError) {
        console.error('❌ DEBUG: Basic Firestore write failed:', testError);
        // Handle Firebase outage
        await this.edgeCaseHandler.handleFirebaseOutage();
        throw testError;
      }
      
      // Generate unique room code with collision handling
      console.log('🔍 DEBUG: Generating room code...');
      let roomCode: string;
      let attempts = 0;
      do {
        roomCode = this.generateRoomCode();
        attempts++;
        if (attempts > 10) {
          // Handle duplicate room code edge case
          roomCode = await this.edgeCaseHandler.handleDuplicateRoomCode(roomCode);
          break;
        }
      } while (!(await this.isRoomCodeAvailable(roomCode)));
      console.log('🔍 DEBUG: Room code generated:', roomCode);

      const now = Date.now();
      
      // Normalize questions to unified format
      const preparedQuestions = (questions || []).map(q => normalizeQuestion(q));
      console.log('🔍 DEBUG: Normalized questions:', preparedQuestions);
      
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
            name: 'Host', // Will be updated with actual name
            score: 0,
            isHost: true,
            joinedAt: now,
            isConnected: true,
            lastSeen: now
          }
        },
        gamePhase: 'lobby',
        questionStartTime: 0, // Use 0 instead of null for Firestore compatibility
        questionTimeLimit: 60, // 60 seconds per question
        currentAnswers: [],
        revealedAnswers: [],
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
        console.error('❌ Sanitized data still contains undefined values:', sanitizedRoomData);
        throw new Error('Data sanitization failed - undefined values detected');
      }
      
      // Validate room data structure
      if (!this.validateRoomDataStructure(sanitizedRoomData)) {
        throw new Error('Room data validation failed');
      }
      
      // Apply additional Firestore compatibility validation
      const validatedRoomData = this.validateRoomDataForFirestore(sanitizedRoomData);
      console.log('🔍 DEBUG: Final validated room data:', JSON.stringify(validatedRoomData, null, 2));
      
      // Write with concurrent state change handling
      console.log('🔍 DEBUG: Writing to Firestore collection: multiplayerGames, doc:', roomCode);
      const success = await this.edgeCaseHandler.handleConcurrentStateChange(roomCode, async () => {
        const roomRef = doc(db, 'multiplayerGames', roomCode);
        await setDoc(roomRef, validatedRoomData);
      });

      if (!success) {
        throw new Error('Failed to create room due to concurrent state changes');
      }

      // Start connection monitoring for the host
      this.startConnectionMonitoring(roomCode, userId, true);

      console.log('✅ DEBUG: Room created successfully:', roomCode);
      return roomCode;
    } catch (error) {
      console.error('❌ DEBUG: Error in createRoom:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: (error as any)?.code,
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Handle authentication failures
      if (error instanceof Error && error.message.includes('authentication')) {
        await this.edgeCaseHandler.handleAuthenticationFailure(hostId);
      }
      
      throw new Error('Failed to create room');
    }
  }

  /**
   * Simplified room creation for testing
   */
  async createRoomSimple(): Promise<string> {
    try {
      console.log('🔍 Testing simplified room creation...');
      
      // Ensure user is authenticated
      const userId = await this.ensureAuthenticated();
      console.log('Creating room with user:', userId);
      
      // Generate simple room code
      const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      // Minimal room data
      const roomData = {
        roomCode: roomCode,
        hostId: userId,
        createdAt: serverTimestamp(),
        status: 'lobby'
      };
      
      console.log('🔍 DEBUG: Simple room data:', roomData);
      
      // Try to write
      const roomRef = doc(db, 'multiplayerGames', roomCode);
      await setDoc(roomRef, roomData);
      
      console.log('✅ Simple room created:', roomCode);
      return roomCode;
      
    } catch (error) {
      console.error('❌ Simple room creation failed:', error);
      throw error;
    }
  }

  /**
   * Joins an existing room with comprehensive edge case handling
   */
  async joinRoom(roomCode: string, playerId: string, playerName: string): Promise<boolean> {
    try {
      await this.ensureAuthenticated();
      
      // Check for malicious activity
      if (await this.handleMaliciousActivity(roomCode, playerId, 'join_room')) {
        throw new Error('Suspicious activity detected. Please try again later.');
      }
      
      const roomRef = doc(db, 'multiplayerGames', roomCode);
      const roomSnap = await getDoc(roomRef);
      
      if (!roomSnap.exists()) {
        throw new Error('Room not found');
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
      if (Object.keys(roomData.players).length >= roomData.maxPlayers) {
        throw new Error('Room is full');
      }

      // Check if room is still in lobby
      if (roomData.status !== 'lobby') {
        throw new Error('Game has already started');
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
        lastSeen: now
      };

      const success = await this.edgeCaseHandler.handleConcurrentStateChange(roomCode, async () => {
        await updateDoc(roomRef, {
          [`players.${playerId}`]: newPlayer,
          lastActivity: serverTimestamp()
        });
      });

      if (!success) {
        throw new Error('Failed to join room due to concurrent state changes');
      }

      // Start connection monitoring for the player
      this.startConnectionMonitoring(roomCode, playerId, false);

      console.log(`✅ Player ${playerName} joined room ${roomCode}`);
      return true;
    } catch (error) {
      console.error('Error joining room:', error);
      
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
      const roomRef = doc(db, 'multiplayerGames', roomCode);
      const roomSnap = await getDoc(roomRef);
      
      if (!roomSnap.exists()) {
        return; // Room doesn't exist, nothing to do
      }

      const roomData = roomSnap.data() as RoomData;
      
      // If host is leaving, transfer host to another player or end room
      if (roomData.hostId === playerId) {
        const otherPlayers = Object.values(roomData.players).filter(p => p.id !== playerId);
        
        if (otherPlayers.length > 0) {
          // Transfer host to first other player
          const newHost = otherPlayers[0];
          await updateDoc(roomRef, {
            hostId: newHost.id,
            [`players.${newHost.id}.isHost`]: true,
            [`players.${playerId}`]: arrayRemove(),
            lastActivity: Date.now()
          });
        } else {
          // No other players, delete the room
          await deleteDoc(roomRef);
        }
      } else {
        // Regular player leaving
        await updateDoc(roomRef, {
          [`players.${playerId}`]: arrayRemove(),
          lastActivity: Date.now()
        });
      }

      console.log(`✅ Player ${playerId} left room ${roomCode}`);
    } catch (error) {
      console.error('Error leaving room:', error);
      throw error;
    }
  }

  /**
   * Starts the game (host only)
   */
  async startGame(roomCode: string, hostId: string): Promise<void> {
    try {
      console.log('🎮 ROOM_START: Starting game in room:', roomCode, 'for host:', hostId);
      
      const roomRef = doc(db, 'multiplayerGames', roomCode);
      const roomSnap = await getDoc(roomRef);
      
      if (!roomSnap.exists()) {
        throw new Error('Room not found');
      }

      const roomData = roomSnap.data() as RoomData;
      console.log('🔍 DEBUG: Room data retrieved:', {
        roomCode: roomData.roomCode,
        hostId: roomData.hostId,
        status: roomData.status,
        playerCount: Object.keys(roomData.players).length,
        questionsCount: roomData.questions?.length || 0,
        category: roomData.category
      });
      
      // Verify host
      if (roomData.hostId !== hostId) {
        throw new Error('Only the host can start the game');
      }

      // Check minimum players
      if (Object.keys(roomData.players).length < 1) {
        throw new Error('Need at least 1 player to start');
      }

      // Validate questions array
      if (!roomData.questions || roomData.questions.length === 0) {
        throw new Error('No questions available. Please select questions before starting the game.');
      }

      // Start the game using transaction
      const result = await startRound(roomCode, hostId, 0, 60);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to start game');
      }

      console.log(`✅ ROOM_START: Game started in room ${roomCode}`);
    } catch (error) {
      console.error('❌ ROOM_START: Error starting game:', error);
      throw error;
    }
  }

  /**
   * Ends the game (host only)
   */
  async endGame(roomCode: string, hostId: string): Promise<void> {
    try {
      const roomRef = doc(db, 'multiplayerGames', roomCode);
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

      console.log(`✅ Game ended in room ${roomCode}`);
    } catch (error) {
      console.error('Error ending game:', error);
      throw error;
    }
  }

  /**
   * Kicks a player from the room (host only)
   */
  async kickPlayer(roomCode: string, hostId: string, targetPlayerId: string): Promise<void> {
    try {
      const roomRef = doc(db, 'multiplayerGames', roomCode);
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

      await updateDoc(roomRef, {
        [`players.${targetPlayerId}`]: arrayRemove(),
        lastActivity: Date.now()
      });

      console.log(`✅ Player ${targetPlayerId} kicked from room ${roomCode}`);
    } catch (error) {
      console.error('Error kicking player:', error);
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

      const roomRef = doc(db, 'multiplayerGames', roomCode);
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
      const processedAnswers: any[] = [];
      
      for (const answer of validAnswers) {
        try {
          // Find matching answer in current question
          const currentQuestion = roomData.questions?.[roomData.currentQuestionIndex || 0];
          if (!currentQuestion) {
            console.log(`Answer "${answer}" - no current question`);
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
              console.log(`✅ AWARD_ANSWER: Awarded ${awardResult.points} points for "${answer}"`);
            } else {
              console.log(`⚠️ AWARD_ANSWER: Failed to award points for "${answer}": ${awardResult.error}`);
            }
          } else {
            console.log(`Answer "${answer}" was not correct`);
          }
        } catch (error) {
          console.log(`Answer "${answer}" processing error:`, error instanceof Error ? error.message : 'Unknown error');
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

      console.log(`✅ Player ${playerId} submitted answers for room ${roomCode}, earned ${totalPoints} points`);
    } catch (error) {
      console.error('Error submitting answers:', error);
      throw error;
    }
  }

  /**
   * Reveals an answer and awards points (host only)
   */
  async revealAnswer(roomCode: string, hostId: string, answer: string): Promise<void> {
    try {
      const roomRef = doc(db, 'multiplayerGames', roomCode);
      const roomSnap = await getDoc(roomRef);
      
      if (!roomSnap.exists()) {
        throw new Error('Room not found');
      }

      const roomData = roomSnap.data() as RoomData;
      
      // Verify host
      if (roomData.hostId !== hostId) {
        throw new Error('Only the host can reveal answers');
      }

      // Check if answer is already revealed
      if (roomData.revealedAnswers.includes(answer)) {
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
          console.log(`✅ Player ${playerId} awarded ${points} points for answer "${answer}"`);
        }
      });

      await updateDoc(roomRef, {
        revealedAnswers: newRevealedAnswers,
        playerSubmissions,
        lastActivity: Date.now()
      });

      console.log(`✅ Answer "${answer}" revealed in room ${roomCode}`);
    } catch (error) {
      console.error('Error revealing answer:', error);
      throw error;
    }
  }

  /**
   * Moves to the next question (host only)
   */
  async nextQuestion(roomCode: string, hostId: string): Promise<void> {
    try {
      const roomRef = doc(db, 'multiplayerGames', roomCode);
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

      console.log(`✅ Advanced to question ${nextIndex + 1} in room ${roomCode}`);
    } catch (error) {
      console.error('Error advancing question:', error);
      throw error;
    }
  }

  /**
   * Find matching answer using safe string comparison
   */
  private findMatchingAnswer(userAnswer: string, correctAnswers: Answer[]): Answer | null {
    if (!userAnswer || !correctAnswers || correctAnswers.length === 0) {
      return null;
    }

    const normalizedUserAnswer = safeToLower(userAnswer);
    
    // Check for exact matches first
    for (const answer of correctAnswers) {
      const normalizedText = safeToLower(answer.text);
      
      if (normalizedText === normalizedUserAnswer) {
        return answer;
      }
      
      // Check aliases
      if (answer.aliases && Array.isArray(answer.aliases)) {
        for (const alias of answer.aliases) {
          if (safeToLower(alias) === normalizedUserAnswer) {
            return answer;
          }
        }
      }
      
      // Check for partial matches
      if (normalizedText.includes(normalizedUserAnswer) || normalizedUserAnswer.includes(normalizedText)) {
        return answer;
      }
    }
    
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
    const roomRef = doc(db, 'multiplayerGames', roomCode);
    
    const unsubscribe = onSnapshot(roomRef, (snapshot) => {
      if (snapshot.exists()) {
        const roomData = snapshot.data() as RoomData;
        
        // Validate and sanitize room data before passing to callback
        const validatedRoomData = this.validateRoomDataForFirestore(roomData);
        
        console.log('Room data received from Firestore:', {
          roomCode: validatedRoomData.roomCode,
          playersCount: Object.keys(validatedRoomData.players).length,
          players: Object.values(validatedRoomData.players).map(p => {
            const player = p as Player;
            return {
              id: player.id,
              name: player.name,
              isHost: player.isHost
            };
          })
        });
        
        callback(validatedRoomData);
      } else {
        callback(null);
      }
    }, (error) => {
      console.error('Error listening to room updates:', error);
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
   * Check rate limiting for user actions
   */
  private async checkRateLimit(userId: string, action: string): Promise<boolean> {
    const now = Date.now();
    const key = `${userId}-${action}`;
    const lastActivity = this.lastActivity.get(key) || 0;
    
    // Check if user has exceeded rate limit
    if (action === 'room_creation') {
      const timeSinceLastCreation = now - lastActivity;
      if (timeSinceLastCreation < 3600000) { // 1 hour
        return true; // Rate limited
      }
    }
    
    this.lastActivity.set(key, now);
    return false;
  }

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
    
    // Start new monitor
    const timer = setTimeout(async () => {
      if (isHost) {
        await this.edgeCaseHandler.handleHostDisconnection(roomCode, playerId);
      } else {
        await this.edgeCaseHandler.handlePlayerDisconnection(roomCode, playerId);
      }
    }, isHost ? 30000 : 60000); // 30s for host, 60s for players
    
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
      const roomRef = doc(db, 'multiplayerGames', roomCode);
      const roomSnap = await getDoc(roomRef);
      
      if (!roomSnap.exists()) {
        return false;
      }
      
      const roomData = roomSnap.data() as RoomData;
      
      // Check for required fields
      if (!roomData.roomCode || !roomData.hostId || !roomData.players) {
        console.log('🚨 Room data corruption detected, attempting repair...');
        await this.edgeCaseHandler.handleRoomDataCorruption(roomCode);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error validating room data:', error);
      return false;
    }
  }

  /**
   * Sanitize object for Firestore compatibility by removing undefined values
   */
  private sanitizeObjectForFirestore(obj: any): any {
    if (obj === null || obj === undefined) {
      return null;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObjectForFirestore(item)).filter(item => item !== undefined);
    }
    
    if (typeof obj === 'object') {
      const sanitized: any = {};
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
  private validateRoomDataStructure(roomData: any): boolean {
    const requiredFields = [
      'roomCode', 'hostId', 'createdAt', 'status', 'category', 
      'questions', 'currentQuestionIndex', 'players', 'gamePhase'
    ];
    
    for (const field of requiredFields) {
      if (roomData[field] === undefined) {
        console.error(`❌ Required field '${field}' is undefined`);
        return false;
      }
    }
    
    // Validate questions array
    if (!Array.isArray(roomData.questions)) {
      console.error('❌ Questions is not an array');
      return false;
    }
    
    if (roomData.questions.length === 0) {
      console.error('❌ Questions array is empty');
      return false;
    }
    
    for (let i = 0; i < roomData.questions.length; i++) {
      const question = roomData.questions[i];
      if (!question.id || !question.text || question.text.trim() === '') {
        console.error(`❌ Invalid question structure at index ${i}:`, question);
        return false;
      }
      if (!Array.isArray(question.answers) || question.answers.length === 0) {
        console.error(`❌ Invalid answers array for question at index ${i}:`, question);
        return false;
      }
    }
    
    return true;
  }

  /**
   * Debug log object and detect undefined values
   */
  private debugLogObject(obj: any, name: string): void {
    console.log(`🔍 DEBUG: ${name}:`, JSON.stringify(obj, (key, value) => {
      if (value === undefined) {
        console.warn(`⚠️ UNDEFINED VALUE found at key: ${key}`);
        return '<<UNDEFINED>>';
      }
      return value;
    }, 2));
  }

  /**
   * Prepare questions for room creation with proper structure
   */
  private prepareQuestionsForRoom(questions: Question[]): Question[] {
    console.log('🔍 DEBUG: Preparing questions for room:', questions);
    
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
          console.warn('⚠️ Skipping invalid question:', question);
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
    
    console.log('🔍 DEBUG: Prepared questions result:', preparedQuestions);
    
    if (preparedQuestions.length === 0) {
      throw new Error('No valid questions found after processing. Please check your question data.');
    }
    
    return preparedQuestions;
  }

  /**
   * Validate room data for Firestore compatibility
   */
  private validateRoomDataForFirestore(roomData: RoomData): any {
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
      const roomRef = doc(db, 'multiplayerGames', roomCode);
      const roomSnap = await getDoc(roomRef);
      
      if (roomSnap.exists()) {
        return roomSnap.data() as RoomData;
      }
      return null;
    } catch (error) {
      console.error('Error getting room:', error);
      return null;
    }
  }
}

// Export singleton instance
const multiplayerService = new MultiplayerService();
export default multiplayerService;


