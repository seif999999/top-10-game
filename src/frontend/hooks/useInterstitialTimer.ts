/**
 * Hook for tracking active gameplay time and triggering interstitial ads
 * at randomized intervals (90-150 seconds).
 * 
 * Timer pauses when:
 * - Match is paused
 * - Player is in menus
 * - Multiplayer live round is active (waiting for turn)
 * 
 * Timer only runs during active gameplay.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { logger } from '../../backend/utils/logger';

export interface UseInterstitialTimerOptions {
  /** Whether gameplay is currently active */
  isGameplayActive: boolean;
  /** Whether the game/match is paused */
  isPaused: boolean;
  /** Whether player is in a menu */
  isInMenu: boolean;
  /** Whether multiplayer live round is active (waiting for turn) */
  isMultiplayerRoundActive?: boolean;
  /** Callback when timer interval is reached */
  onIntervalReached: () => void;
  /** Minimum interval in milliseconds (default: 90000 = 90s) */
  minIntervalMs?: number;
  /** Maximum interval in milliseconds (default: 150000 = 150s) */
  maxIntervalMs?: number;
}

/**
 * Returns the current active gameplay time in milliseconds
 */
export function useInterstitialTimer({
  isGameplayActive,
  isPaused,
  isInMenu,
  isMultiplayerRoundActive = false,
  onIntervalReached,
  minIntervalMs = 90000, // 90 seconds
  maxIntervalMs = 150000, // 150 seconds
}: UseInterstitialTimerOptions): {
  /** Current active gameplay time in milliseconds */
  activeGameplayTime: number;
  /** Reset the timer (e.g., when starting a new game) */
  resetTimer: () => void;
} {
  const [activeGameplayTime, setActiveGameplayTime] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const nextIntervalMsRef = useRef<number | null>(null);
  const lastUpdateTimeRef = useRef<number>(Date.now());

  // Generate random interval on mount or reset
  const generateNextInterval = useCallback(() => {
    const interval = Math.floor(
      Math.random() * (maxIntervalMs - minIntervalMs + 1) + minIntervalMs
    );
    nextIntervalMsRef.current = interval;
    logger.log(`useInterstitialTimer: Next interval set to ${interval}ms (${interval / 1000}s)`);
    return interval;
  }, [minIntervalMs, maxIntervalMs]);

  // Reset timer
  const resetTimer = useCallback(() => {
    setActiveGameplayTime(0);
    lastUpdateTimeRef.current = Date.now();
    generateNextInterval();
    logger.log('useInterstitialTimer: Timer reset');
  }, [generateNextInterval]);

  // Initialize interval on mount
  useEffect(() => {
    generateNextInterval();
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [generateNextInterval]);

  // Main timer logic
  useEffect(() => {
    // Determine if timer should be running
    const shouldRun = 
      isGameplayActive && 
      !isPaused && 
      !isInMenu && 
      !isMultiplayerRoundActive;

    if (!shouldRun) {
      // Pause: clear interval but keep current time
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      // Update last update time to prevent time jump when resuming
      lastUpdateTimeRef.current = Date.now();
      return;
    }

    // Timer should run: start/continue interval
    if (intervalRef.current) {
      // Already running, just update last update time
      lastUpdateTimeRef.current = Date.now();
      return;
    }

    // Start new interval
    lastUpdateTimeRef.current = Date.now();
    const intervalMs = 1000; // Update every second

    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const delta = now - lastUpdateTimeRef.current;
      lastUpdateTimeRef.current = now;

      setActiveGameplayTime((prev) => {
        const newTime = prev + delta;
        
        // Check if we've reached the next interval
        if (nextIntervalMsRef.current !== null && newTime >= nextIntervalMsRef.current) {
          logger.log(`useInterstitialTimer: Interval reached at ${newTime}ms`);
          // Trigger callback
          onIntervalReached();
          // Generate next interval
          const nextInterval = generateNextInterval();
          // Reset time to remainder (carry over any excess)
          return newTime - nextIntervalMsRef.current;
        }
        
        return newTime;
      });
    }, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [
    isGameplayActive,
    isPaused,
    isInMenu,
    isMultiplayerRoundActive,
    onIntervalReached,
    generateNextInterval,
  ]);

  return {
    activeGameplayTime,
    resetTimer,
  };
}
