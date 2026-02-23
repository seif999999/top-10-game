/**
 * GameScreen module exports
 * Provides hooks, helpers, and utilities for game screen functionality
 */

export { useGameScreenState } from './useGameScreenState';
export type { ToastState, UseGameScreenStateProps } from './useGameScreenState';

export {
  getMultiplayerFinalRankAndScore,
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

export {
  ANIMATION_CONFIG,
  shakeAnimation,
  pulseAnimation,
  bounceAnimation,
  glowAnimation,
  flashAnimation,
  fadeInAnimation,
  fadeOutAnimation,
  slideInAnimation,
  springScaleAnimation,
  staggeredEntranceAnimation,
  timerPulseAnimation,
  celebrationAnimation,
} from './gameScreenAnimations';