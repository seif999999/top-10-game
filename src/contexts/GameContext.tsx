import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { GameState, GameResults, PlayerAnswer, startNewGame, processAnswer, nextQuestion, generateGameResults, isQuestionComplete as checkQuestionComplete } from '../services/gameLogic';
import { GameQuestion } from '../data/sampleQuestions';

export type GamePhase = 'lobby' | 'question' | 'answered' | 'results' | 'finished';

interface GameContextState {
  gameState: GameState | null;
  currentAnswer: string;
  suggestions: string[];
  isLoading: boolean;
  error: string | null;
}

type GameAction =
  | { type: 'START_GAME'; payload: { category: string; players: string[]; selectedQuestion?: any } }
  | { type: 'SET_ANSWER'; payload: string }
  | { type: 'SUBMIT_ANSWER'; payload: { playerId: string; answer: string } }
  | { type: 'NEXT_QUESTION' }
  | { type: 'END_GAME' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SUGGESTIONS'; payload: string[] }
  | { type: 'RESET_GAME' };

const initialState: GameContextState = {
  gameState: null,
  currentAnswer: '',
  suggestions: [],
  isLoading: false,
  error: null
};

const gameReducer = (state: GameContextState, action: GameAction): GameContextState => {
  switch (action.type) {
    case 'START_GAME':
      try {
        const { category, players, selectedQuestion } = action.payload;
        console.log(`🎮 START_GAME action - Category: ${category}, Players: ${players}, SelectedQuestion: ${selectedQuestion ? 'YES' : 'NO'}`);
        
        const newGameState = startNewGame(category, players, selectedQuestion ? 1 : 10);
        console.log(`🎮 START_GAME - New game state created:`, {
          category: newGameState.category,
          totalRounds: newGameState.totalRounds,
          currentQuestion: newGameState.currentQuestion?.title,
          shuffledQuestionsCount: newGameState.shuffledQuestions?.length
        });
        
        if (selectedQuestion) {
          newGameState.currentQuestion = selectedQuestion;
        }
        newGameState.gamePhase = 'question';
        return {
          ...state,
          gameState: newGameState,
          currentAnswer: '',
          suggestions: [],
          error: null
        };
      } catch (error) {
        console.error(`❌ START_GAME error:`, error);
        return {
          ...state,
          error: 'Failed to start game'
        };
      }

    case 'SET_ANSWER':
      return {
        ...state,
        currentAnswer: action.payload
      };

    case 'SUBMIT_ANSWER':
      try {
        if (!state.gameState) throw new Error('No active game');

        console.log(`\n📝 SUBMIT_ANSWER ACTION:`);
        console.log(`   Player: ${action.payload.playerId}`);
        console.log(`   Answer: "${action.payload.answer}"`);
        console.log(`   Current scores before:`, state.gameState.scores);

        const { playerId, answer } = action.payload;
        const { updatedState, answerResult } = processAnswer(
          state.gameState,
          playerId,
          answer
        );

        console.log('🔄 SUBMIT_ANSWER - Updated scores:', updatedState.scores);
        console.log('🔄 SUBMIT_ANSWER - Answer result:', answerResult);

        return {
          ...state,
          gameState: updatedState,
          currentAnswer: '',
          suggestions: []
        };
      } catch (error) {
        console.error('❌ SUBMIT_ANSWER Error:', error);
        return {
          ...state,
          error: 'Failed to submit answer'
        };
      }

    case 'NEXT_QUESTION':
      try {
        if (!state.gameState) throw new Error('No active game');
        
        const updatedState = nextQuestion(state.gameState);
        
        return {
          ...state,
          gameState: updatedState,
          currentAnswer: '',
          suggestions: [],
          error: null
        };
      } catch (error) {
        return {
          ...state,
          error: 'Failed to move to next question'
        };
      }

    case 'END_GAME':
      return {
        ...state,
        gameState: state.gameState ? { ...state.gameState, gamePhase: 'finished' } : null
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload
      };

    case 'SET_SUGGESTIONS':
      return {
        ...state,
        suggestions: action.payload
      };

    case 'RESET_GAME':
      return initialState;

    default:
      return state;
  }
};

interface GameContextType extends GameContextState {
  startGame: (category: string, players: string[], selectedQuestion?: any) => void;
  submitAnswer: (playerId: string, answer: string) => void;
  nextQuestion: () => void;
  endGame: () => void;
  setAnswer: (answer: string) => void;
  getGameResults: () => GameResults | null;
  getCurrentQuestion: () => GameQuestion | null;
  getPlayerScore: (playerId: string) => number;
  getGameProgress: () => number;
  isQuestionComplete: () => boolean;
  getCorrectAnswersFound: () => number;
  resetGame: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

interface GameProviderProps {
  children: React.ReactNode;
}

export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  const startGame = useCallback((category: string, players: string[], selectedQuestion?: any) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      dispatch({ type: 'START_GAME', payload: { category, players, selectedQuestion } });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to start game' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const submitAnswer = useCallback((playerId: string, answer: string) => {
    dispatch({ type: 'SUBMIT_ANSWER', payload: { playerId, answer } });
  }, []);

  const nextQuestion = useCallback(() => {
    dispatch({ type: 'NEXT_QUESTION' });
  }, []);

  const endGame = useCallback(() => {
    dispatch({ type: 'END_GAME' });
  }, []);

  const setAnswer = useCallback((answer: string) => {
    dispatch({ type: 'SET_ANSWER', payload: answer });
  }, []);

  const getGameResults = useCallback((): GameResults | null => {
    if (!state.gameState) return null;
    return generateGameResults(state.gameState);
  }, [state.gameState]);

  const getCurrentQuestion = useCallback((): GameQuestion | null => {
    return state.gameState?.currentQuestion || null;
  }, [state.gameState]);

  const getPlayerScore = useCallback((playerId: string): number => {
    if (!state.gameState || !state.gameState.scores) return 0;
    const score = state.gameState.scores[playerId] || 0;
    console.log(`📊 getPlayerScore(${playerId}): ${score}`);
    console.log(`📊 All scores:`, state.gameState.scores);
    return score;
  }, [state.gameState]);

  const getGameProgress = useCallback((): number => {
    if (!state.gameState || !state.gameState.currentRound || !state.gameState.totalRounds) return 0;
    return (state.gameState.currentRound / state.gameState.totalRounds) * 100;
  }, [state.gameState]);

  const isQuestionComplete = useCallback((): boolean => {
    if (!state.gameState) return false;
    return checkQuestionComplete(state.gameState);
  }, [state.gameState]);

  const getCorrectAnswersFound = useCallback((): number => {
    if (!state.gameState || !state.gameState.rounds || !Array.isArray(state.gameState.rounds)) return 0;
    const currentRound = state.gameState.rounds[state.gameState.currentRound - 1];
    return currentRound?.correctAnswersFound || 0;
  }, [state.gameState]);

  const resetGame = useCallback(() => {
    dispatch({ type: 'RESET_GAME' });
  }, []);

  const contextValue: GameContextType = {
    ...state,
    startGame,
    submitAnswer,
    nextQuestion,
    endGame,
    setAnswer,
    getGameResults,
    getCurrentQuestion,
    getPlayerScore,
    getGameProgress,
    isQuestionComplete,
    getCorrectAnswersFound,
    resetGame
  };

  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  );
};
