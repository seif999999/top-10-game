import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { startNewGame, processAnswer, nextQuestion, generateGameResults, isQuestionComplete as checkQuestionComplete } from '../services/gameLogic';
import { GameState, GameResults, PlayerAnswer, GameQuestion } from '../types';
import { Team, TeamGameState, TeamSetupConfig } from '../types/teams';

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
  | { type: 'START_GAME'; payload: { category: string; players: string[]; selectedQuestion?: any } }
  | { type: 'SET_ANSWER'; payload: string }
  | { type: 'SUBMIT_ANSWER'; payload: { playerId: string; answer: string } }
  | { type: 'NEXT_QUESTION' }
  | { type: 'END_GAME' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SUGGESTIONS'; payload: string[] }
  | { type: 'RESET_GAME' }
  // Team mode actions
  | { type: 'START_TEAMS_GAME'; payload: { category: string; selectedQuestion?: any; config: TeamSetupConfig } }
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

const gameReducer = (state: GameContextState, action: GameAction): GameContextState => {
  switch (action.type) {
    case 'START_GAME':
      try {
        const { category, players, selectedQuestion } = action.payload;
        console.log(`🎮 START_GAME action - Category: ${category}, Players: ${players}, SelectedQuestion: ${selectedQuestion ? 'YES' : 'NO'}`);
        
        const newGameState = startNewGame(category, players, selectedQuestion ? 1 : 10, selectedQuestion);
        console.log(`🎮 START_GAME - New game state created:`, {
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
        console.log('🔄 SUBMIT_ANSWER - Game phase after update:', updatedState.gamePhase);

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

    // Team mode cases
    case 'START_TEAMS_GAME':
      try {
        const { category, selectedQuestion, config } = action.payload;
        console.log(`🎮 START_TEAMS_GAME action - Category: ${category}, Config:`, config);
        
        // Create the regular game state first (needed for questions)
        const newGameState = startNewGame(category, ['Host'], selectedQuestion ? 1 : 10, selectedQuestion);
        console.log(`🎮 START_TEAMS_GAME - Game state created:`, {
          category: newGameState.category,
          totalRounds: newGameState.totalRounds,
          currentQuestion: newGameState.currentQuestion?.title,
          shuffledQuestionsCount: newGameState.shuffledQuestions?.length
        });
        
        newGameState.gamePhase = 'question';
        
        // Create teams
        console.log(`🎮 Creating teams from config:`, {
          numberOfTeams: config.numberOfTeams,
          teamNamesLength: config.teamNames.length,
          teamNames: config.teamNames
        });
        
        const teams: Team[] = config.teamNames.map((name, index) => ({
          id: `team-${index + 1}`,
          name,
          color: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'][index],
          score: 0,
        }));
        
        console.log(`🎮 Created ${teams.length} teams:`, teams.map(t => ({ id: t.id, name: t.name })));

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
        console.error(`❌ START_TEAMS_GAME error:`, error);
        return {
          ...state,
          error: 'Failed to start team game'
        };
      }

    case 'ASSIGN_ANSWER_TO_TEAM':
      try {
        if (!state.teamGameState) throw new Error('No active team game');
        
        const { answerIndex, teamId, points } = action.payload;
        const updatedTeamGameState = { ...state.teamGameState };
        
        // Update team score
        const teamIndex = updatedTeamGameState.teams.findIndex(t => t.id === teamId);
        if (teamIndex !== -1) {
          updatedTeamGameState.teams[teamIndex].score += points;
        }
        
        // Record assignment
        updatedTeamGameState.answerAssignments[answerIndex] = { teamId, points };
        
        console.log(`🎯 Answer ${answerIndex} assigned to team ${teamId} for ${points} points`);
        
        return {
          ...state,
          teamGameState: updatedTeamGameState,
        };
      } catch (error) {
        console.error('❌ ASSIGN_ANSWER_TO_TEAM Error:', error);
        return {
          ...state,
          error: 'Failed to assign answer to team'
        };
      }

    case 'END_TEAM_TURN':
      try {
        if (!state.teamGameState) throw new Error('No active team game');
        
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
        
        console.log(`🔄 Turn ended, now team ${updatedTeamGameState.currentTeamIndex + 1}'s turn`);
        
        return {
          ...state,
          teamGameState: updatedTeamGameState,
        };
      } catch (error) {
        console.error('❌ END_TEAM_TURN Error:', error);
        return {
          ...state,
          error: 'Failed to end team turn'
        };
      }

    case 'SET_TEAM_TIMER':
      try {
        if (!state.teamGameState) throw new Error('No active team game');
        
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
        console.error('❌ SET_TEAM_TIMER Error:', error);
        return {
          ...state,
          error: 'Failed to update team timer'
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
  startGame: (category: string, players: string[], selectedQuestion?: any) => void;
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
  startTeamsGame: (category: string, config: TeamSetupConfig, selectedQuestion?: any) => void;
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
    return checkQuestionComplete(state.gameState);
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
  const startTeamsGame = useCallback((category: string, config: TeamSetupConfig, selectedQuestion?: any) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      dispatch({ type: 'START_TEAMS_GAME', payload: { category, selectedQuestion, config } });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to start team game' });
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
