/**
 * Helper functions for GameScreen
 * Extracts pure logic from the main component
 */

import { Platform, Alert } from 'react-native';
import { logger } from '../../../backend/utils/logger';
import type { RoomData } from '../../../shared/types/game';

/**
 * Check if a multiplayer question is complete
 */
export function isMultiplayerQuestionComplete(
  multiplayerState: RoomData | null,
  currentQuestion: { answers?: { text: string }[] } | null
): boolean {
  if (!multiplayerState || !currentQuestion) return false;
  const totalAnswers = currentQuestion.answers?.length || 0;
  const revealedAnswers = multiplayerState.revealedAnswers;
  if (!Array.isArray(revealedAnswers)) {
    logger.warn('⚠️ revealedAnswers is not an array:', revealedAnswers);
    return false;
  }
  const revealedCount = revealedAnswers.filter(ra => ra !== null).length;
  return revealedCount >= totalAnswers;
}

/**
 * Get current round answers for single-player mode
 */
export function getCurrentRoundAnswers(
  gameState: { currentRound: number; rounds: { playerAnswers?: { playerId: string; answer: string }[] }[] } | null,
  isMultiplayerMode: boolean,
  multiplayerSubmittedAnswers: string[]
): string[] {
  if (isMultiplayerMode) {
    return multiplayerSubmittedAnswers;
  }
  if (!gameState || !gameState.rounds[gameState.currentRound - 1]) return [];
  const currentRound = gameState.rounds[gameState.currentRound - 1];
  if (!currentRound.playerAnswers || !Array.isArray(currentRound.playerAnswers)) return [];
  return currentRound.playerAnswers
    .filter(answer => answer.playerId === 'You')
    .map(answer => answer.answer);
}

/**
 * Show a cross-platform confirmation dialog
 */
export function showConfirmDialog(
  title: string,
  message: string,
  onConfirm: () => void,
  confirmText: string = 'Confirm',
  cancelText: string = 'Cancel'
): void {
  if (Platform.OS === 'web') {
    const confirmed = window.confirm(message);
    if (confirmed) {
      onConfirm();
    }
  } else {
    Alert.alert(
      title,
      message,
      [
        { text: cancelText, style: 'cancel' },
        { text: confirmText, style: 'destructive', onPress: onConfirm }
      ]
    );
  }
}

/**
 * Show help dialog
 */
export function showHelpDialog(): void {
  Alert.alert(
    'How to Play TOP 10',
    'READ: Read the question carefully and think about the top 10 answers\n\nANSWER: Type your answer and submit - you can submit multiple answers!\n\nSCORE: The closer your answer is to #1, the more points you get\n\nTIP: Think broadly and submit as many relevant answers as possible!\n\nFind all 10 correct answers to complete each question!\n\nGood luck!',
    [{ text: 'Got it' }]
  );
}

/**
 * Show game rules dialog
 */
export function showGameRulesDialog(): void {
  Alert.alert(
    'Game Rules',
    'OBJECTIVE: Guess the top 10 answers to each question\n\nSCORING:\n• #1 answer = 1 point\n• #2 answer = 2 points\n• #3 answer = 3 points\n• And so on...\n\nMULTIPLE ANSWERS: Submit as many as you can!\n\nPROGRESS: Find all 10 correct answers to complete each question',
    [{ text: 'Understood' }]
  );
}

/**
 * Format time remaining for display
 */
export function formatTimeDisplay(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Check if an answer is revealed in multiplayer mode
 */
export function isAnswerRevealed(
  answerIndex: number,
  multiplayerState: RoomData | null
): boolean {
  if (!multiplayerState?.revealedAnswers) return false;
  const revealedAnswers = multiplayerState.revealedAnswers;
  if (!Array.isArray(revealedAnswers)) return false;
  return revealedAnswers[answerIndex] !== null && revealedAnswers[answerIndex] !== undefined;
}

/**
 * Get revealed answer data for a specific index
 */
export function getRevealedAnswerData(
  answerIndex: number,
  multiplayerState: RoomData | null
): { answerId: string; playerId: string; points: number } | null {
  if (!multiplayerState?.revealedAnswers) return null;
  const revealedAnswers = multiplayerState.revealedAnswers;
  if (!Array.isArray(revealedAnswers)) return null;
  return revealedAnswers[answerIndex] || null;
}

/**
 * Check if it's the current user's turn in multiplayer
 */
export function isMyTurn(
  multiplayerState: RoomData | null,
  userId: string | undefined
): boolean {
  if (!multiplayerState || !userId) return false;
  return multiplayerState.currentPlayerId === userId;
}

/**
 * Get player name from multiplayer state
 */
export function getPlayerName(
  playerId: string,
  multiplayerState: RoomData | null
): string {
  if (!multiplayerState?.players) return 'Unknown Player';
  return multiplayerState.players[playerId]?.name || 'Unknown Player';
}
