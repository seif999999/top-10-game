import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { RoomData, Player, Question } from '../types/game';
import multiplayerService from '../services/multiplayerService';
import { useAuth } from './AuthContext';
import { updatePlayerPresence } from '../services/multiplayerTransaction';

// Enhanced multiplayer state interface
interface MultiplayerState {
  // Current State
  currentRoom: RoomData | null;
  isHost: boolean;
  playerRole: 'host' | 'player' | null;
  connectionStatus: 'connected' | 'connecting' | 'disconnected';
  
  // UI State
  loading: boolean;
  error: string | null;
  
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
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_ROOM'; payload: { roomData: RoomData | null; userId?: string } }
  | { type: 'SET_HOST_STATUS'; payload: boolean }
  | { type: 'SET_CONNECTION_STATUS'; payload: 'connected' | 'connecting' | 'disconnected' }
  | { type: 'SET_CATEGORY'; payload: string | null }
  | { type: 'SET_QUESTIONS'; payload: Question[] }
  | { type: 'SET_JOIN_CODE'; payload: string }
  | { type: 'SET_CURRENT_ANSWER'; payload: string }
  | { type: 'SET_SUBMITTED_ANSWERS'; payload: string[] }
  | { type: 'SET_UNSUBSCRIBE'; payload: (() => void) | null }
  | { type: 'SET_NAVIGATION_CALLBACK'; payload: ((params: any) => void) | null }
  | { type: 'RESET_ALL' }
  | { type: 'RESET_SELECTIONS' };

// Initial state
const initialState: MultiplayerState = {
  currentRoom: null,
  isHost: false,
  playerRole: null,
  connectionStatus: 'disconnected',
  loading: false,
  error: null,
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
        isHost: roomData ? roomData.hostId === userId : false
      });
      return {
        ...state,
        currentRoom: roomData,
        isHost: roomData ? roomData.hostId === userId : false,
        playerRole: roomData ? (roomData.hostId === userId ? 'host' : 'player') : null,
        connectionStatus: roomData ? 'connected' : 'disconnected',
        error: null
      };
    
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
    
    case 'SET_UNSUBSCRIBE':
      return { ...state, unsubscribe: action.payload };
    
    case 'SET_NAVIGATION_CALLBACK':
      return { ...state, navigationCallback: action.payload };
    
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
  error: string | null;
  
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
  startGame: () => Promise<void>;
  endGame: () => Promise<void>;
  kickPlayer: (playerId: string) => Promise<void>;
  nextQuestion: () => Promise<void>;
  revealAnswer: (answer: string) => Promise<void>;
  
  // Player Actions
  submitAnswers: (answers: string[]) => Promise<void>;
  
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

      const roomCode = await multiplayerService.createRoom(user.id, category, questions);
      
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

      const success = await multiplayerService.joinRoom(roomCode, user.id, user.displayName || 'Player');
      
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
      
      await multiplayerService.leaveRoom(state.currentRoom.roomCode, user?.id || '');
      dispatch({ type: 'SET_ROOM', payload: { roomData: null, userId: user?.id } });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to leave room' });
    }
  };

  const startGame = async (): Promise<void> => {
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
      
      console.log('🎮 ROOM_START: Host starting game...');
      await multiplayerService.startGame(state.currentRoom.roomCode, user.id);
      console.log('✅ ROOM_START: Game started successfully');
    } catch (error) {
      console.error('❌ ROOM_START: Error starting game:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to start game' });
      throw error;
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
      await multiplayerService.endGame(state.currentRoom.roomCode, user.id);
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
      
      await multiplayerService.submitAnswer(state.currentRoom.roomCode, user.id, answers);
      dispatch({ type: 'SET_SUBMITTED_ANSWERS', payload: answers });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to submit answers' });
    }
  };

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

  const clearError = () => {
    dispatch({ type: 'SET_ERROR', payload: null });
  };

  const resetSelections = () => {
    dispatch({ type: 'RESET_SELECTIONS' });
  };

  const resetAll = () => {
    dispatch({ type: 'RESET_ALL' });
  };

  const setNavigationCallback = (callback: (params: any) => void) => {
    dispatch({ type: 'SET_NAVIGATION_CALLBACK', payload: callback });
  };

  const cleanup = () => {
    // Clean up subscription if it exists
    if (state.unsubscribe) {
      state.unsubscribe();
    }
    multiplayerService.cleanup();
    dispatch({ type: 'RESET_ALL' });
  };

  const value: MultiplayerContextType = {
    // Current State
    currentRoom: state.currentRoom,
    isHost: state.isHost,
    playerRole: state.playerRole,
    connectionStatus: state.connectionStatus,
    loading: state.loading,
    error: state.error,
    
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