import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { RoomData } from '../services/roomService';

// Multiplayer state interface
interface MultiplayerState {
  currentRoom: RoomData | null;
  isHost: boolean;
  isInRoom: boolean;
  loading: boolean;
  error: string | null;
  selectedCategory: string | null;
  availableQuestions: any[];
  selectedQuestions: string[];
  joinRoomCode: string;
}

// Action types
type MultiplayerAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_ROOM'; payload: RoomData | null }
  | { type: 'SET_HOST_STATUS'; payload: boolean }
  | { type: 'SET_CATEGORY'; payload: string | null }
  | { type: 'SET_QUESTIONS'; payload: { available: any[]; selected: string[] } }
  | { type: 'SET_JOIN_CODE'; payload: string }
  | { type: 'RESET_ALL' }
  | { type: 'RESET_SELECTIONS' };

// Initial state
const initialState: MultiplayerState = {
  currentRoom: null,
  isHost: false,
  isInRoom: false,
  loading: false,
  error: null,
  selectedCategory: null,
  availableQuestions: [],
  selectedQuestions: [],
  joinRoomCode: '',
};

// Reducer function
const multiplayerReducer = (state: MultiplayerState, action: MultiplayerAction): MultiplayerState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'SET_ROOM':
      return {
        ...state,
        currentRoom: action.payload,
        isInRoom: action.payload !== null,
        isHost: action.payload ? action.payload.hostId === state.currentRoom?.hostId : false,
      };
    
    case 'SET_HOST_STATUS':
      return { ...state, isHost: action.payload };
    
    case 'SET_CATEGORY':
      return { ...state, selectedCategory: action.payload };
    
    case 'SET_QUESTIONS':
      return {
        ...state,
        availableQuestions: action.payload.available,
        selectedQuestions: action.payload.selected,
      };
    
    case 'SET_JOIN_CODE':
      return { ...state, joinRoomCode: action.payload };
    
    case 'RESET_ALL':
      return initialState;
    
    case 'RESET_SELECTIONS':
      return {
        ...state,
        selectedCategory: null,
        availableQuestions: [],
        selectedQuestions: [],
        joinRoomCode: '',
        error: null,
      };
    
    default:
      return state;
  }
};

// Context interface
interface MultiplayerContextType {
  state: MultiplayerState;
  dispatch: React.Dispatch<MultiplayerAction>;
  // Helper functions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setRoom: (room: RoomData | null) => void;
  setCategory: (category: string | null) => void;
  setQuestions: (available: any[], selected: string[]) => void;
  setJoinCode: (code: string) => void;
  resetAll: () => void;
  resetSelections: () => void;
}

// Create context
const MultiplayerContext = createContext<MultiplayerContextType | undefined>(undefined);

// Provider component
interface MultiplayerProviderProps {
  children: ReactNode;
}

export const MultiplayerProvider: React.FC<MultiplayerProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(multiplayerReducer, initialState);

  // Helper functions
  const setLoading = (loading: boolean) => dispatch({ type: 'SET_LOADING', payload: loading });
  const setError = (error: string | null) => dispatch({ type: 'SET_ERROR', payload: error });
  const setRoom = (room: RoomData | null) => dispatch({ type: 'SET_ROOM', payload: room });
  const setCategory = (category: string | null) => dispatch({ type: 'SET_CATEGORY', payload: category });
  const setQuestions = (available: any[], selected: string[]) => 
    dispatch({ type: 'SET_QUESTIONS', payload: { available, selected } });
  const setJoinCode = (code: string) => dispatch({ type: 'SET_JOIN_CODE', payload: code });
  const resetAll = () => dispatch({ type: 'RESET_ALL' });
  const resetSelections = () => dispatch({ type: 'RESET_SELECTIONS' });

  const value: MultiplayerContextType = {
    state,
    dispatch,
    setLoading,
    setError,
    setRoom,
    setCategory,
    setQuestions,
    setJoinCode,
    resetAll,
    resetSelections,
  };

  return (
    <MultiplayerContext.Provider value={value}>
      {children}
    </MultiplayerContext.Provider>
  );
};

// Custom hook to use the context
export const useMultiplayer = (): MultiplayerContextType => {
  const context = useContext(MultiplayerContext);
  if (context === undefined) {
    throw new Error('useMultiplayer must be used within a MultiplayerProvider');
  }
  return context;
};