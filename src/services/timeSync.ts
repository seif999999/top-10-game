// Server time synchronization for accurate timer display
// Handles client-server time drift and provides accurate time remaining calculations

import { doc, setDoc, getDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';

let serverTimeOffset: number | null = null;
let lastSyncTime: number = 0;
const SYNC_INTERVAL = 30000; // 30 seconds
const SYNC_SAMPLES = 3;

/**
 * Get the current server time offset
 * Returns cached offset if recent, otherwise performs new sync
 */
export async function getServerTimeOffset(): Promise<number> {
  const now = Date.now();
  
  // Return cached offset if it's recent
  if (serverTimeOffset !== null && (now - lastSyncTime) < SYNC_INTERVAL) {
    return serverTimeOffset;
  }
  
  console.log('🕐 TIMERSYNC: Computing server time offset...');
  
  try {
    const offset = await computeServerTimeOffset();
    serverTimeOffset = offset;
    lastSyncTime = now;
    
    console.log(`✅ TIMERSYNC: Server offset computed: ${offset}ms`);
    return offset;
  } catch (error) {
    console.warn('⚠️ TIMERSYNC: Failed to compute server offset, using cached or fallback:', error);
    
    // Return cached offset or fallback to 0
    return serverTimeOffset || 0;
  }
}

/**
 * Compute server time offset by sampling server timestamps
 * Takes multiple samples and averages them for accuracy
 */
async function computeServerTimeOffset(): Promise<number> {
  const samples: number[] = [];
  
  for (let i = 0; i < SYNC_SAMPLES; i++) {
    try {
      const sample = await sampleServerTime();
      samples.push(sample);
      
      // Small delay between samples
      if (i < SYNC_SAMPLES - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.warn(`⚠️ TIMERSYNC: Sample ${i + 1} failed:`, error);
    }
  }
  
  if (samples.length === 0) {
    throw new Error('No successful time samples');
  }
  
  // Average the samples
  const averageOffset = samples.reduce((sum, offset) => sum + offset, 0) / samples.length;
  
  console.log(`🕐 TIMERSYNC: Computed offset from ${samples.length} samples: ${averageOffset}ms`);
  return averageOffset;
}

/**
 * Sample server time by writing and reading a timestamp
 */
async function sampleServerTime(): Promise<number> {
  const clientTimeBefore = Date.now();
  
  // Create a temporary document with server timestamp
  const tempRef = doc(db, 'timeSyncDocs', `temp_${Date.now()}_${Math.random()}`);
  await setDoc(tempRef, { 
    timestamp: serverTimestamp(),
    clientTime: clientTimeBefore 
  });
  
  const clientTimeAfter = Date.now();
  const clientTimeMid = (clientTimeBefore + clientTimeAfter) / 2;
  
  // Read the document back
  const snap = await getDoc(tempRef);
  const serverTime = snap.data()?.timestamp;
  
  if (!serverTime) {
    throw new Error('Failed to read server timestamp');
  }
  
  // Convert server timestamp to milliseconds
  const serverTimeMs = serverTime.toMillis ? serverTime.toMillis() : serverTime;
  
  // Calculate offset (positive means server is ahead)
  const offset = serverTimeMs - clientTimeMid;
  
  // Clean up temporary document
  try {
    await deleteDoc(tempRef);
  } catch (error) {
    // Ignore cleanup errors
  }
  
  return offset;
}

/**
 * Calculate time remaining for a round
 * @param roundStartTs Server timestamp when round started
 * @param roundDurationSeconds Duration of the round in seconds
 * @returns Time remaining in milliseconds
 */
export async function calculateTimeRemaining(
  roundStartTs: number | any,
  roundDurationSeconds: number
): Promise<number> {
  try {
    // Get server time offset
    const offset = await getServerTimeOffset();
    
    // Convert roundStartTs to milliseconds if it's a Firestore timestamp
    let startTimeMs: number;
    if (typeof roundStartTs === 'object' && roundStartTs?.toMillis) {
      startTimeMs = roundStartTs.toMillis();
    } else if (typeof roundStartTs === 'number') {
      startTimeMs = roundStartTs;
    } else {
      console.warn('⚠️ TIMERSYNC: Invalid roundStartTs, using client time');
      startTimeMs = Date.now();
    }
    
    // Calculate elapsed time with server offset
    const now = Date.now() + offset;
    const elapsed = now - startTimeMs;
    const remaining = Math.max(0, (roundDurationSeconds * 1000) - elapsed);
    
    console.log(`🕐 TIMERSYNC: Time remaining calculation:`, {
      startTimeMs,
      now,
      elapsed: Math.round(elapsed / 1000),
      remaining: Math.round(remaining / 1000),
      offset
    });
    
    return remaining;
  } catch (error) {
    console.error('❌ TIMERSYNC: Failed to calculate time remaining:', error);
    
    // Fallback to client-side calculation
    const now = Date.now();
    const startTimeMs = typeof roundStartTs === 'number' ? roundStartTs : now;
    const elapsed = now - startTimeMs;
    const remaining = Math.max(0, (roundDurationSeconds * 1000) - elapsed);
    
    console.warn('⚠️ TIMERSYNC: Using fallback client-side calculation');
    return remaining;
  }
}

/**
 * Get formatted time remaining string
 * @param timeRemainingMs Time remaining in milliseconds
 * @returns Formatted string (e.g., "1:30" or "Time's up!")
 */
export function formatTimeRemaining(timeRemainingMs: number): string {
  if (timeRemainingMs <= 0) {
    return "Time's up!";
  }
  
  const seconds = Math.ceil(timeRemainingMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes > 0) {
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Check if a round has expired
 * @param roundStartTs Server timestamp when round started
 * @param roundDurationSeconds Duration of the round in seconds
 * @returns True if the round has expired
 */
export async function isRoundExpired(
  roundStartTs: number | any,
  roundDurationSeconds: number
): Promise<boolean> {
  const timeRemaining = await calculateTimeRemaining(roundStartTs, roundDurationSeconds);
  return timeRemaining <= 0;
}

// Log time sync system initialization
console.log('🕐 Time synchronization system initialized');
