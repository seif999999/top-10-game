# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Overview

Top10Game is a React Native multiplayer trivia game built with Expo, TypeScript, and Firebase. Players compete to guess the top 10 answers in various categories. The project features both single-player and real-time multiplayer modes with Socket.io for real-time communication.

## Development Commands

### Essential Commands
```bash
# Start the development server
npm start

# Run on specific platforms
npm run android
npm run ios
npm run web

# TypeScript type checking
npm run typecheck

# Start multiplayer mode (server + client)
npm run multiplayer
```

### Server Commands (for multiplayer)
```bash
# Start multiplayer server only
cd server && npm start

# Development mode with auto-reload
cd server && npm run dev
```

### Environment Setup
```bash
# Install dependencies
npm install

# Install server dependencies
cd server && npm install

# Set up Firebase config in app.config.js (extra.firebase section)
# Firebase config is already embedded in app.config.js
```

## Architecture Overview

### Core Architecture Patterns

**Context-Based State Management**: The app uses React Context API for global state management with three main contexts:
- `AuthContext`: Firebase authentication state
- `GameContext`: Single-player game logic and state  
- `MultiplayerContext`: Real-time multiplayer game state

**Screen-Based Navigation**: Uses React Navigation with conditional routing based on auth state:
- **AuthStack**: Login, Register, ForgotPassword (unauthenticated users)
- **MainStack**: Home, Categories, GameLobby, GameScreen, Profile (authenticated users)

**Service Layer Pattern**: Business logic is separated into service modules:
- `services/auth.ts`: Firebase authentication operations
- `services/gameLogic.ts`: Core game mechanics and scoring
- `services/multiplayerService.ts`: Socket.io multiplayer communication
- `services/questionsService.ts`: Question management and loading
- `services/statsService.ts`: Player statistics and persistence

**Component Composition**: Reusable UI components with consistent styling:
- `components/Button.tsx`: Primary action button with loading states
- `components/Input.tsx`: Form input with validation styling
- `components/CategoryCard.tsx`: Game category selection
- `components/ResultsModal.tsx`: Game results display

### Key Architectural Decisions

**Firebase Integration**: Authentication and potential Firestore integration configured through `app.config.js` extra section, not environment variables.

**Dual Game Modes**: The same `GameScreen` component handles both single-player and multiplayer modes through conditional logic and different context providers.

**Real-time Architecture**: Multiplayer uses Socket.io with a Node.js/Express server in the `/server` directory. Game state synchronization happens through WebSocket events.

**Error Boundaries**: Top-level error boundary in `App.tsx` catches and displays runtime errors gracefully.

**TypeScript Integration**: Strict TypeScript configuration with comprehensive type definitions in `src/types/`.

### Data Flow

**Authentication Flow**:
1. `AuthContext` wraps the app and manages Firebase auth state
2. `AppNavigator` conditionally renders AuthStack or MainStack based on user state
3. Authentication state changes trigger automatic navigation

**Game Flow** (Single Player):
1. `GameContext` manages game state with useReducer
2. `gameLogic.ts` service handles scoring, answer validation, and progression
3. Local storage persists statistics and progress

**Multiplayer Flow**:
1. `MultiplayerContext` manages real-time game state
2. `multiplayerService.ts` handles Socket.io communication
3. Server (`server/server.js`) manages game rooms and real-time events
4. Game state synchronizes across all connected players

## Important Configuration Files

### `app.config.js`
Contains Expo configuration and Firebase credentials. The Firebase config is embedded directly in the `extra.firebase` section, not loaded from environment variables.

### `package.json` Scripts
- `start`: Standard Expo development server
- `multiplayer`: Runs custom `start-multiplayer.js` script that starts both server and client
- `typecheck`: TypeScript type checking without compilation

### `server/package.json`
Separate Node.js server for multiplayer functionality with Socket.io, Express, and CORS dependencies.

## Development Patterns

### Testing Multiplayer Locally
Use `npm run multiplayer` which runs `start-multiplayer.js` - this starts the server (port 3001) and then the Expo dev server, allowing you to test real-time multiplayer locally.

### Firebase Configuration
Firebase is configured through `app.config.js` rather than `.env` files. The configuration is read from `Constants.expoConfig.extra.firebase` in the app.

### Game Logic Integration
Both single-player and multiplayer modes share the core game logic from `services/gameLogic.ts`. Multiplayer extends this with real-time synchronization through Socket.io.

### State Management Patterns
- Use `useGame()` hook for single-player game state
- Use `useMultiplayer()` hook for multiplayer game state  
- Use `useAuth()` hook for authentication state
- Component state for UI-only state (forms, loading indicators)

### Adding New Questions
Questions are managed in `src/data/sampleQuestions.ts` for single-player and `server/server.js` for multiplayer. Both should be updated when adding new content.

### Error Handling
- Network errors are handled at the service level
- UI errors use error states in contexts
- Runtime errors are caught by error boundary
- Firebase auth errors have specific error handling in AuthContext

## Common Development Tasks

### Running Single Player Mode
Standard Expo development - `npm start` then choose platform. Firebase auth is required for all game features.

### Running Multiplayer Mode
1. `npm run multiplayer` (starts both server and client)
2. Or manually: `cd server && npm start` then `npm start` in root
3. Multiple devices can connect to the same localhost server for testing

### Adding New Game Categories
1. Add category to `src/data/sampleQuestions.ts` (single-player)
2. Add category to `server/server.js` sampleQuestions object (multiplayer)
3. Update category selection UI in `CategoriesScreen`

### Debugging Game Logic
Game logic includes extensive console logging. Check browser/device console for detailed score calculations and game state changes.

### Firebase Setup
If Firebase config needs updating, modify the `extra.firebase` section in `app.config.js`. No `.env` file needed.

## Project Structure Notes

```
src/
├── components/          # Reusable UI components
├── contexts/           # React contexts for global state
├── data/              # Static game data (questions, etc.)
├── navigation/        # React Navigation configuration
├── screens/          # Full-screen components
│   └── AuthScreens/  # Authentication-related screens
├── services/         # Business logic and external API calls
├── types/           # TypeScript type definitions
└── utils/           # Helper functions and constants

server/              # Node.js multiplayer server
├── server.js        # Express + Socket.io server
└── package.json     # Server dependencies
```

The architecture separates concerns clearly between UI (components/screens), state management (contexts), business logic (services), and data (types, utils, data).
