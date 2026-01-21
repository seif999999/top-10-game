/**
 * Room Management Module for Multiplayer
 * Handles room creation, joining, and leaving operations
 */

import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { RoomData, Player, Question, LegacyQuestion } from '../../../shared/types/game';
import { normalizeQuestion } from '../questionsService';
import { logger } from '../../utils/logger';
import { COLLECTIONS } from '../../utils/constants';
import { RateLimitService } from '../rateLimitService';
import { ServerGameService } from '../serverGameService';
import { AppError, toAppError } from '../../../shared/errors';
import { generateSecureRoomCode } from '../../utils/secureRandom';

/**
 * Generate a unique 6-character room code
 * ✅ SECURITY: Uses cryptographically secure random generation
 */
export async function generateRoomCode(): Promise<string> {
  return generateSecureRoomCode();
}

/**
 * Check if a room code is already in use
 */
export async function isRoomCodeAvailable(roomCode: string): Promise<boolean> {
  try {
    const roomRef = doc(db, COLLECTIONS.MULTIPLAYER_GAMES, roomCode);
    const roomSnap = await getDoc(roomRef);
    return !roomSnap.exists();
  } catch (error) {
    logger.error('Error checking room code availability:', error);
    return false;
  }
}

/**
 * Generate a unique available room code
 * ✅ SECURITY: Uses cryptographically secure random generation
 */
export async function generateUniqueRoomCode(maxAttempts: number = 10): Promise<string> {
  let attempts = 0;
  let roomCode: string;
  
  do {
    roomCode = await generateRoomCode();
    attempts++;
    if (attempts > maxAttempts) {
      // ✅ SECURITY: Append secure random suffix if collisions persist
      const suffix = await generateSecureRoomCode();
      roomCode = `${roomCode.substring(0, 4)}${suffix.substring(0, 2)}`;
      break;
    }
  } while (!(await isRoomCodeAvailable(roomCode)));
  
  return roomCode;
}

/**
 * Sanitize object for Firestore - removes undefined values
 */
export function sanitizeForFirestore<T extends Record<string, unknown>>(obj: T): T {
  const sanitized = {} as T;
  
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) {
      continue; // Skip undefined values
    } else if (value === null) {
      (sanitized as Record<string, unknown>)[key] = null;
    } else if (Array.isArray(value)) {
      (sanitized as Record<string, unknown>)[key] = value.map(item => 
        typeof item === 'object' && item !== null 
          ? sanitizeForFirestore(item as Record<string, unknown>)
          : item
      );
    } else if (typeof value === 'object' && value !== null) {
      (sanitized as Record<string, unknown>)[key] = sanitizeForFirestore(value as Record<string, unknown>);
    } else {
      (sanitized as Record<string, unknown>)[key] = value;
    }
  }
  
  return sanitized;
}

/**
 * Validate room data structure
 */
export function validateRoomDataStructure(roomData: Partial<RoomData>): boolean {
  const requiredFields = ['roomCode', 'hostId', 'status', 'players'];
  
  for (const field of requiredFields) {
    if (!(field in roomData) || roomData[field as keyof RoomData] === undefined) {
      logger.error(`❌ Missing required field: ${field}`);
      return false;
    }
  }
  
  return true;
}

/**
 * Create initial room data
 */
export function createInitialRoomData(options: {
  roomCode: string;
  hostId: string;
  category: string;
  questions: Array<Question | LegacyQuestion>;
  hostName?: string;
  selectedAvatar?: string;
}): RoomData {
  const { roomCode, hostId, category, questions, hostName, selectedAvatar } = options;
  const now = Date.now();
  
  // Normalize questions to unified format
  const preparedQuestions = (questions || []).map(q => normalizeQuestion(q));
  
  return {
    roomCode,
    hostId,
    createdAt: now,
    status: 'lobby',
    category: category || 'General',
    questions: preparedQuestions,
    currentQuestionIndex: 0,
    players: {
      [hostId]: {
        id: hostId,
        name: hostName || 'Player',
        score: 0,
        isHost: true,
        joinedAt: now,
        isConnected: true,
        lastSeen: now,
        selectedAvatar: selectedAvatar
      }
    },
    gamePhase: 'lobby',
    questionStartTime: 0,
    questionTimeLimit: 60,
    currentAnswers: [],
    revealedAnswers: Array(10).fill(null),
    scores: { [hostId]: 0 },
    answersSubmittedCount: 0,
    turnTimeLimit: 60,
    turnOrder: [hostId],
    currentTurnIndex: 0,
    answerOwners: {},
    playerSubmissions: {},
    maxPlayers: 8,
    isPrivate: false,
    lastActivity: now
  };
}

/**
 * Create a player object
 */
export function createPlayer(options: {
  id: string;
  name: string;
  isHost?: boolean;
  selectedAvatar?: string;
}): Player {
  const now = Date.now();
  
  return {
    id: options.id,
    name: options.name,
    score: 0,
    isHost: options.isHost || false,
    joinedAt: now,
    isConnected: true,
    lastSeen: now,
    selectedAvatar: options.selectedAvatar
  };
}

/**
 * Check if a player can join a room
 */
export interface JoinCheckResult {
  canJoin: boolean;
  reason?: string;
}

export function checkCanJoinRoom(roomData: RoomData, playerId: string): JoinCheckResult {
  // Check if room is in lobby state
  if (roomData.status !== 'lobby') {
    return { canJoin: false, reason: 'Game has already started' };
  }
  
  // Check if room is full
  const playerCount = Object.keys(roomData.players || {}).length;
  const maxPlayers = roomData.maxPlayers || 8;
  if (playerCount >= maxPlayers) {
    return { canJoin: false, reason: 'Room is full' };
  }
  
  // Check if player is already in room
  if (roomData.players?.[playerId]) {
    // Player already exists, this is a rejoin
    return { canJoin: true };
  }
  
  return { canJoin: true };
}

/**
 * Get room data by room code
 */
export async function getRoomData(roomCode: string): Promise<RoomData | null> {
  try {
    const roomRef = doc(db, COLLECTIONS.MULTIPLAYER_GAMES, roomCode);
    const roomSnap = await getDoc(roomRef);
    
    if (!roomSnap.exists()) {
      return null;
    }
    
    return roomSnap.data() as RoomData;
  } catch (error) {
    logger.error('Error getting room data:', error);
    return null;
  }
}

/**
 * Update room data
 */
export async function updateRoomData(
  roomCode: string, 
  updates: Partial<RoomData>
): Promise<void> {
  const roomRef = doc(db, COLLECTIONS.MULTIPLAYER_GAMES, roomCode);
  await updateDoc(roomRef, {
    ...updates,
    lastActivity: serverTimestamp()
  });
}

/**
 * Delete a room
 */
export async function deleteRoom(roomCode: string): Promise<void> {
  const roomRef = doc(db, COLLECTIONS.MULTIPLAYER_GAMES, roomCode);
  await deleteDoc(roomRef);
}
