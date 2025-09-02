# Updated Multiplayer Flow

## New Navigation Flow

### 1. Main Menu → Role Selection
```
MainMenu
  ↓ "Multiplayer" button
MultiplayerRoom (role_select mode)
  ↓ Choose: "Host Game" OR "Join Game"
```

### 2A. Host Path (Category Selection First)
```
MultiplayerRoom (role_select)
  ↓ "Host Game" button
Categories (gameMode: 'multiplayer')  
  ↓ Select category (e.g., "Sports")
MultiplayerRoom (category_select mode, with categoryName="Sports")
  ↓ "Create Room" button
MultiplayerRoom (waiting mode, with room code & players)
  ↓ Host presses "Start Game"
GameScreen (isMultiplayer: true)
```

### 2B. Join Path (No Category Selection)
```
MultiplayerRoom (role_select)
  ↓ "Join Game" button  
MultiplayerRoom (joining mode)
  ↓ Enter room code → "Join Room" button
MultiplayerRoom (waiting mode, with room code & players)
  ↓ Host starts game (automatic)
GameScreen (isMultiplayer: true)
```

## Key Changes

### ✅ **Fixed Flow Logic:**
- **Host MUST pick category first** (Categories screen → Create Room)
- **Join players NEVER pick category** (Enter code → Join existing room)
- **Category comes from the room** for joining players

### ✅ **Updated Modes:**
- `role_select`: Choose Host vs Join
- `category_select`: Host confirms category and creates room  
- `joining`: Player enters room code
- `waiting`: Room lobby with players
- `creating`: Loading state for room creation

### ✅ **Smart Navigation:**
- **Main Menu** → Role selection (not categories)
- **"Host Game"** → Categories → Room creation  
- **"Join Game"** → Room code input → Join room
- **Back button** behaves correctly for each mode

### ✅ **UI Headers:**
- `role_select`: "Multiplayer" - "Choose your role"
- `category_select`: "Create Room" - "{categoryName}"  
- `joining`: "Join Room" - "Enter room code"
- `waiting`: "Room" - "{categoryName}"

## User Experience

### 👑 **Host Experience:**
1. Press "Multiplayer" 
2. Press "Host Game"
3. Choose category (e.g., "Sports")
4. Press "Create Room"  
5. Share room code with friends
6. Wait for players to join
7. Press "Start Game"

### 🎮 **Player Experience:**
1. Press "Multiplayer"
2. Press "Join Game" 
3. Enter room code from host
4. Press "Join Room"
5. See category chosen by host
6. Wait for host to start game
7. Game begins automatically

This matches your requirement: **Host picks category, Join players just enter code!** 🎉
