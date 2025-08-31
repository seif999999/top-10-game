import { io, Socket } from 'socket.io-client';

// Types for multiplayer functionality
export interface MultiplayerPlayer {
  id: string;
  name: string;
  socketId: string;
  isReady: boolean;
  joinedAt: number;
}

export interface MultiplayerGameState {
  roomId: string;
  categoryId: string;
  gamePhase: 'lobby' | 'question' | 'answered' | 'results' | 'finished';
  currentRound: number;
  totalRounds: number;
  currentQuestion: any;
  players: MultiplayerPlayer[];
  scores: Record<string, number>;
  leaderboard: Array<{
    playerId: string;
    playerName: string;
    score: number;
  }>;
  questionStartTime: number | null;
  questionTimeLimit: number;
}

export interface AnswerResult {
  answer: string;
  isCorrect: boolean;
  points: number;
  newScore: number;
}

export interface MultiplayerEvents {
  onRoomJoined?: (data: { success: boolean; room: MultiplayerGameState; player: MultiplayerPlayer; error?: string }) => void;
  onPlayerJoined?: (data: { player: MultiplayerPlayer; room: MultiplayerGameState }) => void;
  onPlayerLeft?: (data: { playerId: string; room: MultiplayerGameState }) => void;
  onGameStarted?: (gameState: MultiplayerGameState) => void;
  onGameStateUpdate?: (gameState: MultiplayerGameState) => void;
  onAnswerResult?: (result: AnswerResult) => void;
  onQuestionEnded?: (gameState: MultiplayerGameState) => void;
  onNextQuestion?: (gameState: MultiplayerGameState) => void;
  onGameEnded?: (gameState: MultiplayerGameState) => void;
  onError?: (error: string) => void;
}

class MultiplayerService {
  private socket: Socket | null = null;
  private serverUrl: string = 'http://192.168.1.12:3001'; // Your computer's LAN IP for mobile testing
  private isConnected: boolean = false;
  private eventHandlers: MultiplayerEvents = {};

  constructor() {
    // Initialize socket connection with a delay to ensure app context is ready
    setTimeout(() => {
      this.initializeSocket();
    }, 2000);
  }

  /**
   * Initialize Socket.io connection
   */
  private initializeSocket() {
    try {
      console.log('🔌 Initializing multiplayer service for web...');
      console.log('🔌 Server URL:', this.serverUrl);
      
      this.socket = io(this.serverUrl, {
        transports: ['websocket'], // Force WebSocket only for mobile compatibility
        timeout: 20000,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });

      this.setupSocketEventHandlers();
      console.log('🔌 Multiplayer service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize multiplayer service:', error);
      this.eventHandlers.onError?.('Failed to connect to multiplayer server');
    }
  }

  /**
   * Setup Socket.io event handlers
   */
  private setupSocketEventHandlers() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('✅ Connected to multiplayer server');
      this.isConnected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Disconnected from multiplayer server');
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error);
      this.isConnected = false;
      this.eventHandlers.onError?.('Connection failed. Please check your internet connection.');
      
      // Retry connection after delay
      setTimeout(() => {
        if (!this.isConnected) {
          console.log('🔄 Retrying connection...');
          this.reconnect();
        }
      }, 3000);
    });

    this.socket.on('reconnect', () => {
      console.log('🔄 Reconnected to multiplayer server');
      this.isConnected = true;
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('❌ Reconnection error:', error);
      this.isConnected = false;
    });

    this.socket.on('reconnect_failed', () => {
      console.error('❌ Reconnection failed');
      this.isConnected = false;
      this.eventHandlers.onError?.('Failed to reconnect to multiplayer server');
    });

    // Game events
    this.socket.on('roomJoined', (data) => {
      console.log('🎯 Room joined:', data);
      this.eventHandlers.onRoomJoined?.(data);
    });

    this.socket.on('playerJoined', (data) => {
      console.log('👤 Player joined:', data);
      this.eventHandlers.onPlayerJoined?.(data);
    });

    this.socket.on('playerLeft', (data) => {
      console.log('👋 Player left:', data);
      this.eventHandlers.onPlayerLeft?.(data);
    });

    this.socket.on('gameStarted', (gameState) => {
      console.log('🎮 Game started:', gameState);
      this.eventHandlers.onGameStarted?.(gameState);
    });

    this.socket.on('gameStateUpdate', (gameState) => {
      console.log('🔄 Game state updated:', gameState);
      this.eventHandlers.onGameStateUpdate?.(gameState);
    });

    this.socket.on('answerResult', (result) => {
      console.log('📝 Answer result:', result);
      this.eventHandlers.onAnswerResult?.(result);
    });

    this.socket.on('questionEnded', (gameState) => {
      console.log('⏹️ Question ended:', gameState);
      this.eventHandlers.onQuestionEnded?.(gameState);
    });

    this.socket.on('nextQuestion', (gameState) => {
      console.log('⏭️ Next question:', gameState);
      this.eventHandlers.onNextQuestion?.(gameState);
    });

    this.socket.on('gameEnded', (gameState) => {
      console.log('🏁 Game ended:', gameState);
      this.eventHandlers.onGameEnded?.(gameState);
    });
  }

  /**
   * Set event handlers for multiplayer events
   */
  setEventHandlers(handlers: MultiplayerEvents) {
    this.eventHandlers = { ...this.eventHandlers, ...handlers };
  }

  /**
   * Join a multiplayer game room
   */
  joinRoom(roomId: string, playerId: string, playerName: string, categoryId: string) {
    if (!this.socket || !this.isConnected) {
      console.error('❌ Socket not connected');
      this.eventHandlers.onError?.('Not connected to server');
      return;
    }

    console.log(`🎯 Joining room ${roomId} as ${playerName}`);
    this.socket.emit('joinRoom', {
      roomId,
      playerId,
      playerName,
      categoryId
    });
  }

  /**
   * Start the multiplayer game
   */
  startGame(roomId: string) {
    if (!this.socket || !this.isConnected) {
      console.error('❌ Socket not connected');
      this.eventHandlers.onError?.('Not connected to server');
      return;
    }

    console.log(`🎮 Starting game in room ${roomId}`);
    this.socket.emit('startGame', { roomId });
  }

  /**
   * Submit an answer in multiplayer mode
   */
  submitAnswer(roomId: string, playerId: string, answer: string) {
    if (!this.socket || !this.isConnected) {
      console.error('❌ Socket not connected');
      this.eventHandlers.onError?.('Not connected to server');
      return;
    }

    console.log(`📝 Submitting answer: "${answer}" in room ${roomId}`);
    this.socket.emit('submitAnswer', {
      roomId,
      playerId,
      answer: answer.trim()
    });
  }

  /**
   * Move to the next question
   */
  nextQuestion(roomId: string) {
    if (!this.socket || !this.isConnected) {
      console.error('❌ Socket not connected');
      this.eventHandlers.onError?.('Not connected to server');
      return;
    }

    console.log(`⏭️ Moving to next question in room ${roomId}`);
    this.socket.emit('nextQuestion', { roomId });
  }

  /**
   * End the multiplayer game
   */
  endGame(roomId: string) {
    if (!this.socket || !this.isConnected) {
      console.error('❌ Socket not connected');
      this.eventHandlers.onError?.('Not connected to server');
      return;
    }

    console.log(`🏁 Ending game in room ${roomId}`);
    this.socket.emit('endGame', { roomId });
  }

  /**
   * Leave the current room
   */
  leaveRoom() {
    if (this.socket) {
      this.socket.disconnect();
      this.isConnected = false;
      console.log('👋 Left multiplayer room');
    }
  }

  /**
   * Check if connected to server
   */
  isConnectedToServer(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): 'connected' | 'connecting' | 'disconnected' {
    if (!this.socket) return 'disconnected';
    if (this.socket.connected) return 'connected';
    return 'connecting';
  }

  /**
   * Disconnect from server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.isConnected = false;
      console.log('🔌 Disconnected from multiplayer server');
    }
  }

  /**
   * Reconnect to server
   */
  reconnect() {
    this.disconnect();
    setTimeout(() => {
      this.initializeSocket();
    }, 1000);
  }
}

// Create singleton instance
const multiplayerService = new MultiplayerService();

export default multiplayerService;
