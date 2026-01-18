import React, { createContext, useContext, useReducer, ReactNode, useEffect, useCallback } from 'react';
import { RoomData, Player, Question, LegacyQuestion } from '../../shared/types/game';
import type { Timestamp } from 'firebase/firestore';
import { AppError, toAppError } from '../../shared/errors';
import type { AppErrorOptions } from '../../shared/errors';
import type { RootStackParamList } from '../../shared/types/navigation';
import multiplayerService from '../../backend/services/multiplayerService';
import { useAuth } from './AuthContext';
import { updatePlayerPresence } from '../../backend/services/multiplayerTransaction';
import { AuthService } from '../../backend/services/authService';
import { logger } from '../../backend/utils/logger';

// Enhanced multiplayer state interface
interface MultiplayerState {
  // Current State
  currentRoom: RoomData | null;
  isHost: boolean;
  playerRole: 'host' | 'player' | null;
  connectionStatus: 'connected' | 'connecting' | 'disconnected';
  
  // UI State
  loading: boolean;
  isStarting: boolean;
  error: string | null;
  
  // System Messages
  systemMessage: {
    type: 'host_migrated' | 'room_terminated' | 'game_terminated' | null;
    message: string;
    timestamp?: number | Timestamp;
    newHostId?: string;
    newHostName?: string;
  };
  
  // Host Migration State
  hostMigrationNotification: {
    type: 'host_migrated' | 'room_terminated' | null;
    newHostName?: string;
    message?: string;
  };
  
  // Room Creation
  selectedCategory: string | null;
  selectedQuestions: Array<Question | LegacyQuestion>;
  
  // Room Joining
  joinRoomCode: string;
  
  // Game State
  currentAnswer: string;
  submittedAnswers: string[];
  
  // Navigation callback for auto-navigation
  navigationCallback: ((params: RootStackParamList['GameScreen']) => void) | null;
  
  // Subscription Management
  unsubscribe: (() => void) | null;
}

// Action types
type MultiplayerAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_STARTING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_ROOM'; payload: { roomData: RoomData | null; userId?: string } }
  | { type: 'SET_HOST_STATUS'; payload: boolean }
  | { type: 'SET_CONNECTION_STATUS'; payload: 'connected' | 'connecting' | 'disconnected' }
  | { type: 'SET_CATEGORY'; payload: string | null }
  | { type: 'SET_QUESTIONS'; payload: Question[] }
  | { type: 'SET_JOIN_CODE'; payload: string }
  | { type: 'SET_CURRENT_ANSWER'; payload: string }
  | { type: 'SET_SUBMITTED_ANSWERS'; payload: string[] }
  | { type: 'ADD_SUBMITTED_ANSWER'; payload: string }
  | { type: 'SET_UNSUBSCRIBE'; payload: (() => void) | null }
  | { type: 'SET_NAVIGATION_CALLBACK'; payload: ((params: RootStackParamList['GameScreen']) => void) | null }
  | { type: 'SET_HOST_MIGRATION_NOTIFICATION'; payload: { type: 'host_migrated' | 'room_terminated' | null; newHostName?: string; message?: string } }
  | { type: 'CLEAR_HOST_MIGRATION_NOTIFICATION' }
  | { type: 'SET_SYSTEM_MESSAGE'; payload: { type: 'host_migrated' | 'room_terminated' | 'game_terminated' | null; message: string; timestamp?: number | Timestamp; newHostId?: string; newHostName?: string } }
  | { type: 'CLEAR_SYSTEM_MESSAGE' }
  | { type: 'RESET_ALL' }
  | { type: 'RESET_SELECTIONS' };

// Initial state
const initialState: MultiplayerState = {
  currentRoom: null,
  isHost: false,
  playerRole: null,
  connectionStatus: 'disconnected',
  loading: false,
  isStarting: false,
  error: null,
  systemMessage: {
    type: null,
    message: '',
    timestamp: undefined,
    newHostId: undefined,
    newHostName: undefined,
  },
  hostMigrationNotification: {
    type: null,
    newHostName: undefined,
    message: undefined,
  },
  selectedCategory: null,
  selectedQuestions: [],
  joinRoomCode: '',
  currentAnswer: '',
  submittedAnswers: [],
  navigationCallback: null,
  unsubscribe: null,
};

const buildMultiplayerError = (error: unknown, fallback: AppErrorOptions): AppError => {
  const appError = toAppError(error, fallback);
  logger.error(`❌ MultiplayerContext:${appError.code}`, appError);
  return appError;
};

// Reducer function
const multiplayerReducer = (state: MultiplayerState, action: MultiplayerAction): MultiplayerState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_STARTING':
      return { ...state, isStarting: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'SET_ROOM':
      const { roomData, userId } = action.payload;
      logger.log('🎮 MultiplayerContext - Room data updated:', {
        roomCode: roomData?.roomCode,
        gamePhase: roomData?.gamePhase,
        status: roomData?.status,
        questionsCount: roomData?.questions?.length,
        currentQuestionIndex: roomData?.currentQuestionIndex,
        playersCount: Object.keys(roomData?.players || {}).length,
        hostId: roomData?.hostId,
        currentUserId: userId,
        isHost: roomData ? roomData.hostId === userId : false,
        currentPlayerId: roomData?.currentPlayerId,
        turnStartTime: roomData?.turnStartTime,
        answersSubmittedCount: roomData?.answersSubmittedCount
      });
      
        // Additional debugging for scores and revealed answers
        if (roomData) {
          logger.log('🎯 CONTEXT_SCORE_DEBUG:', {
            scores: roomData.scores,
            revealedAnswers: roomData.revealedAnswers
          });
        
        // 📡 FIRESTORE LISTENER UPDATE DEBUG LOGGING
        logger.log('📡 FIRESTORE LISTENER UPDATE:', {
          timestamp: new Date().toISOString(),
          playersData: roomData.players,
          revealedAnswers: roomData.revealedAnswers,
          myPlayerId: userId,
          myScore: userId ? roomData.players?.[userId]?.score : 'N/A',
          totalPlayers: Object.keys(roomData.players || {}).length
        });
      }
      // Ensure revealedAnswers is always an array to prevent crashes
      if (roomData && (!Array.isArray(roomData.revealedAnswers))) {
        logger.warn('⚠️ CONTEXT: revealedAnswers is not an array, initializing:', roomData.revealedAnswers);
        roomData.revealedAnswers = Array(10).fill(null);
      }
      
      // Check for system messages in room data
      let newState = {
        ...state,
        currentRoom: roomData,
        isHost: roomData ? roomData.hostId === userId : false,
        playerRole: roomData ? (roomData.hostId === userId ? 'host' as const : 'player' as const) : null,
        connectionStatus: roomData ? 'connected' as const : 'disconnected' as const,
        error: null
      };
      
      // Handle system messages from room data
      if (roomData?.systemMessage && roomData.systemMessage.type) {
        logger.log('🔔 SYSTEM_MESSAGE: Received system message from room data:', roomData.systemMessage);
        newState = {
          ...newState,
          systemMessage: {
            type: roomData.systemMessage.type,
            message: roomData.systemMessage.message,
            timestamp: roomData.systemMessage.timestamp,
            newHostId: roomData.systemMessage.newHostId,
            newHostName: roomData.systemMessage.newHostName
          }
        };
      }
      
      return newState;
    
    case 'SET_HOST_STATUS':
      return { ...state, isHost: action.payload };
    
    case 'SET_CONNECTION_STATUS':
      return { ...state, connectionStatus: action.payload };
    
    case 'SET_CATEGORY':
      return { ...state, selectedCategory: action.payload };
    
    case 'SET_QUESTIONS':
      return { ...state, selectedQuestions: action.payload };
    
    case 'SET_JOIN_CODE':
      return { ...state, joinRoomCode: action.payload };
    
    case 'SET_CURRENT_ANSWER':
      return { ...state, currentAnswer: action.payload };
    
    case 'SET_SUBMITTED_ANSWERS':
      return { ...state, submittedAnswers: action.payload };
    
    case 'ADD_SUBMITTED_ANSWER':
      return { ...state, submittedAnswers: [...state.submittedAnswers, action.payload] };
    
    case 'SET_UNSUBSCRIBE':
      return { ...state, unsubscribe: action.payload };
    
    case 'SET_NAVIGATION_CALLBACK':
      return { ...state, navigationCallback: action.payload };
    
    case 'SET_HOST_MIGRATION_NOTIFICATION':
      return { ...state, hostMigrationNotification: action.payload };
    
    case 'CLEAR_HOST_MIGRATION_NOTIFICATION':
      return { 
        ...state, 
        hostMigrationNotification: { type: null, newHostName: undefined, message: undefined }
      };
    
    case 'SET_SYSTEM_MESSAGE':
      return { ...state, systemMessage: action.payload };
    
    case 'CLEAR_SYSTEM_MESSAGE':
      return { 
        ...state, 
        systemMessage: { type: null, message: '', timestamp: undefined, newHostId: undefined, newHostName: undefined }
      };
    
    case 'RESET_ALL':
      return initialState;
    
    case 'RESET_SELECTIONS':
      return {
        ...state,
        selectedCategory: null,
        selectedQuestions: [],
        joinRoomCode: '',
        currentAnswer: '',
        submittedAnswers: []
      };
    
    default:
      return state;
  }
};

// Context interface
interface MultiplayerContextType {
  // Current State
  currentRoom: RoomData | null;
  isHost: boolean;
  playerRole: 'host' | 'player' | null;
  connectionStatus: 'connected' | 'connecting' | 'disconnected';
  loading: boolean;
  isStarting: boolean;
  error: string | null;
  
  // System Messages
  systemMessage: {
    type: 'host_migrated' | 'room_terminated' | 'game_terminated' | null;
    message: string;
    timestamp?: number | Timestamp;
    newHostId?: string;
    newHostName?: string;
  };
  
  // Host Migration State
  hostMigrationNotification: {
    type: 'host_migrated' | 'room_terminated' | null;
    newHostName?: string;
    message?: string;
  };
  
  // Room Creation
  selectedCategory: string | null;
  selectedQuestions: Question[];
  
  // Room Joining
  joinRoomCode: string;
  
  // Game State
  currentAnswer: string;
  submittedAnswers: string[];
  
  // Actions
  createRoom: (category: string, questions: Array<Question | LegacyQuestion>) => Promise<string>;
  joinRoom: (roomCode: string) => Promise<boolean>;
  leaveRoom: () => Promise<void>;
  
  // Host Actions
  startGame: (roundTimeSeconds?: number) => Promise<void>;
  endGame: () => Promise<void>;
  kickPlayer: (playerId: string) => Promise<void>;
  nextQuestion: () => Promise<void>;
  revealAnswer: (answer: string) => Promise<void>;
  
  // Player Actions
  submitAnswers: (answers: string[]) => Promise<void>;
  advanceTurn: () => Promise<void>;
  skipTurn: () => Promise<void>;
  
  // Host Migration Actions
  handleHostDisconnection: (disconnectedHostId: string) => Promise<void>;
  clearHostMigrationNotification: () => void;
  terminateGame: (disconnectedPlayerId: string) => Promise<void>;
  
  // System Message Actions
  clearSystemMessage: () => void;
  
  // UI Actions
  setCategory: (category: string) => void;
  setQuestions: (questions: Array<Question | LegacyQuestion>) => void;
  setJoinRoomCode: (code: string) => void;
  setCurrentAnswer: (answer: string) => void;
  addSubmittedAnswer: (answer: string) => void;
  removeSubmittedAnswer: (index: number) => void;
  clearError: () => void;
  resetSelections: () => void;
  resetAll: () => void;
  
  // Navigation callback for auto-navigation
  setNavigationCallback: (callback: (params: RootStackParamList['GameScreen']) => void) => void;
  
  // Cleanup
  cleanup: () => void;
  
  // Subscription Management
  unsubscribe: (() => void) | null;
}

// Create context
const MultiplayerContext = createContext<MultiplayerContextType | undefined>(undefined);

// Provider component
export const MultiplayerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(multiplayerReducer, initialState);
  const { user } = useAuth();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      multiplayerService.cleanup();
    };
  }, []);

  // Auto-navigate to GameScreen when game starts - simplified dependencies
  useEffect(() => {
    logger.log('🎮 NAVIGATION_CHECK:', {
      hasRoom: !!state.currentRoom,
      status: state.currentRoom?.status,
      gamePhase: state.currentRoom?.gamePhase,
      hasCallback: !!state.navigationCallback,
      roomCode: state.currentRoom?.roomCode
    });
    
    if (state.currentRoom && state.currentRoom.status === 'playing' && state.currentRoom.gamePhase === 'question' && state.navigationCallback) {
      logger.log('🎮 CLIENT_NAVIGATE: Auto-navigating to GameScreen...');
      state.navigationCallback({
        roomId: state.currentRoom.roomCode,
        categoryId: state.currentRoom.category,
        isMultiplayer: true,
        roomCode: state.currentRoom.roomCode
      });
    }
  }, [state.currentRoom?.status, state.currentRoom?.gamePhase, state.navigationCallback]);

  // Presence monitoring and reconnection
  useEffect(() => {
    if (!state.currentRoom || !user?.id) return;

    const updatePresence = async () => {
      try {
        await updatePlayerPresence(state.currentRoom!.roomCode, user.id, true);
      } catch (error) {
        logger.warn('⚠️ PRESENCE: Failed to update presence:', error);
      }
    };

    // Update presence immediately
    updatePresence();

    // Set up periodic presence updates
    const presenceInterval = setInterval(updatePresence, 30000); // Every 30 seconds

    // Cleanup on unmount
    return () => {
      clearInterval(presenceInterval);
      if (state.currentRoom && user?.id) {
        updatePlayerPresence(state.currentRoom.roomCode, user.id, false).catch(logger.warn);
      }
    };
  }, [state.currentRoom?.roomCode, user?.id]);

  // Actions
  const createRoom = async (category: string, questions: Question[]): Promise<string> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      if (!user) {
        throw new AppError({
          code: 'MP_AUTH_REQUIRED',
          message: 'User not authenticated',
          userMessage: 'Please sign in to create a room.'
        });
      }

      // Sync AuthService with current user state to prevent race conditions
      const authService = AuthService.getInstance();
      authService.syncWithUser(user);

      const roomCode = await multiplayerService.createRoom(user.id, category, questions, user.displayName || user.email?.split('@')[0] || 'Player', user.selectedAvatar);
      
      // Subscribe to room updates
      const unsubscribe = multiplayerService.subscribeToRoom(roomCode, (roomData) => {
        dispatch({ type: 'SET_ROOM', payload: { roomData, userId: user?.id } });
      });

      dispatch({ type: 'SET_LOADING', payload: false });
      return roomCode;
    } catch (error) {
      const appError = buildMultiplayerError(error, {
        code: 'MP_CREATE_ROOM_FAILED',
        message: 'Failed to create room',
        userMessage: 'Failed to create room. Please try again.'
      });
      dispatch({ type: 'SET_ERROR', payload: appError.userMessage ?? appError.message });
      dispatch({ type: 'SET_LOADING', payload: false });
      throw appError;
    }
  };

  const joinRoom = async (roomCode: string): Promise<boolean> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      if (!user) {
        throw new AppError({
          code: 'MP_AUTH_REQUIRED',
          message: 'User not authenticated',
          userMessage: 'Please sign in to join a room.'
        });
      }

      // Sync AuthService with current user state to prevent race conditions
      const authService = AuthService.getInstance();
      authService.syncWithUser(user);

      const success = await multiplayerService.joinRoom(roomCode, user.id, user.displayName || 'Player', user.selectedAvatar);
      
      if (success) {
        // Subscribe to room updates
        const unsubscribe = multiplayerService.subscribeToRoom(roomCode, (roomData) => {
          dispatch({ type: 'SET_ROOM', payload: { roomData, userId: user?.id } });
        });
        
        // Store unsubscribe function for cleanup
        dispatch({ type: 'SET_UNSUBSCRIBE', payload: unsubscribe });
      }

      dispatch({ type: 'SET_LOADING', payload: false });
      return success;
    } catch (error) {
      const appError = buildMultiplayerError(error, {
        code: 'MP_JOIN_ROOM_FAILED',
        message: 'Failed to join room',
        userMessage: 'Failed to join room. Please try again.'
      });
      dispatch({ type: 'SET_ERROR', payload: appError.userMessage ?? appError.message });
      dispatch({ type: 'SET_LOADING', payload: false });
      throw appError;
    }
  };

  const leaveRoom = async (): Promise<void> => {
    try {
      if (!state.currentRoom) return;
      
      logger.log('🚪 Leaving room:', state.currentRoom.roomCode);
      await multiplayerService.leaveRoom(state.currentRoom.roomCode, user?.id || '');
      
      // Clean up subscription
      if (state.unsubscribe) {
        state.unsubscribe();
        dispatch({ type: 'SET_UNSUBSCRIBE', payload: null });
      }
      
      // Reset all state to allow creating new rooms
      dispatch({ type: 'RESET_ALL' });
      logger.log('✅ Room left successfully, state reset for new room creation');
    } catch (error) {
      const appError = buildMultiplayerError(error, {
        code: 'MP_LEAVE_ROOM_FAILED',
        message: 'Failed to leave room',
        userMessage: 'Failed to leave room. Please try again.'
      });
      dispatch({ type: 'SET_ERROR', payload: appError.userMessage ?? appError.message });
      throw appError;
    }
  };

  const startGame = async (roundTimeSeconds: number = 60): Promise<void> => {
    try {
      if (!state.currentRoom) {
        throw new AppError({
          code: 'MP_ROOM_NOT_FOUND',
          message: 'No room found',
          userMessage: 'Room not found.'
        });
      }
      
      if (!state.isHost) {
        throw new AppError({
          code: 'MP_HOST_ONLY',
          message: 'Only the host can start the game',
          userMessage: 'Only the host can start the game.'
        });
      }
      
      if (!user?.id) {
        throw new AppError({
          code: 'MP_AUTH_REQUIRED',
          message: 'User not authenticated',
          userMessage: 'Please sign in to start the game.'
        });
      }
      
      // Prevent double starts
      if (state.isStarting) {
        logger.log('⚠️ Start game already in progress, ignoring duplicate request');
        return;
      }
      
      dispatch({ type: 'SET_STARTING', payload: true });
      
      logger.log(`🎮 ROOM_START: Host starting game with ${roundTimeSeconds}s rounds...`);
      await multiplayerService.startGameV2(state.currentRoom.roomCode, user.id, roundTimeSeconds);
      logger.log('✅ ROOM_START: Game started successfully');
    } catch (error) {
      const appError = buildMultiplayerError(error, {
        code: 'MP_START_GAME_FAILED',
        message: 'Failed to start game',
        userMessage: 'Failed to start game. Please try again.'
      });
      dispatch({ type: 'SET_ERROR', payload: appError.userMessage ?? appError.message });
      throw appError;
    } finally {
      dispatch({ type: 'SET_STARTING', payload: false });
    }
  };

  const endGame = async (): Promise<void> => {
    try {
      if (!state.currentRoom) {
        throw new AppError({
          code: 'MP_ROOM_NOT_FOUND',
          message: 'No room found',
          userMessage: 'Room not found.'
        });
      }
      
      if (!state.isHost) {
        throw new AppError({
          code: 'MP_HOST_ONLY',
          message: 'Only the host can end the game',
          userMessage: 'Only the host can end the game.'
        });
      }
      
      if (!user?.id) {
        throw new AppError({
          code: 'MP_AUTH_REQUIRED',
          message: 'User not authenticated',
          userMessage: 'Please sign in to end the game.'
        });
      }
      
      logger.log('🏁 END_GAME: Host ending game...');
      await multiplayerService.endGameV2(state.currentRoom.roomCode, user.id);
      logger.log('✅ END_GAME: Game ended successfully');
    } catch (error) {
      const appError = buildMultiplayerError(error, {
        code: 'MP_END_GAME_FAILED',
        message: 'Failed to end game',
        userMessage: 'Failed to end game. Please try again.'
      });
      dispatch({ type: 'SET_ERROR', payload: appError.userMessage ?? appError.message });
      throw appError;
    }
  };

  const kickPlayer = async (playerId: string): Promise<void> => {
    try {
      if (!state.currentRoom || !user) return;
      
      await multiplayerService.kickPlayer(state.currentRoom.roomCode, user.id, playerId);
    } catch (error) {
      const appError = buildMultiplayerError(error, {
        code: 'MP_KICK_FAILED',
        message: 'Failed to kick player',
        userMessage: 'Failed to kick player. Please try again.'
      });
      dispatch({ type: 'SET_ERROR', payload: appError.userMessage ?? appError.message });
    }
  };

  const nextQuestion = async (): Promise<void> => {
    try {
      if (!state.currentRoom || !user) return;
      
      await multiplayerService.nextQuestion(state.currentRoom.roomCode, user.id);
    } catch (error) {
      const appError = buildMultiplayerError(error, {
        code: 'MP_NEXT_QUESTION_FAILED',
        message: 'Failed to advance question',
        userMessage: 'Failed to advance question. Please try again.'
      });
      dispatch({ type: 'SET_ERROR', payload: appError.userMessage ?? appError.message });
    }
  };

  const revealAnswer = async (answer: string): Promise<void> => {
    try {
      if (!state.currentRoom || !user) return;
      
      await multiplayerService.revealAnswer(state.currentRoom.roomCode, user.id, answer);
    } catch (error) {
      const appError = buildMultiplayerError(error, {
        code: 'MP_REVEAL_FAILED',
        message: 'Failed to reveal answer',
        userMessage: 'Failed to reveal answer. Please try again.'
      });
      dispatch({ type: 'SET_ERROR', payload: appError.userMessage ?? appError.message });
    }
  };

  const submitAnswers = async (answers: string[]): Promise<void> => {
    try {
      if (!state.currentRoom || !user) return;
      
      // Use the V2 answer submission system (single answer)
      if (answers.length > 0) {
        const result = await multiplayerService.submitAnswerV2(state.currentRoom.roomCode, user.id, answers[0]);
        if (result.success) {
          // Append to existing submitted answers instead of replacing
          dispatch({ type: 'ADD_SUBMITTED_ANSWER', payload: answers[0] });
        } else {
          throw new AppError({
            code: 'MP_SUBMIT_FAILED',
            message: result.error || 'Failed to submit answer',
            userMessage: result.error || 'Failed to submit answer. Please try again.'
          });
        }
      }
    } catch (error) {
      const appError = buildMultiplayerError(error, {
        code: 'MP_SUBMIT_FAILED',
        message: 'Failed to submit answers',
        userMessage: 'Failed to submit answers. Please try again.'
      });
      dispatch({ type: 'SET_ERROR', payload: appError.userMessage ?? appError.message });
    }
  };

  const advanceTurn = async (): Promise<void> => {
    try {
      if (!state.currentRoom || !user) return;
      
      await multiplayerService.advanceTurn(state.currentRoom.roomCode, user.id);
    } catch (error) {
      const appError = buildMultiplayerError(error, {
        code: 'MP_ADVANCE_TURN_FAILED',
        message: 'Failed to advance turn',
        userMessage: 'Failed to advance turn. Please try again.'
      });
      dispatch({ type: 'SET_ERROR', payload: appError.userMessage ?? appError.message });
    }
  };

  const skipTurn = async (): Promise<void> => {
    try {
      if (!state.currentRoom || !user) return;
      
      const result = await multiplayerService.skipTurnV2(state.currentRoom.roomCode, user.id);
      
      if (!result.success) {
        throw new AppError({
          code: 'MP_SKIP_FAILED',
          message: result.error || 'Failed to skip turn',
          userMessage: result.error || 'Failed to skip turn. Please try again.'
        });
      }
    } catch (error) {
      const appError = buildMultiplayerError(error, {
        code: 'MP_SKIP_FAILED',
        message: 'Failed to skip turn',
        userMessage: 'Failed to skip turn. Please try again.'
      });
      dispatch({ type: 'SET_ERROR', payload: appError.userMessage ?? appError.message });
    }
  };

  const handleHostDisconnection = async (disconnectedHostId: string): Promise<void> => {
    try {
      if (!state.currentRoom) return;
      
      logger.log(`🚪 Handling host disconnection: ${disconnectedHostId}`);
      
      const result = await multiplayerService.handleHostDisconnectionV2(
        state.currentRoom.roomCode, 
        disconnectedHostId
      );
      
      if (result.action === 'migrated' && result.newHostId) {
        // Use system message for seamless host migration (Sporcle-style)
        dispatch({
          type: 'SET_SYSTEM_MESSAGE',
          payload: {
            type: 'host_migrated',
            message: result.newHostName ? `${result.newHostName} is now the host.` : 'A new host has been assigned.',
            newHostId: result.newHostId,
            newHostName: result.newHostName
          }
        });
        
        logger.log(`✅ Host migrated to: ${result.newHostName || result.newHostId}`);
      } else if (result.action === 'terminated') {
        dispatch({
          type: 'SET_SYSTEM_MESSAGE',
          payload: {
            type: 'room_terminated',
            message: 'The host left the game, so the room has been closed.'
          }
        });
        
        logger.log(`🏁 Room terminated due to host disconnection`);
      } else if (result.action === 'error') {
        const appError = buildMultiplayerError(result.error, {
          code: 'MP_HOST_DISCONNECT_FAILED',
          message: 'Failed to handle host disconnection',
          userMessage: 'Failed to handle host disconnection.'
        });
        dispatch({ 
          type: 'SET_ERROR', 
          payload: appError.userMessage ?? appError.message
        });
      }
    } catch (error) {
      const appError = buildMultiplayerError(error, {
        code: 'MP_HOST_DISCONNECT_FAILED',
        message: 'Failed to handle host disconnection',
        userMessage: 'Failed to handle host disconnection.'
      });
      dispatch({ 
        type: 'SET_ERROR', 
        payload: appError.userMessage ?? appError.message
      });
    }
  };

  const clearHostMigrationNotification = () => {
    dispatch({ type: 'CLEAR_HOST_MIGRATION_NOTIFICATION' });
  };

  const clearSystemMessage = () => {
    dispatch({ type: 'CLEAR_SYSTEM_MESSAGE' });
  };

  const terminateGame = async (disconnectedPlayerId: string): Promise<void> => {
    try {
      if (!state.currentRoom) return;
      
      logger.log(`🏁 Terminating game due to player disconnection: ${disconnectedPlayerId}`);
      
      const result = await multiplayerService.terminateGameV2(
        state.currentRoom.roomCode, 
        disconnectedPlayerId
      );
      
      if (result.success) {
        dispatch({
          type: 'SET_SYSTEM_MESSAGE',
          payload: {
            type: 'game_terminated',
            message: 'A player has left, and the game has been terminated due to insufficient players.'
          }
        });
        
        logger.log(`✅ Game terminated successfully due to player disconnection`);
      } else {
        const appError = buildMultiplayerError(result.error, {
          code: 'MP_TERMINATE_FAILED',
          message: 'Failed to terminate game',
          userMessage: 'Failed to terminate game.'
        });
        dispatch({ 
          type: 'SET_ERROR', 
          payload: appError.userMessage ?? appError.message
        });
      }
    } catch (error) {
      const appError = buildMultiplayerError(error, {
        code: 'MP_TERMINATE_FAILED',
        message: 'Failed to terminate game',
        userMessage: 'Failed to terminate game.'
      });
      dispatch({ 
        type: 'SET_ERROR', 
        payload: appError.userMessage ?? appError.message 
      });
    }
  };

  // Host migration functions for cross-platform compatibility

  // UI Actions
  const setCategory = (category: string) => {
    dispatch({ type: 'SET_CATEGORY', payload: category });
  };

  const setQuestions = (questions: Array<Question | LegacyQuestion>) => {
    dispatch({ type: 'SET_QUESTIONS', payload: questions });
  };

  const setJoinRoomCode = (code: string) => {
    dispatch({ type: 'SET_JOIN_CODE', payload: code });
  };

  const setCurrentAnswer = (answer: string) => {
    dispatch({ type: 'SET_CURRENT_ANSWER', payload: answer });
  };

  const addSubmittedAnswer = (answer: string) => {
    const newAnswers = [...state.submittedAnswers, answer];
    dispatch({ type: 'SET_SUBMITTED_ANSWERS', payload: newAnswers });
  };

  const removeSubmittedAnswer = (index: number) => {
    const newAnswers = state.submittedAnswers.filter((_, i) => i !== index);
    dispatch({ type: 'SET_SUBMITTED_ANSWERS', payload: newAnswers });
  };

  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null });
  }, []);

  const resetSelections = () => {
    dispatch({ type: 'RESET_SELECTIONS' });
  };

  const resetAll = useCallback(() => {
    dispatch({ type: 'RESET_ALL' });
  }, []);

  const setNavigationCallback = useCallback((callback: (params: RootStackParamList['GameScreen']) => void) => {
    dispatch({ type: 'SET_NAVIGATION_CALLBACK', payload: callback });
  }, []);

  const cleanup = useCallback(() => {
    // Clean up subscription if it exists
    if (state.unsubscribe) {
      state.unsubscribe();
    }
    multiplayerService.cleanup();
    dispatch({ type: 'RESET_ALL' });
  }, [state.unsubscribe]);

  const value: MultiplayerContextType = {
    // Current State
    currentRoom: state.currentRoom,
    isHost: state.isHost,
    playerRole: state.playerRole,
    connectionStatus: state.connectionStatus,
    loading: state.loading,
    isStarting: state.isStarting,
    error: state.error,
    systemMessage: state.systemMessage,
    hostMigrationNotification: state.hostMigrationNotification,
    
    // Room Creation
    selectedCategory: state.selectedCategory,
    selectedQuestions: state.selectedQuestions,
    
    // Room Joining
    joinRoomCode: state.joinRoomCode,
    
    // Game State
    currentAnswer: state.currentAnswer,
    submittedAnswers: state.submittedAnswers,
    
    // Actions
    createRoom,
    joinRoom,
    leaveRoom,
    
    // Host Actions
    startGame,
    endGame,
    kickPlayer,
    nextQuestion,
    revealAnswer,
    
    // Player Actions
    submitAnswers,
    advanceTurn,
    skipTurn,
    
    // Host Migration Actions
    handleHostDisconnection,
    clearHostMigrationNotification,
    terminateGame,
    
    // System Message Actions
    clearSystemMessage,
    
    // UI Actions
    setCategory,
    setQuestions,
    setJoinRoomCode,
    setCurrentAnswer,
    addSubmittedAnswer,
    removeSubmittedAnswer,
    clearError,
    resetSelections,
    resetAll,
    setNavigationCallback,
    
    // Cleanup
    cleanup,
    
    // Subscription Management
    unsubscribe: state.unsubscribe,
  };

  return (
    <MultiplayerContext.Provider value={value}>
      {children}
    </MultiplayerContext.Provider>
  );
};

// Hook to use the context
export const useMultiplayer = (): MultiplayerContextType => {
  const context = useContext(MultiplayerContext);
  if (context === undefined) {
    throw new AppError({
      code: 'MP_CONTEXT_MISSING',
      message: 'useMultiplayer must be used within a MultiplayerProvider',
      userMessage: 'Multiplayer context is not available.'
    });
  }
  return context;
};