import React, { createContext, useContext, useReducer, ReactNode, useEffect, useCallback } from 'react';
import { RoomData, Player, Question } from '../types/game';
import multiplayerService from '../services/multiplayerService';
import { useAuth } from './AuthContext';
import { updatePlayerPresence } from '../services/multiplayerTransaction';
import { AuthService } from '../services/authService';

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
    timestamp?: any;
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
  
  // Navigation callback for auto-navigation
  navigationCallback: ((params: any) => void) | null;
  
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
  | { type: 'SET_NAVIGATION_CALLBACK'; payload: ((params: any) => void) | null }
  | { type: 'SET_HOST_MIGRATION_NOTIFICATION'; payload: { type: 'host_migrated' | 'room_terminated' | null; newHostName?: string; message?: string } }
  | { type: 'CLEAR_HOST_MIGRATION_NOTIFICATION' }
  | { type: 'SET_SYSTEM_MESSAGE'; payload: { type: 'host_migrated' | 'room_terminated' | 'game_terminated' | null; message: string; timestamp?: any; newHostId?: string; newHostName?: string } }
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
      console.log('🎮 MultiplayerContext - Room data updated:', {
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
          console.log('🎯 CONTEXT_SCORE_DEBUG:', {
            scores: roomData.scores,
            revealedAnswers: roomData.revealedAnswers
          });
        
        // 📡 FIRESTORE LISTENER UPDATE DEBUG LOGGING
        console.log('📡 FIRESTORE LISTENER UPDATE:', {
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
        console.warn('⚠️ CONTEXT: revealedAnswers is not an array, initializing:', roomData.revealedAnswers);
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
        console.log('🔔 SYSTEM_MESSAGE: Received system message from room data:', roomData.systemMessage);
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
    timestamp?: any;
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
  createRoom: (category: string, questions: Question[]) => Promise<string>;
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
  setQuestions: (questions: Question[]) => void;
  setJoinRoomCode: (code: string) => void;
  setCurrentAnswer: (answer: string) => void;
  addSubmittedAnswer: (answer: string) => void;
  removeSubmittedAnswer: (index: number) => void;
  clearError: () => void;
  resetSelections: () => void;
  resetAll: () => void;
  
  // Navigation callback for auto-navigation
  setNavigationCallback: (callback: (params: any) => void) => void;
  
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
    console.log('🎮 NAVIGATION_CHECK:', {
      hasRoom: !!state.currentRoom,
      status: state.currentRoom?.status,
      gamePhase: state.currentRoom?.gamePhase,
      hasCallback: !!state.navigationCallback,
      roomCode: state.currentRoom?.roomCode
    });
    
    if (state.currentRoom && state.currentRoom.status === 'playing' && state.currentRoom.gamePhase === 'question' && state.navigationCallback) {
      console.log('🎮 CLIENT_NAVIGATE: Auto-navigating to GameScreen...');
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
        console.warn('⚠️ PRESENCE: Failed to update presence:', error);
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
        updatePlayerPresence(state.currentRoom.roomCode, user.id, false).catch(console.warn);
      }
    };
  }, [state.currentRoom?.roomCode, user?.id]);

  // Actions
  const createRoom = async (category: string, questions: Question[]): Promise<string> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      if (!user) {
        throw new Error('User not authenticated');
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
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to create room' });
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const joinRoom = async (roomCode: string): Promise<boolean> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      if (!user) {
        throw new Error('User not authenticated');
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
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to join room' });
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const leaveRoom = async (): Promise<void> => {
    try {
      if (!state.currentRoom) return;
      
      console.log('🚪 Leaving room:', state.currentRoom.roomCode);
      await multiplayerService.leaveRoom(state.currentRoom.roomCode, user?.id || '');
      
      // Clean up subscription
      if (state.unsubscribe) {
        state.unsubscribe();
        dispatch({ type: 'SET_UNSUBSCRIBE', payload: null });
      }
      
      // Reset all state to allow creating new rooms
      dispatch({ type: 'RESET_ALL' });
      console.log('✅ Room left successfully, state reset for new room creation');
    } catch (error) {
      console.error('❌ Error leaving room:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to leave room' });
      throw error;
    }
  };

  const startGame = async (roundTimeSeconds: number = 60): Promise<void> => {
    try {
      if (!state.currentRoom) {
        throw new Error('No room found');
      }
      
      if (!state.isHost) {
        throw new Error('Only the host can start the game');
      }
      
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      
      // Prevent double starts
      if (state.isStarting) {
        console.log('⚠️ Start game already in progress, ignoring duplicate request');
        return;
      }
      
      dispatch({ type: 'SET_STARTING', payload: true });
      
      console.log(`🎮 ROOM_START: Host starting game with ${roundTimeSeconds}s rounds...`);
      await multiplayerService.startGameV2(state.currentRoom.roomCode, user.id, roundTimeSeconds);
      console.log('✅ ROOM_START: Game started successfully');
    } catch (error) {
      console.error('❌ ROOM_START: Error starting game:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to start game' });
      throw error;
    } finally {
      dispatch({ type: 'SET_STARTING', payload: false });
    }
  };

  const endGame = async (): Promise<void> => {
    try {
      if (!state.currentRoom) {
        throw new Error('No room found');
      }
      
      if (!state.isHost) {
        throw new Error('Only the host can end the game');
      }
      
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      
      console.log('🏁 END_GAME: Host ending game...');
      await multiplayerService.endGameV2(state.currentRoom.roomCode, user.id);
      console.log('✅ END_GAME: Game ended successfully');
    } catch (error) {
      console.error('❌ END_GAME: Error ending game:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to end game' });
      throw error;
    }
  };

  const kickPlayer = async (playerId: string): Promise<void> => {
    try {
      if (!state.currentRoom || !user) return;
      
      await multiplayerService.kickPlayer(state.currentRoom.roomCode, user.id, playerId);
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to kick player' });
    }
  };

  const nextQuestion = async (): Promise<void> => {
    try {
      if (!state.currentRoom || !user) return;
      
      await multiplayerService.nextQuestion(state.currentRoom.roomCode, user.id);
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to advance question' });
    }
  };

  const revealAnswer = async (answer: string): Promise<void> => {
    try {
      if (!state.currentRoom || !user) return;
      
      await multiplayerService.revealAnswer(state.currentRoom.roomCode, user.id, answer);
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to reveal answer' });
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
          throw new Error(result.error || 'Failed to submit answer');
        }
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to submit answers' });
    }
  };

  const advanceTurn = async (): Promise<void> => {
    try {
      if (!state.currentRoom || !user) return;
      
      await multiplayerService.advanceTurn(state.currentRoom.roomCode, user.id);
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to advance turn' });
    }
  };

  const skipTurn = async (): Promise<void> => {
    try {
      if (!state.currentRoom || !user) return;
      
      const result = await multiplayerService.skipTurnV2(state.currentRoom.roomCode, user.id);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to skip turn');
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to skip turn' });
    }
  };

  const handleHostDisconnection = async (disconnectedHostId: string): Promise<void> => {
    try {
      if (!state.currentRoom) return;
      
      console.log(`🚪 Handling host disconnection: ${disconnectedHostId}`);
      
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
        
        console.log(`✅ Host migrated to: ${result.newHostName || result.newHostId}`);
      } else if (result.action === 'terminated') {
        dispatch({
          type: 'SET_SYSTEM_MESSAGE',
          payload: {
            type: 'room_terminated',
            message: 'The host left the game, so the room has been closed.'
          }
        });
        
        console.log(`🏁 Room terminated due to host disconnection`);
      } else if (result.action === 'error') {
        console.error(`❌ Host disconnection handling failed:`, result.error);
        dispatch({ 
          type: 'SET_ERROR', 
          payload: result.error || 'Failed to handle host disconnection' 
        });
      }
    } catch (error) {
      console.error('❌ Error handling host disconnection:', error);
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'Failed to handle host disconnection' 
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
      
      console.log(`🏁 Terminating game due to player disconnection: ${disconnectedPlayerId}`);
      
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
        
        console.log(`✅ Game terminated successfully due to player disconnection`);
      } else {
        console.error(`❌ Failed to terminate game:`, result.error);
        dispatch({ 
          type: 'SET_ERROR', 
          payload: result.error || 'Failed to terminate game' 
        });
      }
    } catch (error) {
      console.error('❌ Error terminating game:', error);
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'Failed to terminate game' 
      });
    }
  };

  // Host migration functions for cross-platform compatibility

  // UI Actions
  const setCategory = (category: string) => {
    dispatch({ type: 'SET_CATEGORY', payload: category });
  };

  const setQuestions = (questions: Question[]) => {
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

  const setNavigationCallback = useCallback((callback: (params: any) => void) => {
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
    throw new Error('useMultiplayer must be used within a MultiplayerProvider');
  }
  return context;
};