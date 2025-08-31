import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import multiplayerService, { 
  MultiplayerGameState, 
  MultiplayerPlayer, 
  AnswerResult,
  MultiplayerEvents 
} from '../services/multiplayerService';

// Multiplayer state interface
interface MultiplayerState {
  isConnected: boolean;
  roomId: string | null;
  playerId: string | null;
  playerName: string | null;
  gameState: MultiplayerGameState | null;
  currentAnswer: string;
  submittedAnswers: string[];
  isLoading: boolean;
  error: string | null;
  connectionStatus: 'connected' | 'connecting' | 'disconnected';
}

// Action types
type MultiplayerAction =
  | { type: 'SET_CONNECTION_STATUS'; payload: 'connected' | 'connecting' | 'disconnected' }
  | { type: 'SET_ROOM'; payload: { roomId: string; playerId: string; playerName: string } }
  | { type: 'SET_GAME_STATE'; payload: MultiplayerGameState }
  | { type: 'SET_CURRENT_ANSWER'; payload: string }
  | { type: 'ADD_SUBMITTED_ANSWER'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET_MULTIPLAYER' };

// Initial state
const initialState: MultiplayerState = {
  isConnected: false,
  roomId: null,
  playerId: null,
  playerName: null,
  gameState: null,
  currentAnswer: '',
  submittedAnswers: [],
  isLoading: false,
  error: null,
  connectionStatus: 'disconnected'
};

// Reducer
const multiplayerReducer = (state: MultiplayerState, action: MultiplayerAction): MultiplayerState => {
  switch (action.type) {
    case 'SET_CONNECTION_STATUS':
      return {
        ...state,
        connectionStatus: action.payload,
        isConnected: action.payload === 'connected'
      };

    case 'SET_ROOM':
      return {
        ...state,
        roomId: action.payload.roomId,
        playerId: action.payload.playerId,
        playerName: action.payload.playerName
      };

    case 'SET_GAME_STATE':
      return {
        ...state,
        gameState: action.payload,
        error: null
      };

    case 'SET_CURRENT_ANSWER':
      console.log('🔌 MultiplayerContext: SET_CURRENT_ANSWER reducer called with:', action.payload);
      return {
        ...state,
        currentAnswer: action.payload
      };

    case 'ADD_SUBMITTED_ANSWER':
      console.log('🔌 MultiplayerContext: ADD_SUBMITTED_ANSWER reducer called with:', action.payload);
      console.log('🔌 MultiplayerContext: Previous submittedAnswers:', state.submittedAnswers);
      const newState = {
        ...state,
        submittedAnswers: [...state.submittedAnswers, action.payload]
      };
      console.log('🔌 MultiplayerContext: New submittedAnswers:', newState.submittedAnswers);
      return newState;

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false
      };

    case 'RESET_MULTIPLAYER':
      return {
        ...initialState,
        connectionStatus: state.connectionStatus
      };

    default:
      return state;
  }
};

// Context interface
interface MultiplayerContextType {
  state: MultiplayerState;
  joinRoom: (roomId: string, playerId: string, playerName: string, categoryId: string) => void;
  startGame: () => void;
  submitAnswer: (answer: string) => void;
  nextQuestion: () => void;
  endGame: () => void;
  leaveRoom: () => void;
  setCurrentAnswer: (answer: string) => void;
  resetMultiplayer: () => void;
  forceDisconnect: () => void;
  getPlayerScore: (playerId: string) => number;
  getLeaderboard: () => Array<{ playerId: string; playerName: string; score: number }>;
  isQuestionComplete: () => boolean;
  getCorrectAnswersFound: () => number;
}

// Create context
const MultiplayerContext = createContext<MultiplayerContextType | undefined>(undefined);

// Provider component
export const MultiplayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(multiplayerReducer, initialState);

  // Setup multiplayer event handlers
  const setupEventHandlers = useCallback(() => {
    const eventHandlers: MultiplayerEvents = {
             onRoomJoined: (data) => {
         console.log('🎯 Room joined successfully:', data);
         if (data.success) {
           dispatch({ type: 'SET_GAME_STATE', payload: data.room });
           dispatch({ type: 'SET_LOADING', payload: false });
           
           // Auto-start the game if we're the first player
           if (data.room.players.length === 1) {
             console.log('🎮 Auto-starting game as first player');
             setTimeout(() => {
               multiplayerService.startGame(data.room.roomId);
             }, 1000);
           }
         } else {
           dispatch({ type: 'SET_ERROR', payload: data.error || 'Failed to join room' });
         }
       },

      onPlayerJoined: (data) => {
        dispatch({ type: 'SET_GAME_STATE', payload: data.room });
      },

      onPlayerLeft: (data) => {
        dispatch({ type: 'SET_GAME_STATE', payload: data.room });
      },

             onGameStarted: (gameState) => {
         console.log('🎮 Game started:', gameState);
         dispatch({ type: 'SET_GAME_STATE', payload: gameState });
         dispatch({ type: 'SET_LOADING', payload: false });
       },

             onGameStateUpdate: (gameState) => {
         console.log('🔄 Game state updated:', gameState);
         dispatch({ type: 'SET_GAME_STATE', payload: gameState });
       },

      onAnswerResult: (result) => {
        console.log('🔌 MultiplayerContext: onAnswerResult called with:', result);
        // Add all submitted answers to the list, regardless of correctness
        dispatch({ type: 'ADD_SUBMITTED_ANSWER', payload: result.answer });
        console.log('📝 Answer result received and dispatched:', result);
      },

      onQuestionEnded: (gameState) => {
        dispatch({ type: 'SET_GAME_STATE', payload: gameState });
      },

      onNextQuestion: (gameState) => {
        dispatch({ type: 'SET_GAME_STATE', payload: gameState });
        dispatch({ type: 'SET_CURRENT_ANSWER', payload: '' });
        dispatch({ type: 'SET_LOADING', payload: false });
      },

      onGameEnded: (gameState) => {
        dispatch({ type: 'SET_GAME_STATE', payload: gameState });
      },

      onError: (error) => {
        dispatch({ type: 'SET_ERROR', payload: error });
        Alert.alert('Multiplayer Error', error);
      }
    };

    multiplayerService.setEventHandlers(eventHandlers);
  }, []);

  // Initialize event handlers
  useEffect(() => {
    setupEventHandlers();
  }, [setupEventHandlers]);

  // Monitor connection status
  useEffect(() => {
    console.log('🔌 MultiplayerContext: Setting up connection monitoring');
    
    const checkConnection = () => {
      const status = multiplayerService.getConnectionStatus();
      
      // Only update if status actually changed
      if (status !== state.connectionStatus) {
        console.log('🔌 MultiplayerContext: Connection status changed from', state.connectionStatus, 'to', status);
        dispatch({ type: 'SET_CONNECTION_STATUS', payload: status });
        
        // If disconnected, show error message only when status actually changes to disconnected
        if (status === 'disconnected' && state.roomId) {
          console.log('🔌 MultiplayerContext: Lost connection while in room, showing error');
          dispatch({ type: 'SET_ERROR', payload: 'Lost connection to multiplayer server. Please try reconnecting.' });
        }
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 2000);

    return () => {
      console.log('🔌 MultiplayerContext: Cleaning up connection monitoring');
      clearInterval(interval);
    };
  }, [state.roomId, state.connectionStatus]);

  // Join a multiplayer room
  const joinRoom = useCallback((roomId: string, playerId: string, playerName: string, categoryId: string) => {
    console.log('🔌 MultiplayerContext: joinRoom() called with:', { roomId, playerId, playerName, categoryId });
    console.log('🔌 MultiplayerContext: Current connection status:', state.connectionStatus);
    
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    dispatch({ type: 'SET_ROOM', payload: { roomId, playerId, playerName } });
    
    console.log('🔌 MultiplayerContext: Calling multiplayerService.joinRoom()');
    multiplayerService.joinRoom(roomId, playerId, playerName, categoryId);
  }, []);

  // Start the multiplayer game
  const startGame = useCallback(() => {
    if (!state.roomId) {
      dispatch({ type: 'SET_ERROR', payload: 'No room to start game' });
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    multiplayerService.startGame(state.roomId);
  }, [state.roomId]);

  // Submit an answer
  const submitAnswer = useCallback((answer: string) => {
    console.log('🔌 MultiplayerContext: submitAnswer called with:', {
      answer,
      roomId: state.roomId,
      playerId: state.playerId,
      gameState: state.gameState
    });
    
    if (!state.roomId || !state.playerId) {
      console.log('❌ No room or player ID');
      dispatch({ type: 'SET_ERROR', payload: 'Not in a game room' });
      return;
    }

    if (!answer.trim()) {
      console.log('❌ Empty answer');
      dispatch({ type: 'SET_ERROR', payload: 'Answer cannot be empty' });
      return;
    }

    console.log('📝 Calling multiplayerService.submitAnswer');
    multiplayerService.submitAnswer(state.roomId, state.playerId, answer);
    dispatch({ type: 'SET_CURRENT_ANSWER', payload: '' });
  }, [state.roomId, state.playerId]);

  // Move to next question
  const nextQuestion = useCallback(() => {
    if (!state.roomId) {
      dispatch({ type: 'SET_ERROR', payload: 'No room to move to next question' });
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    multiplayerService.nextQuestion(state.roomId);
  }, [state.roomId]);

  // End the game
  const endGame = useCallback(() => {
    if (!state.roomId) {
      dispatch({ type: 'SET_ERROR', payload: 'No room to end game' });
      return;
    }

    multiplayerService.endGame(state.roomId);
  }, [state.roomId]);

  // Leave the room
  const leaveRoom = useCallback(() => {
    multiplayerService.leaveRoom();
    dispatch({ type: 'RESET_MULTIPLAYER' });
  }, []);

  // Set current answer
  const setCurrentAnswer = useCallback((answer: string) => {
    console.log('🔌 MultiplayerContext: setCurrentAnswer called with:', answer);
    dispatch({ type: 'SET_CURRENT_ANSWER', payload: answer });
  }, []);

  // Reset multiplayer state
  const resetMultiplayer = useCallback(() => {
    multiplayerService.leaveRoom();
    dispatch({ type: 'RESET_MULTIPLAYER' });
  }, []);

  // Force disconnect (for when user exits game completely)
  const forceDisconnect = useCallback(() => {
    multiplayerService.forceDisconnect();
    dispatch({ type: 'RESET_MULTIPLAYER' });
  }, []);

  // Get player score
  const getPlayerScore = useCallback((playerId: string): number => {
    return state.gameState?.scores[playerId] || 0;
  }, [state.gameState]);

  // Get leaderboard
  const getLeaderboard = useCallback(() => {
    return state.gameState?.leaderboard || [];
  }, [state.gameState]);

  // Check if question is complete (all answers found)
  const isQuestionComplete = useCallback(() => {
    if (!state.gameState?.currentQuestion) return false;
    
    const correctAnswers = state.gameState.currentQuestion.answers;
    const foundAnswers = state.submittedAnswers;
    
    return correctAnswers.every((answer: { text: string }) =>
      foundAnswers.some(submitted =>
        submitted.toLowerCase().trim() === answer.text.toLowerCase().trim()
      )
    );
  }, [state.gameState?.currentQuestion, state.submittedAnswers]);

  // Get number of correct answers found
  const getCorrectAnswersFound = useCallback(() => {
    if (!state.gameState?.currentQuestion) return 0;
    
    const correctAnswers = state.gameState.currentQuestion.answers;
    const foundAnswers = state.submittedAnswers;
    
    return correctAnswers.filter((answer: { text: string }) =>
      foundAnswers.some(submitted =>
        submitted.toLowerCase().trim() === answer.text.toLowerCase().trim()
      )
    ).length;
  }, [state.gameState?.currentQuestion, state.submittedAnswers]);

  const contextValue: MultiplayerContextType = {
    state,
    joinRoom,
    startGame,
    submitAnswer,
    nextQuestion,
    endGame,
    leaveRoom,
    setCurrentAnswer,
    resetMultiplayer,
    forceDisconnect,
    getPlayerScore,
    getLeaderboard,
    isQuestionComplete,
    getCorrectAnswersFound
  };

  return (
    <MultiplayerContext.Provider value={contextValue}>
      {children}
    </MultiplayerContext.Provider>
  );
};

// Hook to use multiplayer context
export const useMultiplayer = (): MultiplayerContextType => {
  const context = useContext(MultiplayerContext);
  if (context === undefined) {
    throw new Error('useMultiplayer must be used within a MultiplayerProvider');
  }
  return context;
};
