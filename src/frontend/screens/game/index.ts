/**
 * GameScreen module exports
 * Provides hooks, helpers, and utilities for game screen functionality
 */

export { useGameScreenState } from './useGameScreenState';
export type { ToastState, UseGameScreenStateProps } from './useGameScreenState';

export {
  isMultiplayerQuestionComplete,
  getCurrentRoundAnswers,
  showConfirmDialog,
  showHelpDialog,
  showGameRulesDialog,
  formatTimeDisplay,
  isAnswerRevealed,
  getRevealedAnswerData,
  isMyTurn,
  getPlayerName,
} from './gameScreenHelpers';
