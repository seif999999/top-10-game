/**
 * Custom hook for GameScreen state management
 * Extracts complex state logic from the main component
 */

import { useState, useRef, useCallback } from 'react';
import { Animated } from 'react-native';
import { QuestionAnswer } from '../../../shared/types';
import { useGame } from '../../contexts/GameContext';
import { useAuth } from '../../contexts/AuthContext';
import { useMultiplayer } from '../../contexts/MultiplayerContext';
import { logger } from '../../../backend/utils/logger';

export interface ToastState {
  visible: boolean;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message?: string;
}

export interface UseGameScreenStateProps {
  isMultiplayer?: boolean;
}

export function useGameScreenState({ isMultiplayer }: UseGameScreenStateProps) {
  const { user } = useAuth();
  const gameContext = useGame();
  const multiplayerContext = useMultiplayer();
  
  // UI State
  const [showResults, setShowResults] = useState(false);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [submittedAnswers, setSubmittedAnswers] = useState<string[]>([]);
  const [showQuestionComplete, setShowQuestionComplete] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);
  const [showGameEndRanking, setShowGameEndRanking] = useState(false);
  const [showMultiplayerLeaderboard, setShowMultiplayerLeaderboard] = useState(false);
  
  // Toast notification state
  const [toastNotification, setToastNotification] = useState<ToastState>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
  });
  
  // Team mode state
  const [showHostAssignModal, setShowHostAssignModal] = useState(false);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number>(-1);
  const [hasSubmittedThisTurn, setHasSubmittedThisTurn] = useState(false);
  
  // Multiplayer timer state
  const [multiplayerTimeRemaining, setMultiplayerTimeRemaining] = useState(60);
  const [serverOffset, setServerOffset] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<QuestionAnswer | null>(null);
  
  // Animation values
  const submitButtonScale = useRef(new Animated.Value(1)).current;
  const answerInputGlow = useRef(new Animated.Value(0)).current;
  const [lastAnswerResult, setLastAnswerResult] = useState<'correct' | 'incorrect' | null>(null);
  
  // Timer animation values
  const timerScale = useRef(new Animated.Value(1)).current;
  const timerPulse = useRef(new Animated.Value(1)).current;
  const timerFlash = useRef(new Animated.Value(0)).current;
  
  // Track points earned for current answer
  const [pointsEarned, setPointsEarned] = useState<number | null>(null);

  // Determine if we're in multiplayer mode
  const isMultiplayerMode = isMultiplayer === true;
  
  // Toast helpers
  const showToast = useCallback((type: ToastState['type'], title: string, message?: string) => {
    setToastNotification({
      visible: true,
      type,
      title,
      message,
    });
  }, []);

  const hideToast = useCallback(() => {
    setToastNotification(prev => ({ ...prev, visible: false }));
  }, []);

  // Multiplayer score helpers
  const getMultiplayerScore = useCallback(() => {
    const multiplayerState = multiplayerContext.currentRoom;
    if (!isMultiplayerMode || !multiplayerState || !user?.id) return 0;
    const score = multiplayerState.scores[user.id] || 0;
    logger.log(`🎯 UI_SCORE_DEBUG: Player ${user.id} score:`, {
      score,
      allScores: multiplayerState.scores,
      isMultiplayerMode,
      hasMultiplayerState: !!multiplayerState
    });
    return score;
  }, [isMultiplayerMode, multiplayerContext.currentRoom, user?.id]);

  const getMultiplayerCorrectAnswers = useCallback(() => {
    const multiplayerState = multiplayerContext.currentRoom;
    if (!isMultiplayerMode || !multiplayerState) return 0;
    const revealedAnswers = multiplayerState.revealedAnswers;
    if (!Array.isArray(revealedAnswers)) {
      logger.warn('⚠️ revealedAnswers is not an array:', revealedAnswers);
      return 0;
    }
    return revealedAnswers.filter(ra => ra !== null).length;
  }, [isMultiplayerMode, multiplayerContext.currentRoom]);

  const getMultiplayerLeaderboardData = useCallback(() => {
    const multiplayerState = multiplayerContext.currentRoom;
    if (!multiplayerState || !multiplayerState.players || !multiplayerState.scores) {
      return [];
    }

    return Object.entries(multiplayerState.players).map(([playerId, player]) => ({
      playerId,
      playerName: player.name || 'Unknown Player',
      score: multiplayerState.scores?.[playerId] || 0,
      rank: 0,
    }));
  }, [multiplayerContext.currentRoom]);

  return {
    // State
    showResults,
    setShowResults,
    isAnswerSubmitted,
    setIsAnswerSubmitted,
    submittedAnswers,
    setSubmittedAnswers,
    showQuestionComplete,
    setShowQuestionComplete,
    showAnswers,
    setShowAnswers,
    showGameEndRanking,
    setShowGameEndRanking,
    showMultiplayerLeaderboard,
    setShowMultiplayerLeaderboard,
    toastNotification,
    setToastNotification,
    showHostAssignModal,
    setShowHostAssignModal,
    selectedAnswerIndex,
    setSelectedAnswerIndex,
    hasSubmittedThisTurn,
    setHasSubmittedThisTurn,
    multiplayerTimeRemaining,
    setMultiplayerTimeRemaining,
    serverOffset,
    setServerOffset,
    selectedAnswer,
    setSelectedAnswer,
    lastAnswerResult,
    setLastAnswerResult,
    pointsEarned,
    setPointsEarned,
    
    // Animation refs
    submitButtonScale,
    answerInputGlow,
    timerScale,
    timerPulse,
    timerFlash,
    
    // Computed
    isMultiplayerMode,
    
    // Helpers
    showToast,
    hideToast,
    getMultiplayerScore,
    getMultiplayerCorrectAnswers,
    getMultiplayerLeaderboardData,
    
    // Contexts
    gameContext,
    multiplayerContext,
    user,
  };
}
