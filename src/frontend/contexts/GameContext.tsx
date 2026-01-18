import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { startNewGame, processAnswer, nextQuestion, generateGameResults, isQuestionComplete as checkQuestionComplete } from '../../backend/services/gameLogic';
import { GameState, GameResults, PlayerAnswer, GameQuestion } from '../../shared/types';
import { Team, TeamGameState, TeamSetupConfig, TEAM_COLORS } from '../../shared/types/teams';
import { logger } from '../../backend/utils/logger';
import { AppError, toAppError } from '../../shared/errors';
import type { AppErrorOptions } from '../../shared/errors';

export type GamePhase = 'lobby' | 'question' | 'answered' | 'results' | 'finished';

interface GameContextState {
  gameState: GameState | null;
  currentAnswer: string;
  suggestions: string[];
  isLoading: boolean;
  error: string | null;
  // Team mode state
  teamGameState: TeamGameState | null;
  isTeamMode: boolean;
}

type GameAction =
  | { type: 'START_GAME'; payload: { category: string; players: string[]; selectedQuestion?: GameQuestion } }
  | { type: 'START_GAME_SUCCESS'; payload: { gameState: GameState } }
  | { type: 'SET_ANSWER'; payload: string }
  | { type: 'SUBMIT_ANSWER'; payload: { playerId: string; answer: string } }
  | { type: 'NEXT_QUESTION' }
  | { type: 'END_GAME' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SUGGESTIONS'; payload: string[] }
  | { type: 'RESET_GAME' }
  // Team mode actions
  | { type: 'START_TEAMS_GAME'; payload: { category: string; selectedQuestion?: GameQuestion; config: TeamSetupConfig } }
  | { type: 'START_TEAMS_GAME_SUCCESS'; payload: { gameState: GameState; config: TeamSetupConfig } }
  | { type: 'ASSIGN_ANSWER_TO_TEAM'; payload: { answerIndex: number; teamId: string; points: number } }
  | { type: 'END_TEAM_TURN' }
  | { type: 'SET_TEAM_TIMER'; payload: number }
  | { type: 'RESET_TEAMS_GAME' };

const initialState: GameContextState = {
  gameState: null,
  currentAnswer: '',
  suggestions: [],
  isLoading: false,
  error: null,
  teamGameState: null,
  isTeamMode: false
};

const buildGameError = (error: unknown, fallback: AppErrorOptions): AppError => {
  const appError = toAppError(error, fallback);
  logger.error(`❌ GameContext:${appError.code}`, appError);
  return appError;
};

const gameReducer = (state: GameContextState, action: GameAction): GameContextState => {
  switch (action.type) {
    case 'START_GAME_SUCCESS':
      try {
        const { gameState: newGameState } = action.payload;
        logger.log(`🎮 START_GAME_SUCCESS - New game state created:`, {
          category: newGameState.category,
          totalRounds: newGameState.totalRounds,
          currentQuestion: newGameState.currentQuestion?.title,
          shuffledQuestionsCount: newGameState.shuffledQuestions?.length
        });
        
        newGameState.gamePhase = 'question';
        return {
          ...state,
          gameState: newGameState,
          currentAnswer: '',
          suggestions: [],
          error: null
        };
      } catch (error) {
        const appError = buildGameError(error, {
          code: 'GAME_START_FAILED',
          message: 'Failed to start game',
          userMessage: 'Failed to start game. Please try again.'
        });
        return {
          ...state,
          error: appError.userMessage ?? appError.message
        };
      }

    case 'SET_ANSWER':
      return {
        ...state,
        currentAnswer: action.payload
      };

    case 'SUBMIT_ANSWER':
      try {
        if (!state.gameState) {
          throw new AppError({
            code: 'GAME_NO_ACTIVE',
            message: 'No active game',
            userMessage: 'No active game.'
          });
        }

        logger.log(`\n📝 SUBMIT_ANSWER ACTION:`);
        logger.log(`   Player: ${action.payload.playerId}`);
        logger.log(`   Answer: "${action.payload.answer}"`);
        logger.log(`   Current scores before:`, state.gameState.scores);

        const { playerId, answer } = action.payload;
        const { updatedState, answerResult } = processAnswer(
          state.gameState,
          playerId,
          answer
        );

        logger.log('🔄 SUBMIT_ANSWER - Updated scores:', updatedState.scores);
        logger.log('🔄 SUBMIT_ANSWER - Answer result:', answerResult);
        logger.log('🔄 SUBMIT_ANSWER - Game phase after update:', updatedState.gamePhase);

        return {
          ...state,
          gameState: updatedState,
          currentAnswer: '',
          suggestions: []
        };
      } catch (error) {
        const appError = buildGameError(error, {
          code: 'GAME_SUBMIT_FAILED',
          message: 'Failed to submit answer',
          userMessage: 'Failed to submit answer. Please try again.'
        });
        return {
          ...state,
          error: appError.userMessage ?? appError.message
        };
      }

    case 'NEXT_QUESTION':
      try {
        if (!state.gameState) {
          throw new AppError({
            code: 'GAME_NO_ACTIVE',
            message: 'No active game',
            userMessage: 'No active game.'
          });
        }
        
        const updatedState = nextQuestion(state.gameState);
        
        return {
          ...state,
          gameState: updatedState,
          currentAnswer: '',
          suggestions: [],
          error: null
        };
      } catch (error) {
        const appError = buildGameError(error, {
          code: 'GAME_NEXT_QUESTION_FAILED',
          message: 'Failed to move to next question',
          userMessage: 'Failed to load next question. Please try again.'
        });
        return {
          ...state,
          error: appError.userMessage ?? appError.message
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

    // Team mode cases
    case 'START_TEAMS_GAME_SUCCESS':
      try {
        const { gameState: newGameState, config } = action.payload;
        logger.log(`🎮 START_TEAMS_GAME_SUCCESS action - Category: ${newGameState.category}, Config:`, config);
        
        logger.log(`🎮 START_TEAMS_GAME_SUCCESS - Game state created:`, {
          category: newGameState.category,
          totalRounds: newGameState.totalRounds,
          currentQuestion: newGameState.currentQuestion?.title,
          shuffledQuestionsCount: newGameState.shuffledQuestions?.length
        });
        
        newGameState.gamePhase = 'question';
        
        // Create teams
        logger.log(`🎮 Creating teams from config:`, {
          numberOfTeams: config.numberOfTeams,
          teamNamesLength: config.teamNames.length,
          teamNames: config.teamNames
        });
        
        const teams: Team[] = config.teamNames.map((name, index) => ({
          id: `team-${index + 1}`,
          name,
          color: TEAM_COLORS[index],
          score: 0,
        }));
        
        logger.log(`🎮 Created ${teams.length} teams:`, teams.map(t => ({ id: t.id, name: t.name })));

        const teamGameState: TeamGameState = {
          teams,
          currentTeamIndex: 0,
          roundTimerSeconds: config.roundTimer,
          timeRemaining: config.roundTimer,
          isTurnActive: true,
          maxRounds: config.maxRounds,
          currentRound: 1,
          isHostedLocal: config.isHostedLocal,
          answerAssignments: {},
        };

        return {
          ...state,
          gameState: newGameState, // Add the game state with questions
          teamGameState,
          isTeamMode: true,
          currentAnswer: '',
          suggestions: [],
          error: null,
        };
      } catch (error) {
        const appError = buildGameError(error, {
          code: 'GAME_TEAM_START_FAILED',
          message: 'Failed to start teams game',
          userMessage: 'Failed to start team game. Please try again.'
        });
        return {
          ...state,
          error: appError.userMessage ?? appError.message
        };
      }

    case 'ASSIGN_ANSWER_TO_TEAM':
      try {
        if (!state.teamGameState) {
          throw new AppError({
            code: 'GAME_TEAM_NO_ACTIVE',
            message: 'No active team game',
            userMessage: 'No active team game.'
          });
        }
        
        const { answerIndex, teamId, points } = action.payload;
        const updatedTeamGameState = { ...state.teamGameState };
        
        // Update team score
        const teamIndex = updatedTeamGameState.teams.findIndex(t => t.id === teamId);
        if (teamIndex !== -1) {
          updatedTeamGameState.teams[teamIndex].score += points;
        }
        
        // Record assignment
        updatedTeamGameState.answerAssignments[answerIndex] = { teamId, points };
        
        logger.log(`🎯 Answer ${answerIndex} assigned to team ${teamId} for ${points} points`);
        
        return {
          ...state,
          teamGameState: updatedTeamGameState,
        };
      } catch (error) {
        const appError = buildGameError(error, {
          code: 'GAME_ASSIGN_ANSWER_FAILED',
          message: 'Failed to assign answer to team',
          userMessage: 'Failed to assign answer. Please try again.'
        });
        return {
          ...state,
          error: appError.userMessage ?? appError.message
        };
      }

    case 'END_TEAM_TURN':
      try {
        if (!state.teamGameState) {
          throw new AppError({
            code: 'GAME_TEAM_NO_ACTIVE',
            message: 'No active team game',
            userMessage: 'No active team game.'
          });
        }
        
        const updatedTeamGameState = { ...state.teamGameState };
        
        // Move to next team
        updatedTeamGameState.currentTeamIndex = (updatedTeamGameState.currentTeamIndex + 1) % updatedTeamGameState.teams.length;
        
        // Check if we've completed a full round
        if (updatedTeamGameState.currentTeamIndex === 0) {
          updatedTeamGameState.currentRound += 1;
        }
        
        // Reset timer
        updatedTeamGameState.timeRemaining = updatedTeamGameState.roundTimerSeconds;
        updatedTeamGameState.isTurnActive = true;
        
        logger.log(`🔄 Turn ended, now team ${updatedTeamGameState.currentTeamIndex + 1}'s turn`);
        
        return {
          ...state,
          teamGameState: updatedTeamGameState,
        };
      } catch (error) {
        const appError = buildGameError(error, {
          code: 'GAME_END_TEAM_TURN_FAILED',
          message: 'Failed to end team turn',
          userMessage: 'Failed to end team turn. Please try again.'
        });
        return {
          ...state,
          error: appError.userMessage ?? appError.message
        };
      }

    case 'SET_TEAM_TIMER':
      try {
        if (!state.teamGameState) {
          throw new AppError({
            code: 'GAME_TEAM_NO_ACTIVE',
            message: 'No active team game',
            userMessage: 'No active team game.'
          });
        }
        
        const updatedTeamGameState = { ...state.teamGameState };
        updatedTeamGameState.timeRemaining = action.payload;
        
        // Auto-end turn if timer reaches 0
        if (action.payload === 0 && updatedTeamGameState.isTurnActive) {
          updatedTeamGameState.isTurnActive = false;
          // Auto-advance to next team
          updatedTeamGameState.currentTeamIndex = (updatedTeamGameState.currentTeamIndex + 1) % updatedTeamGameState.teams.length;
          if (updatedTeamGameState.currentTeamIndex === 0) {
            updatedTeamGameState.currentRound += 1;
          }
          updatedTeamGameState.timeRemaining = updatedTeamGameState.roundTimerSeconds;
          updatedTeamGameState.isTurnActive = true;
        }
        
        return {
          ...state,
          teamGameState: updatedTeamGameState,
        };
      } catch (error) {
        const appError = buildGameError(error, {
          code: 'GAME_SET_TIMER_FAILED',
          message: 'Failed to update team timer',
          userMessage: 'Failed to update team timer. Please try again.'
        });
        return {
          ...state,
          error: appError.userMessage ?? appError.message
        };
      }

    case 'RESET_TEAMS_GAME':
      return {
        ...state,
        teamGameState: null,
        isTeamMode: false,
      };

    default:
      return state;
  }
};

interface GameContextType extends GameContextState {
  startGame: (category: string, players: string[], selectedQuestion?: GameQuestion) => void;
  submitAnswer: (playerId: string, answer: string) => void;
  nextQuestion: () => void;
  endGame: () => void;
  setAnswer: (answer: string) => void;
  getGameResults: () => GameResults | null;
  getCurrentQuestion: () => GameQuestion | null;
  getPlayerScore: (playerId: string) => number;
  getGameProgress: () => { current: number; total: number };
  isQuestionComplete: () => boolean;
  getCorrectAnswersFound: () => number;
  resetGame: () => void;
  // Team mode functions
  startTeamsGame: (category: string, config: TeamSetupConfig, selectedQuestion?: GameQuestion) => void;
  assignAnswerToTeam: (answerIndex: number, teamId: string, points: number) => void;
  endTeamTurn: () => void;
  setTeamTimer: (seconds: number) => void;
  resetTeamsGame: () => void;
  getCurrentTeam: () => Team | null;
  getTeamScore: (teamId: string) => number;
  getAssignedAnswersCount: () => number;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new AppError({
      code: 'GAME_CONTEXT_MISSING',
      message: 'useGame must be used within a GameProvider',
      userMessage: 'Game context is not available.'
    });
  }
  return context;
};

interface GameProviderProps {
  children: React.ReactNode;
}

export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  const startGame = useCallback(async (category: string, players: string[], selectedQuestion?: GameQuestion) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const newGameState = await startNewGame(category, players, selectedQuestion ? 1 : 10, selectedQuestion);
      dispatch({ type: 'START_GAME_SUCCESS', payload: { gameState: newGameState } });
    } catch (error) {
      const appError = buildGameError(error, {
        code: 'GAME_START_FAILED',
        message: 'Failed to start game',
        userMessage: 'Failed to start game. Please try again.',
        context: { category }
      });
      dispatch({ type: 'SET_ERROR', payload: appError.userMessage ?? appError.message });
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
    logger.log(`📊 getPlayerScore(${playerId}): ${score}`);
    logger.log(`📊 All scores:`, state.gameState.scores);
    return score;
  }, [state.gameState]);

  const getGameProgress = useCallback(() => {
    if (!state.gameState || !state.gameState.currentRound || !state.gameState.totalRounds) return { current: 1, total: 1 };
    return { current: state.gameState.currentRound, total: state.gameState.totalRounds };
  }, [state.gameState]);

  const isQuestionComplete = useCallback((): boolean => {
    // In team mode, question is complete when all 10 answers are assigned
    if (state.isTeamMode && state.teamGameState && state.gameState?.currentQuestion) {
      const totalAnswers = state.gameState.currentQuestion.answers?.length || 10;
      const assignedAnswers = Object.keys(state.teamGameState.answerAssignments).length;
      return assignedAnswers >= totalAnswers;
    }
    
    // Regular mode
    if (!state.gameState) return false;
    const currentRound = state.gameState.rounds[state.gameState.currentRound - 1];
    if (!currentRound) return false;
    return checkQuestionComplete(currentRound);
  }, [state.gameState, state.isTeamMode, state.teamGameState]);

  const getCorrectAnswersFound = useCallback((): number => {
    // In team mode, return the number of assigned answers
    if (state.isTeamMode && state.teamGameState) {
      return Object.keys(state.teamGameState.answerAssignments).length;
    }
    
    // Regular mode
    if (!state.gameState || !state.gameState.rounds || !Array.isArray(state.gameState.rounds)) return 0;
    const currentRound = state.gameState.rounds[state.gameState.currentRound - 1];
    if (!currentRound || !currentRound.playerAnswers || !Array.isArray(currentRound.playerAnswers)) return 0;
    return currentRound.playerAnswers.length;
  }, [state.gameState, state.isTeamMode, state.teamGameState]);

  const resetGame = useCallback(() => {
    dispatch({ type: 'RESET_GAME' });
  }, []);

  // Team mode functions
  const startTeamsGame = useCallback(async (category: string, config: TeamSetupConfig, selectedQuestion?: GameQuestion) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const newGameState = await startNewGame(category, ['Host'], selectedQuestion ? 1 : 10, selectedQuestion);
      dispatch({ type: 'START_TEAMS_GAME_SUCCESS', payload: { gameState: newGameState, config } });
    } catch (error) {
      const appError = buildGameError(error, {
        code: 'GAME_TEAM_START_FAILED',
        message: 'Failed to start team game',
        userMessage: 'Failed to start team game. Please try again.',
        context: { category }
      });
      dispatch({ type: 'SET_ERROR', payload: appError.userMessage ?? appError.message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const assignAnswerToTeam = useCallback((answerIndex: number, teamId: string, points: number) => {
    dispatch({ type: 'ASSIGN_ANSWER_TO_TEAM', payload: { answerIndex, teamId, points } });
  }, []);

  const endTeamTurn = useCallback(() => {
    dispatch({ type: 'END_TEAM_TURN' });
  }, []);

  const setTeamTimer = useCallback((seconds: number) => {
    dispatch({ type: 'SET_TEAM_TIMER', payload: seconds });
  }, []);

  const resetTeamsGame = useCallback(() => {
    dispatch({ type: 'RESET_TEAMS_GAME' });
  }, []);

  const getCurrentTeam = useCallback((): Team | null => {
    if (!state.teamGameState || !state.teamGameState.teams) return null;
    return state.teamGameState.teams[state.teamGameState.currentTeamIndex] || null;
  }, [state.teamGameState]);

  const getTeamScore = useCallback((teamId: string): number => {
    if (!state.teamGameState || !state.teamGameState.teams) return 0;
    const team = state.teamGameState.teams.find(t => t.id === teamId);
    return team?.score || 0;
  }, [state.teamGameState]);

  const getAssignedAnswersCount = useCallback((): number => {
    if (!state.teamGameState) return 0;
    return Object.keys(state.teamGameState.answerAssignments).length;
  }, [state.teamGameState]);

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
    resetGame,
    // Team mode functions
    startTeamsGame,
    assignAnswerToTeam,
    endTeamTurn,
    setTeamTimer,
    resetTeamsGame,
    getCurrentTeam,
    getTeamScore,
    getAssignedAnswersCount,
  };

  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  );
};
