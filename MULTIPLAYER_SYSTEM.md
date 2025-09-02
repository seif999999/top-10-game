# Unified Multiplayer System

## Overview

A clean, production-ready multiplayer system that works entirely with Firebase Firestore. No additional servers required.

## User Flow

### 1. Main Menu → Categories
- User presses "Multiplayer" on main menu
- Navigates directly to Categories screen with `gameMode: 'multiplayer'`

### 2. Category Selection
- User selects a category (e.g., "Sports", "Music", etc.)
- Navigates to unified MultiplayerRoom screen with category information

### 3. Unified Room Screen
The single screen handles both host and player flows:

#### Host Flow (Create Room):
1. User presses "Create Room (Host)"
2. `createRoom(hostId, category)` is called
3. Generates unique 6-character room code
4. Creates Firestore document in "rooms" collection
5. Host is automatically added to `players[]` array
6. Host sees room screen with room code and player list
7. Host shares room code with friends
8. Host can start game when ≥2 players

#### Player Flow (Join Room):
1. User presses "Join Room (Player)"
2. User enters 6-character room code
3. `joinRoom(roomCode, playerId)` is called
4. Player is added to room's `players[]` array
5. Player sees same room screen with category and player list
6. Player waits for host to start game

### 4. Game Start
- Host presses "Start Game" button
- `updateRoomGameState(roomCode, 'playing')` is called
- All players receive real-time update via Firestore listener
- All players automatically navigate to GameScreen

## Firebase Firestore Structure

### Collection: `rooms`

```typescript
interface RoomData {
  roomCode: string;           // 6-character alphanumeric code
  hostId: string;            // Email of room creator
  players: string[];         // Array of player emails (includes host)
  gameState: 'waiting' | 'starting' | 'playing' | 'finished';
  createdAt: Date;
  updatedAt: Date;
  maxPlayers: number;        // Default: 4
  category: string;          // Game category chosen by host
}
```

### Example Document:
```json
{
  "roomCode": "ABC123",
  "hostId": "host@example.com",
  "players": ["host@example.com", "player1@example.com", "player2@example.com"],
  "gameState": "waiting",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:32:00Z", 
  "maxPlayers": 4,
  "category": "Sports"
}
```

## Core Functions

### `createRoom(hostId: string, category: string, maxPlayers?: number): Promise<string>`
- Generates unique room code with collision avoidance
- Creates Firestore document
- Automatically adds host to players array
- Returns room code

### `joinRoom(roomCode: string, playerId: string): Promise<void>`
- Validates room exists and is joinable
- Adds player to players array using `arrayUnion`
- Throws error if room full, game started, or room not found

### `subscribeToRoom(roomCode: string, callback: (roomData) => void): Unsubscribe`
- Sets up real-time Firestore listener
- Calls callback whenever room data changes
- Returns unsubscribe function for cleanup

### `updateRoomGameState(roomCode: string, gameState: GameState): Promise<void>`
- Updates room's game state
- Used by host to start game (`'playing'`)

## Key Features

### ✅ Real-time Synchronization
- All room data synced via Firestore listeners
- Players see live updates when others join/leave
- Game start is synchronized across all players

### ✅ Host as Player
- Host is both room creator AND participant
- Host appears in player list
- Host participates in game alongside other players
- Host retains control privileges (start game)

### ✅ Category Management
- Host selects category before creating room
- Category is stored in room document
- All players see the selected category
- Category is passed to game screen

### ✅ Error Handling
- Network error resilience
- Room code collision avoidance
- Validation for room capacity, game state
- Clear error messages for users

### ✅ Clean Navigation
- Single unified room screen
- Automatic navigation on game start
- Proper cleanup of Firestore listeners

## Navigation Structure

```
MainMenu
  ↓ (Multiplayer button)
Categories (gameMode: 'multiplayer')
  ↓ (Category selection)
MultiplayerRoom (categoryName, categoryId)
  ↓ (Host: Create Room OR Player: Join Room)
MultiplayerRoom (waiting mode with real-time updates)
  ↓ (Host starts game)
GameScreen (isMultiplayer: true)
```

## Security Notes

- Uses Firebase Authentication for user identification
- Firestore security rules should restrict room modifications to authenticated users
- Room codes are publicly readable but modification requires authentication
- No sensitive data stored in room documents

## Production Readiness

- ✅ No test/debug code in production
- ✅ Proper error handling and logging
- ✅ Clean, maintainable code structure
- ✅ TypeScript type safety
- ✅ Real-time synchronization
- ✅ Scalable Firestore architecture
- ✅ Mobile-optimized UI/UX

## Testing the System

1. **Create Room Flow:**
   - Main Menu → Multiplayer → Select Category → Create Room
   - Verify room code is generated and displayed
   - Verify host appears in player list

2. **Join Room Flow:**
   - Use different device/account
   - Main Menu → Multiplayer → Select Any Category → Join Room
   - Enter the room code from step 1
   - Verify player appears in host's room in real-time

3. **Game Start Flow:**
   - Host presses "Start Game"
   - Verify both players navigate to GameScreen
   - Verify category is correctly passed

All flows work entirely with Firebase Firestore - no additional infrastructure required.
