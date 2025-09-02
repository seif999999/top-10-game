import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  arrayUnion, 
  onSnapshot, 
  query, 
  where, 
  getDocs,
  Unsubscribe 
} from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { db, auth } from './firebase';

/**
 * Ensures the user is authenticated, signs them in anonymously if not
 * @returns Promise<string> - The user's UID
 */
const ensureAuthenticated = async (): Promise<string> => {
  // Check if user is already authenticated
  if (auth.currentUser) {
    console.log(`✅ User already authenticated with UID: ${auth.currentUser.uid}`);
    return auth.currentUser.uid;
  }

  // Sign in anonymously if not authenticated
  try {
    console.log('🔐 No user authenticated, signing in anonymously...');
    const userCredential = await signInAnonymously(auth);
    const uid = userCredential.user.uid;
    console.log(`✅ Anonymous authentication successful with UID: ${uid}`);
    return uid;
  } catch (error) {
    console.error('❌ Anonymous authentication failed:', error);
    throw new Error('Failed to authenticate user. Please check your connection and try again.');
  }
};

// Room data structure
export interface RoomData {
  roomCode: string;
  hostId: string;
  players: string[];
  gameState: 'waiting' | 'starting' | 'playing' | 'finished';
  createdAt: Date;
  updatedAt: Date;
  maxPlayers?: number;
  category?: string;
  questions?: any[]; // Selected questions for the game
}

// Generate a unique 6-character alphanumeric room code
const generateRoomCode = (): string => {
  // Use a larger character set to reduce collision probability
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  
  // Use crypto-random if available for better randomness
  const getRandomInt = (max: number): number => {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const array = new Uint32Array(1);
      crypto.getRandomValues(array);
      return array[0] % max;
    }
    return Math.floor(Math.random() * max);
  };
  
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(getRandomInt(chars.length));
  }
  
  return result;
};

// Check if a room code already exists
// Note: This assumes optimistic creation - if there's a permission issue,
// we'll catch it during the actual room creation instead
const roomCodeExists = async (roomCode: string): Promise<boolean> => {
  try {
    const roomRef = doc(db, 'rooms', roomCode);
    const roomDoc = await getDoc(roomRef);
    return roomDoc.exists();
  } catch (error) {
    console.error('Error checking room code existence:', error);
    
    // If we have permission issues checking existence, 
    // we'll assume the code doesn't exist and let the creation attempt fail gracefully
    if (error instanceof Error && error.message.includes('permission')) {
      console.log('⚠️ Permission denied checking room existence - will attempt optimistic creation');
      return false; // Assume room doesn't exist, let creation handle conflicts
    }
    
    // For other errors, still try to be helpful
    if (error instanceof Error) {
      if (error.message.includes('network')) {
        throw new Error('Network error while checking room code availability. Please check your internet connection.');
      } else if (error.message.includes('unavailable')) {
        throw new Error('Firebase service temporarily unavailable. Please try again in a moment.');
      }
    }
    
    // For unknown errors, assume optimistic creation
    console.log('⚠️ Unknown error checking room existence - will attempt optimistic creation');
    return false;
  }
};

/**
 * Creates a new multiplayer room
 * @param category - The game category for this room
 * @param maxPlayers - Maximum number of players (optional, defaults to 4)
 * @returns Promise<string> - The generated room code
 */
export const createRoom = async (
  category: string,
  maxPlayers: number = 4
): Promise<string> => {
  if (!category || category.trim() === '') {
    throw new Error('Category is required');
  }

  // Ensure user is authenticated and get their UID
  const hostId = await ensureAuthenticated();

  let roomCode = '';
  let attempts = 0;
  const maxAttempts = 10;

  // Generate unique room code with optimistic creation approach
  // We'll try a few codes and then attempt creation - if there's a collision,
  // Firestore will give us a specific error we can handle
  for (let attempt = 1; attempt <= 3; attempt++) {
    roomCode = generateRoomCode();
    console.log(`🎲 Attempt ${attempt}/3: Generated room code ${roomCode}`);
    
    try {
      // Check if room exists (with permission-aware handling)
      const exists = await roomCodeExists(roomCode);
      console.log(`🔍 Room code ${roomCode} exists: ${exists}`);
      
      if (!exists) {
        console.log(`✅ Room code ${roomCode} appears available, proceeding with creation`);
        break;
      } else {
        console.log(`❌ Room code ${roomCode} already exists, generating new one...`);
        if (attempt === 3) {
          // For the last attempt, use a timestamp-based approach for better uniqueness
          const timestamp = Date.now().toString().slice(-4);
          const random = Math.random().toString(36).substr(2, 2).toUpperCase();
          roomCode = timestamp + random;
          console.log(`🔄 Final attempt using timestamp-based code: ${roomCode}`);
          break;
        }
      }
    } catch (error) {
      console.error(`❌ Error checking room code ${roomCode} (attempt ${attempt}):`, error);
      
      // For the last attempt or critical errors, use timestamp-based fallback
      if (attempt === 3) {
        const timestamp = Date.now().toString().slice(-4);
        const random = Math.random().toString(36).substr(2, 2).toUpperCase();
        roomCode = timestamp + random;
        console.log(`🔄 Error fallback using timestamp-based code: ${roomCode}`);
        break;
      }
      
      // Add a small delay before retrying
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }

  // At this point we have a room code to try

  // Create room document with host automatically added to players
  const roomData: RoomData = {
    roomCode,
    hostId,
    players: [hostId], // Host is automatically added to players array
    gameState: 'waiting',
    createdAt: new Date(),
    updatedAt: new Date(),
    maxPlayers,
    category
  };

  try {
    const roomRef = doc(db, 'rooms', roomCode);
    
    // Use setDoc without merge to ensure we're creating a new document
    // This will fail if the document already exists, which is what we want
    await setDoc(roomRef, roomData);
    
    console.log(`✅ Room created successfully with code: ${roomCode}`);
    console.log(`🎯 Host ${hostId} automatically added to players array`);
    console.log(`📝 Room data:`, roomData);
    return roomCode;
  } catch (error) {
    console.error('Error creating room:', error);
    
    // If this was a document collision (very rare), try one more time with a new code
    if (error instanceof Error && error.message.includes('already exists')) {
      console.log('🔄 Room code collision detected, generating new code...');
      const timestamp = Date.now().toString().slice(-3);
      const random = Math.random().toString(36).substr(2, 3).toUpperCase();
      const newRoomCode = timestamp + random;
      
      const newRoomData = { ...roomData, roomCode: newRoomCode };
      const newRoomRef = doc(db, 'rooms', newRoomCode);
      
      try {
        await setDoc(newRoomRef, newRoomData);
        console.log(`✅ Room created successfully with collision-safe code: ${newRoomCode}`);
        return newRoomCode;
      } catch (retryError) {
        console.error('Error creating room on retry:', retryError);
        throw new Error('Failed to create room after collision retry');
      }
    }
    
    // For permission errors, provide helpful message
    if (error instanceof Error && error.message.includes('permission')) {
      throw new Error('Permission denied. Please ensure you are logged in and have proper access.');
    }
    
    throw new Error(`Failed to create room: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Joins an existing room
 * @param roomCode - The room code to join
 * @returns Promise<void>
 */
export const joinRoom = async (roomCode: string): Promise<void> => {
  if (!roomCode || roomCode.trim() === '') {
    throw new Error('Room code is required');
  }

  // Ensure user is authenticated and get their UID
  const playerId = await ensureAuthenticated();

  // Normalize room code to uppercase
  const normalizedRoomCode = roomCode.toUpperCase().trim();

  try {
    const roomRef = doc(db, 'rooms', normalizedRoomCode);
    const roomDoc = await getDoc(roomRef);

    if (!roomDoc.exists()) {
      throw new Error('Room not found. Please check the room code and try again.');
    }

    const roomData = roomDoc.data() as RoomData;

    // Check if room is in waiting state
    if (roomData.gameState !== 'waiting') {
      throw new Error('Cannot join room. Game has already started or finished.');
    }

    // Check if player is already in the room
    if (roomData.players.includes(playerId)) {
      console.log(`Player ${playerId} is already in room ${normalizedRoomCode}`);
      return; // Already in room, no error needed
    }

    // Check room capacity
    if (roomData.maxPlayers && roomData.players.length >= roomData.maxPlayers) {
      throw new Error('Room is full. Cannot join.');
    }

    // Add player to room
    await updateDoc(roomRef, {
      players: arrayUnion(playerId),
      updatedAt: new Date()
    });

    console.log(`✅ Player ${playerId} joined room ${normalizedRoomCode}`);
    console.log(`🎯 Current players in room: [${roomData.players.join(', ')}, ${playerId}]`);
  } catch (error) {
    console.error('Error joining room:', error);
    
    // Re-throw with appropriate error message
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Failed to join room');
    }
  }
};

/**
 * Leaves a room
 * @param roomCode - The room code to leave
 * @returns Promise<void>
 */
export const leaveRoom = async (roomCode: string): Promise<void> => {
  if (!roomCode || roomCode.trim() === '') {
    throw new Error('Room code is required');
  }

  // Ensure user is authenticated and get their UID
  const playerId = await ensureAuthenticated();

  const normalizedRoomCode = roomCode.toUpperCase().trim();

  try {
    const roomRef = doc(db, 'rooms', normalizedRoomCode);
    const roomDoc = await getDoc(roomRef);

    if (!roomDoc.exists()) {
      throw new Error('Room not found');
    }

    const roomData = roomDoc.data() as RoomData;

    // Remove player from room
    const updatedPlayers = roomData.players.filter(id => id !== playerId);
    
    await updateDoc(roomRef, {
      players: updatedPlayers,
      updatedAt: new Date()
    });

    console.log(`✅ Player ${playerId} left room ${normalizedRoomCode}`);
  } catch (error) {
    console.error('Error leaving room:', error);
    throw new Error('Failed to leave room');
  }
};

/**
 * Subscribes to room changes with real-time updates
 * @param roomCode - The room code to subscribe to
 * @param callback - Callback function to handle room data updates
 * @returns Unsubscribe function to stop listening
 */
export const subscribeToRoom = (
  roomCode: string, 
  callback: (roomData: RoomData | null) => void
): Unsubscribe => {
  if (!roomCode || roomCode.trim() === '') {
    throw new Error('Room code is required');
  }

  const normalizedRoomCode = roomCode.toUpperCase().trim();
  const roomRef = doc(db, 'rooms', normalizedRoomCode);

  console.log(`🔄 Subscribing to room updates for: ${normalizedRoomCode}`);

  return onSnapshot(
    roomRef,
    (doc) => {
      if (doc.exists()) {
        const roomData = doc.data() as RoomData;
        // Convert Firestore timestamps to Date objects
        const processedData: RoomData = {
          ...roomData,
          createdAt: roomData.createdAt instanceof Date ? roomData.createdAt : (roomData.createdAt as any)?.toDate?.() || new Date(),
          updatedAt: roomData.updatedAt instanceof Date ? roomData.updatedAt : (roomData.updatedAt as any)?.toDate?.() || new Date()
        };
        console.log(`📦 Room data updated:`, processedData);
        callback(processedData);
      } else {
        console.log(`❌ Room ${normalizedRoomCode} not found`);
        callback(null);
      }
    },
    (error) => {
      console.error('Error in room subscription:', error);
      callback(null);
    }
  );
};

/**
 * Updates room game state
 * @param roomCode - The room code to update
 * @param gameState - New game state
 * @param category - Optional category for the game
 * @returns Promise<void>
 */
export const updateRoomGameState = async (
  roomCode: string, 
  gameState: RoomData['gameState'],
  category?: string
): Promise<void> => {
  if (!roomCode || roomCode.trim() === '') {
    throw new Error('Room code is required');
  }

  const normalizedRoomCode = roomCode.toUpperCase().trim();

  try {
    const roomRef = doc(db, 'rooms', normalizedRoomCode);
    const updateData: Partial<RoomData> = {
      gameState,
      updatedAt: new Date()
    };

    if (category) {
      updateData.category = category;
    }

    await updateDoc(roomRef, updateData);
    console.log(`✅ Room ${normalizedRoomCode} game state updated to: ${gameState}`);
  } catch (error) {
    console.error('Error updating room game state:', error);
    throw new Error('Failed to update room state');
  }
};

/**
 * Update the selected questions for a room
 * @param roomCode - The room code
 * @param questions - Array of selected questions
 */
export const updateRoomQuestions = async (roomCode: string, questions: any[]): Promise<void> => {
  if (!roomCode || roomCode.trim() === '') {
    throw new Error('Room code is required');
  }

  const normalizedRoomCode = roomCode.toUpperCase().trim();

  try {
    const uid = await ensureAuthenticated();
    const roomRef = doc(db, 'rooms', normalizedRoomCode);
    
    // Check if user is the host
    const roomDoc = await getDoc(roomRef);
    if (!roomDoc.exists()) {
      throw new Error('Room not found');
    }
    
    const roomData = roomDoc.data() as RoomData;
    if (roomData.hostId !== uid) {
      throw new Error('Only the host can select questions');
    }
    
    await updateDoc(roomRef, {
      questions,
      updatedAt: new Date()
    });
    
    console.log(`✅ Questions updated for room ${normalizedRoomCode}: ${questions.length} questions selected`);
  } catch (error) {
    console.error('❌ Error updating questions:', error);
    throw error;
  }
};

/**
 * Gets room data without subscribing
 * @param roomCode - The room code to get data for
 * @returns Promise<RoomData | null>
 */
export const getRoomData = async (roomCode: string): Promise<RoomData | null> => {
  if (!roomCode || roomCode.trim() === '') {
    throw new Error('Room code is required');
  }

  const normalizedRoomCode = roomCode.toUpperCase().trim();

  try {
    const roomRef = doc(db, 'rooms', normalizedRoomCode);
    const roomDoc = await getDoc(roomRef);

    if (!roomDoc.exists()) {
      return null;
    }

    const roomData = roomDoc.data() as RoomData;
    
    // Convert Firestore timestamps to Date objects
    return {
      ...roomData,
      createdAt: roomData.createdAt instanceof Date ? roomData.createdAt : (roomData.createdAt as any)?.toDate?.() || new Date(),
      updatedAt: roomData.updatedAt instanceof Date ? roomData.updatedAt : (roomData.updatedAt as any)?.toDate?.() || new Date()
    };
  } catch (error) {
    console.error('Error getting room data:', error);
    throw new Error('Failed to get room data');
  }
};

/**
 * Checks if the current user is the host of a room
 * @param roomCode - The room code to check
 * @returns Promise<boolean>
 */
export const isRoomHost = async (roomCode: string): Promise<boolean> => {
  try {
    // Ensure user is authenticated and get their UID
    const playerId = await ensureAuthenticated();
    const roomData = await getRoomData(roomCode);
    return roomData?.hostId === playerId;
  } catch (error) {
    console.error('Error checking if player is host:', error);
    return false;
  }
};

/**
 * Gets all rooms for debugging purposes (limit to recent rooms)
 * @returns Promise<RoomData[]>
 */
export const getAllRooms = async (): Promise<RoomData[]> => {
  try {
    const roomsRef = collection(db, 'rooms');
    const snapshot = await getDocs(roomsRef);
    
    return snapshot.docs.map(doc => {
      const data = doc.data() as RoomData;
      return {
        ...data,
        createdAt: data.createdAt instanceof Date ? data.createdAt : (data.createdAt as any)?.toDate?.() || new Date(),
        updatedAt: data.updatedAt instanceof Date ? data.updatedAt : (data.updatedAt as any)?.toDate?.() || new Date()
      };
    });
  } catch (error) {
    console.error('Error getting all rooms:', error);
    throw new Error('Failed to get rooms');
  }
};


