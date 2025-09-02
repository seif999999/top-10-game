# Multiplayer Room System

This document describes the complete multiplayer room system implementation for the React Native trivia app.

## Overview

The room system allows players to create and join multiplayer game rooms using 6-character alphanumeric room codes. All data is stored in Firestore and updates in real-time.

## Files Created

### 1. `src/services/roomService.ts`
Main service file containing all room-related functions:

- `createRoom(hostId: string, maxPlayers?: number): Promise<string>`
- `joinRoom(roomCode: string, playerId: string): Promise<void>`
- `leaveRoom(roomCode: string, playerId: string): Promise<void>`
- `subscribeToRoom(roomCode: string, callback: (roomData) => void): Unsubscribe`
- `updateRoomGameState(roomCode: string, gameState: string, category?: string): Promise<void>`
- `getRoomData(roomCode: string): Promise<RoomData | null>`
- `isRoomHost(roomCode: string, playerId: string): Promise<boolean>`

### 2. `src/screens/RoomTestScreen.tsx`
Complete test screen with UI for testing all room functionality:

- Create room buttons
- Join room input and button
- Real-time player list display
- Host controls for game state changes
- Leave room functionality

### 3. `src/utils/roomServiceTests.ts`
Programmatic tests for validating room service functionality:

- `testBasicRoomWorkflow()` - Tests complete create/join/update flow
- `testErrorScenarios()` - Tests error handling
- `testRoomCapacity()` - Tests room capacity limits
- `runAllTests()` - Runs comprehensive test suite

## Room Data Structure

```typescript
interface RoomData {
  roomCode: string;           // 6-character alphanumeric code
  hostId: string;            // ID of the room creator
  players: string[];         // Array of player IDs
  gameState: 'waiting' | 'starting' | 'in-progress' | 'finished';
  createdAt: Date;           // Room creation timestamp
  updatedAt: Date;           // Last update timestamp
  maxPlayers?: number;       // Maximum players (default: 4)
  category: string;          // Game category (REQUIRED for multiplayer)
}
```

## Firestore Collection Structure

```
/rooms/{roomCode}
{
  roomCode: "ABC123",
  hostId: "user_123",
  players: ["user_123", "user_456", "user_789"],
  gameState: "waiting",
  createdAt: Timestamp,
  updatedAt: Timestamp,
  maxPlayers: 4,
  category: "Movies"  // Required - all players use this category
}
```

## Multiplayer Flow Integration

### 🎯 **NEW: Complete Category Integration**

The multiplayer system now seamlessly integrates with the existing category system:

1. **Category Selection**: User chooses from existing categories (Sports, Movies, Music, etc.)
2. **Room Management**: Category is stored in room document and synced across all players
3. **Real-time Sync**: All players see the chosen category instantly via Firestore listeners
4. **Game Flow**: Room category automatically passed to game screen

### 📱 **Navigation Flow**

**Updated Multiplayer Flow:**

**Host Flow (Category Selection):**
```
Main Menu → Multiplayer → Multiplayer Mode Select → Create Room (Host)
↓
Categories Screen → Select Category (e.g., "Movies")
↓
MultiplayerRoom Screen → Room created with category
↓
Room Screen → Shows category, players, host controls, real-time updates
↓
Start Game → Game Screen (category: Movies)
```

**Player Flow (Join Room):**
```
Main Menu → Multiplayer → Multiplayer Mode Select → Join Room (Player)
↓
JoinRoom Screen → Enter room code
↓
MultiplayerRoom Screen → Shows HOST'S chosen category
↓
Room Screen → Wait for host to start, see real-time updates
↓
Host starts → Game Screen (same category as host)
```

**Single Player Flow (unchanged):**
```
Main Menu → Single Player
↓
Categories Screen → Select Category
↓
Question Selection → Choose specific question
↓
Game Screen → Plays selected question
```

## Key Features

### Room Code Generation
- Generates unique 6-character alphanumeric codes (A-Z, 0-9)
- Includes collision detection and retry logic
- Maximum 10 attempts to generate unique code

### Real-time Updates
- Uses Firestore's `onSnapshot` for real-time room data updates
- Automatic conversion of Firestore timestamps to Date objects
- Subscription cleanup handling

### Error Handling
- Comprehensive error messages for common scenarios
- Validation for room existence, capacity, and game state
- Graceful handling of network issues

### Security Features
- Room codes are case-insensitive and normalized to uppercase
- Player ID validation
- Host-only operations protected

## Testing the System

### Method 1: Using the Test Screen (Recommended)
1. Launch the app and log in
2. Navigate to Main Menu
3. Tap on "Room Test" button
4. Use the UI to:
   - Create a room and note the code
   - Join rooms using codes
   - Test real-time updates by having multiple devices/simulators

### Method 2: Programmatic Testing
```typescript
import { runAllTests } from '../utils/roomServiceTests';

// Run in a React component or debug console
runAllTests().then(() => {
  console.log('All tests passed!');
}).catch(error => {
  console.error('Tests failed:', error);
});
```

### Method 3: Manual Testing
```typescript
import { createRoom, joinRoom, subscribeToRoom } from '../services/roomService';

// Create a room
const roomCode = await createRoom('user123');
console.log('Room code:', roomCode);

// Subscribe to updates
const unsubscribe = subscribeToRoom(roomCode, (roomData) => {
  console.log('Room updated:', roomData);
});

// Join from another device/simulator
await joinRoom(roomCode, 'user456');

// Cleanup
unsubscribe();
```

## Integration with Existing Game Logic

The room system is designed to integrate seamlessly with the existing game logic:

1. **Room Creation**: Host creates room, selects category, and is automatically added to players array AS A PLAYER
2. **Host is Player**: The host is both the room controller AND a game participant in the players list  
3. **Automatic Navigation**: Both host and joining players are automatically navigated to same room screen
4. **Unified Room Screen**: Shows live player list (including host), category, real-time updates for ALL participants
5. **Player Joining**: Players join using room codes and see same room screen as host
6. **Game Start**: Host initiates game, room state changes to 'playing', ALL players (including host) navigate to GameScreen
7. **Multiplayer Game**: Host participates in game alongside other players - can answer questions normally
8. **Game End**: Update room state to 'finished'

## Usage Examples

### Creating a Room
```typescript
const hostId = 'user_123';
const category = 'Movies';  // Required category
const maxPlayers = 4;

try {
  const roomCode = await createRoom(hostId, category, maxPlayers);
  console.log(`Room created: ${roomCode} (Category: ${category})`);
} catch (error) {
  console.error('Failed to create room:', error.message);
}
```

### Joining a Room
```typescript
const roomCode = 'ABC123';
const playerId = 'user_456';

try {
  await joinRoom(roomCode, playerId);
  console.log('Successfully joined room');
} catch (error) {
  console.error('Failed to join room:', error.message);
}
```

### Real-time Room Updates
```typescript
const unsubscribe = subscribeToRoom('ABC123', (roomData) => {
  if (roomData) {
    console.log(`Players: ${roomData.players.length}`);
    console.log(`Game State: ${roomData.gameState}`);
    console.log(`Host: ${roomData.hostId}`);
    console.log(`Players list: [${roomData.players.join(', ')}]`); // Includes host!
    
    // Update UI based on room data
    setPlayers(roomData.players);
    setGameState(roomData.gameState);
    
    // Host is both in players array AND has host privileges
    const isCurrentUserHost = roomData.hostId === currentUserId;
    const isCurrentUserPlayer = roomData.players.includes(currentUserId);
    // Both will be true for the host!
  }
});

// Remember to cleanup
useEffect(() => {
  return () => unsubscribe();
}, []);
```

## Error Scenarios Handled

1. **Room Not Found**: Clear error message when joining non-existent room
2. **Room Full**: Prevents joining when room is at capacity
3. **Game Already Started**: Prevents joining rooms in progress
4. **Invalid Input**: Validates room codes and player IDs
5. **Network Issues**: Graceful failure handling
6. **Duplicate Joins**: Handles players already in room

## Performance Considerations

- Room codes use efficient document lookup by ID
- Real-time subscriptions only listen to specific room documents
- Automatic cleanup of subscriptions prevents memory leaks
- Error boundaries prevent crashes from network issues

## Security Considerations

- All operations validated server-side by Firestore rules
- Player IDs should come from authenticated users
- Room codes are generated cryptographically random
- No sensitive data stored in room documents

## Next Steps

1. **Game Integration**: Connect room system to actual game flow
2. **Enhanced Security**: Add Firestore security rules
3. **Player Management**: Add kick/ban functionality for hosts
4. **Room Cleanup**: Implement automatic cleanup of old rooms
5. **Advanced Features**: Add spectator mode, room passwords, etc.

## Troubleshooting

### Common Issues

1. **"Failed to generate code after multiple attempts" Error**:
   - **Cause**: High collision rate due to many existing rooms or network issues
   - **Solution**: Use the debug tools to clean up old rooms and check system health
   - **Prevention**: The system now includes automatic retry logic and fallback generation

2. **Room Creation Fails**: 
   - Check Firebase connection and authentication
   - Use the "System Health Check" button in the test screen
   - Verify your internet connection

3. **Real-time Updates Not Working**: 
   - Verify Firestore permissions and security rules
   - Check network connectivity
   - Ensure proper subscription cleanup

4. **Players Can't Join**: 
   - Check room code validity (6 characters, alphanumeric)
   - Verify room is still in 'waiting' state
   - Check room capacity (default: 4 players)

5. **Memory Leaks**: 
   - Ensure subscription cleanup in useEffect
   - Use the unsubscribe function returned by subscribeToRoom

### Fixed Issues in Latest Version

✅ **Room Code Generation Improvements**:
- Added retry logic with exponential backoff
- Fallback generation using timestamps for uniqueness
- Better error messages and debugging
- Crypto-random number generation when available

✅ **Error Handling Enhancements**:
- Network error detection and specific error messages
- Authentication error detection
- Service availability checks
- Automatic delay between retries for transient issues

✅ **Debug Tools**:
- System health check functionality
- Room state analysis and debugging
- Old room cleanup utilities
- Room code generation performance testing

### Debug Commands

```typescript
// NEW: Use improved room creation with retry (REQUIRES CATEGORY)
import { createRoomWithRetry } from '../services/roomService';
const roomCode = await createRoomWithRetry('user123', 'Movies', 4, 3);

// NEW: Run system health check
import { runRoomSystemHealthCheck } from '../utils/roomDebugUtils';
await runRoomSystemHealthCheck();

// NEW: Clean up old rooms to reduce collisions
import { cleanupOldRooms } from '../utils/roomDebugUtils';
const deletedCount = await cleanupOldRooms(120); // Remove rooms older than 2 hours

// Check room data directly (now includes category)
const roomData = await getRoomData('ABC123');
console.log(roomData); // Shows category field

// Run full test suite
await runAllTests();

// Debug room state
import { debugRoomsState } from '../utils/roomDebugUtils';
await debugRoomsState();
```

### Using the Debug Tools in Test Screen

The RoomTestScreen now includes debug tools at the bottom:

1. **System Health Check**: Tests Firebase connectivity, analyzes room state, and checks code generation performance
2. **Debug Rooms State**: Shows current rooms, their ages, and states
3. **Cleanup Old Rooms**: Removes rooms older than 1 hour to reduce collision probability

These tools help diagnose and fix the "failed to generate code" error automatically.
