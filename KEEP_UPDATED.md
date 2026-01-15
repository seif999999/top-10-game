# Top 10 Game - Complete Project Documentation

**Last Updated:** 2024  
**Version:** 0.1.0  
**Status:** Active Development

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture & System Design](#architecture--system-design)
4. [Backend Services (Firebase)](#backend-services-firebase)
5. [Frontend Framework & Structure](#frontend-framework--structure)
6. [Services Layer](#services-layer)
7. [Features & Functionality](#features--functionality)
8. [Data Models & Types](#data-models--types)
9. [Security Implementation](#security-implementation)
10. [Testing Infrastructure](#testing-infrastructure)
11. [Configuration & Environment](#configuration--environment)
12. [File Structure & Organization](#file-structure--organization)
13. [Key Components](#key-components)
14. [Development Workflow](#development-workflow)
15. [Deployment & Production](#deployment--production)
16. [Known Issues & Technical Debt](#known-issues--technical-debt)

---

## Project Overview

### What is Top 10 Game?

Top 10 Game is a cross-platform trivia game application where players compete to guess the top 10 answers in various categories. The game supports both single-player and real-time multiplayer modes with synchronized gameplay, turn-based mechanics, and unified scoring systems.

### Core Game Mechanics

- **Single-Player Mode**: Players answer questions solo, trying to find all 10 correct answers
- **Multiplayer Mode**: Real-time rooms with turn-based gameplay, where players take turns submitting answers
- **Scoring System**: Rank-based scoring (Rank 1 = 1 point, Rank 10 = 10 points)
- **Answer Validation**: Fuzzy matching with alias/nickname support for flexible answer recognition
- **Categories**: Multiple question categories (Sports, Entertainment, History, etc.) plus custom questions

### Key Features

- ✅ Firebase Authentication (Email/Password + Google Sign-In)
- ✅ Real-time multiplayer with Firestore listeners
- ✅ Turn-based gameplay with synchronized timers
- ✅ Avatar selection and profile management
- ✅ Custom question creation
- ✅ Content moderation and security monitoring
- ✅ Rate limiting and abuse prevention
- ✅ Cross-platform support (iOS, Android, Web)

---

## Technology Stack

### Frontend Framework

- **React Native**: `^0.81.4` - Core mobile framework
- **Expo**: `~54.0.0` - Development platform and tooling
- **React**: `^19.1.0` - UI library
- **TypeScript**: `~5.9.2` - Type-safe JavaScript
- **React Navigation**: `^6.1.17` - Navigation library
- **React Native Web**: `^0.21.0` - Web platform support

### Backend Services

- **Firebase Auth**: User authentication and session management
- **Cloud Firestore**: Real-time database for game state and user data
- **Firebase Storage**: File storage (currently minimal usage)
- **Firebase Analytics**: Web-only analytics (conditional import)

### State Management

- **React Context API**: 
  - `AuthContext` - Authentication state
  - `GameContext` - Single-player game state
  - `MultiplayerContext` - Multiplayer game state

### Storage

- **AsyncStorage**: `@react-native-async-storage/async-storage` - Local storage for mobile
- **localStorage**: Web platform storage
- **Firestore**: Cloud database for persistent data

### Utilities & Libraries

- **fastest-levenshtein**: `^1.0.16` - String similarity for fuzzy matching
- **isomorphic-dompurify**: `^2.26.0` - XSS protection and HTML sanitization
- **@react-native-google-signin/google-signin**: `^8.2.2` - Google OAuth integration
- **expo-auth-session**: `~7.0.8` - OAuth session management
- **expo-crypto**: `~15.0.7` - Cryptographic utilities

### Development Tools

- **Jest**: `~29.7.0` - Testing framework
- **ts-jest**: `^26.1.1` - TypeScript support for Jest
- **@testing-library/react-native**: `^13.3.3` - React Native testing utilities
- **@firebase/rules-unit-testing**: `^5.0.0` - Firestore security rules testing

---

## Architecture & System Design

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        UI Layer                              │
│  (Screens, Components)                                      │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                    Context Layer                             │
│  (AuthContext, GameContext, MultiplayerContext)              │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                    Services Layer                            │
│  (Auth, Multiplayer, Scoring, Questions, etc.)               │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                    Firebase SDK                              │
│  (Auth, Firestore, Storage)                                 │
└─────────────────────────────────────────────────────────────┘
```

### Design Patterns

1. **Service Layer Pattern**: Business logic encapsulated in service classes
2. **Singleton Pattern**: Services like `AuthService`, `UserProfileService`, `CustomQuestionService`
3. **Observer Pattern**: Firestore real-time listeners for state synchronization
4. **Transaction Pattern**: Atomic Firestore transactions for multiplayer state updates
5. **Context Pattern**: React Context for global state management
6. **Factory Pattern**: Question normalization and conversion utilities

### Data Flow

1. **User Action** → Screen Component
2. **Screen** → Context Action
3. **Context** → Service Method
4. **Service** → Firebase SDK (Firestore/Auth)
5. **Firebase** → Firestore Listener → Context Update
6. **Context** → Screen Re-render

### State Management Strategy

- **Local Component State**: UI-specific state (input values, loading states)
- **Context State**: Global app state (auth, current game, multiplayer room)
- **Firestore State**: Persistent game state (rooms, scores, answers)
- **Local Storage**: User preferences, avatars, custom questions

---

## Backend Services (Firebase)

### Firebase Configuration

**Project ID**: `top10-game-f9219`  
**Location**: Hardcoded in `src/services/firebase.ts` (⚠️ Should use environment variables)

```typescript
const firebaseConfig = {
  apiKey: 'AIzaSyAu096CybNo1NMFCHVLi1PtPfy4cXgpTgQ',
  authDomain: 'top10-game-f9219.firebaseapp.com',
  projectId: 'top10-game-f9219',
  storageBucket: 'top10-game-f9219.firebasestorage.app',
  messagingSenderId: '807249280703',
  appId: '1:807249280703:web:3706f3bbf0029ef43d500a',
  measurementId: 'G-NCGRYEPFKZ'
}
```

### Firestore Collections

#### 1. `userProfiles/{userId}`
User profile data including display name, avatar, preferences.

**Structure:**
```typescript
{
  id: string;
  email: string;
  displayName?: string;
  selectedAvatar?: string;
  createdAt: Timestamp;
  lastLogin: Timestamp;
  isPublic?: boolean;
}
```

**Security Rules:**
- Read/Write: User can only access their own profile
- Public Read: Other users can read if `isPublic == true`

#### 2. `multiplayerGames/{roomCode}`
Real-time multiplayer game rooms. Each room is a document with complete game state.

**Structure:** See `RoomData` type in `src/types/game.ts`

**Key Fields:**
- `roomCode`: 6-character unique identifier
- `hostId`: User ID of room host
- `status`: 'lobby' | 'playing' | 'finished' | 'closed'
- `gamePhase`: 'lobby' | 'question' | 'answers' | 'results' | 'finished'
- `players`: Map of player objects
- `questions`: Array of Question objects
- `currentQuestionIndex`: Current question number
- `revealedAnswers`: Array of 10 revealed answers (null if not revealed)
- `scores`: Map of player scores
- `turnOrder`: Array of player IDs in turn order
- `currentTurnIndex`: Index in turnOrder array
- `currentPlayerId`: ID of player whose turn it is
- `turnStartTime`: Server timestamp when turn started
- `turnTimeLimit`: Seconds per turn (default 60)

**Security Rules:**
- Read: Any authenticated user
- Create: Must be authenticated, must be host, must be in lobby status
- Update: Must be authenticated and either a player in the room or the host
- Delete: Only the host can delete

#### 3. `securityEvents`
Security event logs for monitoring and auditing.

#### 4. `rateLimits`
Rate limiting data (in-memory in current implementation, could be moved to Firestore)

#### 5. `timeSyncDocs`
Temporary documents for server time synchronization (created and deleted dynamically)

### Firebase Authentication

**Providers:**
- Email/Password
- Google Sign-In (OAuth)

**Features:**
- Session persistence
- Password reset flow
- Profile updates
- Anonymous authentication fallback (for multiplayer)

**Configuration Files:**
- `GOOGLE_OAUTH_SETUP_GUIDE.md` - Google OAuth setup instructions
- `FIREBASE_PASSWORD_RESET_SETUP.md` - Password reset configuration
- `env.example` - Environment variable template

### Firestore Security Rules

Located in `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User profiles - users can only access their own data
    match /userProfiles/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null && resource.data.isPublic == true;
    }
    
    // Multiplayer games
    match /multiplayerGames/{roomCode} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && validateRoomCreation();
      allow update: if request.auth != null && validateRoomUpdate();
      allow delete: if request.auth != null && resource.data.hostId == request.auth.uid;
    }
    
    // Deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## Frontend Framework & Structure

### Expo Configuration

**App Config**: `app.config.js`
- Bundle identifiers: `com.top10game.app`
- Deep linking scheme: `top10game`
- Platform support: iOS, Android, Web
- Security headers configured for web

### Metro Configuration

**File**: `metro.config.js`
- Supports iOS, Android, Native, Web platforms
- Source extensions: `.ts`, `.tsx`, `.js`, `.jsx`, `.cjs`, `.mjs`

### TypeScript Configuration

**File**: `tsconfig.json`
- Extends Expo base config
- Strict mode enabled
- Type checking: `npm run typecheck`

### Navigation Structure

**File**: `src/navigation/AppNavigator.tsx`

**Auth Stack** (unauthenticated):
- Login
- Register
- ForgotPassword
- PasswordResetSuccess
- ResetPassword

**Main Stack** (authenticated):
- Home
- Profile
- Categories
- QuestionSelection
- GameLobby
- GameScreen
- MultiplayerMenu
- CreateRoom
- MultiplayerCategory
- MultiplayerQuestions
- JoinRoom
- RoomLobby
- AvatarSelection
- CreateCustomQuestion

### Screen Components

All screens located in `src/screens/`:

**Auth Screens** (`src/screens/AuthScreens/`):
- `LoginScreen.tsx` - Email/password and Google sign-in
- `RegisterScreen.tsx` - User registration
- `ForgotPasswordScreen.tsx` - Password reset request
- `PasswordResetSuccessScreen.tsx` - Reset confirmation
- `ResetPasswordScreen.tsx` - New password entry

**Game Screens**:
- `HomeScreen.tsx` - Main menu with game mode selection
- `CategoriesCarouselScreen.tsx` - Category selection
- `QuestionSelectionScreen.tsx` - Question selection for single-player
- `GameLobbyScreen.tsx` - Pre-game setup
- `GameScreen.tsx` - Main game screen (1,779 lines - largest file)

**Multiplayer Screens**:
- `MultiplayerMenuScreen.tsx` - Multiplayer options
- `CreateRoomScreen.tsx` - Create new multiplayer room
- `MultiplayerCategoryScreen.tsx` - Category selection for multiplayer
- `MultiplayerQuestionsScreen.tsx` - Question selection for multiplayer
- `JoinRoomScreen.tsx` - Join existing room by code
- `RoomLobbyScreen.tsx` - Room lobby with player list
- `MultiplayerLeaderboardScreen.tsx` - Leaderboard display

**Other Screens**:
- `ProfileScreen.tsx` - User profile and settings
- `AvatarSelectionScreen.tsx` - Avatar selection
- `CustomQuestionScreen.tsx` - Create custom questions

---

## Services Layer

### Authentication Services

#### `src/services/auth.ts`
Main authentication service with Firebase Auth integration.

**Key Functions:**
- `signUpWithEmail()` - User registration
- `signInWithEmail()` - Email/password login
- `signInWithGoogle()` - Google OAuth login
- `signOutUser()` - Sign out and clear storage
- `resetPassword()` - Send password reset email
- `getCurrentUser()` - Get current authenticated user
- `updateUserProfile()` - Update display name and avatar
- `subscribeToAuthChanges()` - Listen to auth state changes
- `verifyAuthPersistence()` - Verify auth session persistence

**Security Features:**
- Rate limiting (5 attempts per 15 minutes)
- Session timeout (24 hours)
- Password minimum length (8 characters)
- In-memory rate limiting (⚠️ Should be moved to Firestore)

#### `src/services/authService.ts`
Singleton service for authentication state management.

**Methods:**
- `getInstance()` - Get singleton instance
- `ensureAuthenticated()` - Ensure user is authenticated (creates anonymous if needed)
- `getCurrentUserId()` - Get current user ID
- `syncWithUser()` - Sync with AuthContext user state

#### `src/services/googleAuth.ts`
Google OAuth integration.

**Functions:**
- `signInWithGoogle()` - Initiate Google sign-in flow
- `getGoogleUserInfo()` - Get user info from access token
- `validateGoogleIdToken()` - Validate Google ID token

### Multiplayer Services

#### `src/services/multiplayerService.ts` (1,700+ lines)
Main multiplayer service managing rooms, players, and game state.

**Key Methods:**
- `createRoom()` - Create new multiplayer room
- `joinRoom()` - Join existing room by code
- `leaveRoom()` - Leave current room
- `subscribeToRoom()` - Real-time room updates via Firestore listener
- `updatePlayerPresence()` - Update player connection status
- `startGame()` - Host starts the game
- `submitAnswer()` - Submit answer during turn
- `skipTurn()` - Skip current turn
- `endGame()` - Host ends the game

**Features:**
- Room code generation (6 characters, alphanumeric)
- Duplicate room code handling
- Player presence tracking
- Host migration on disconnect
- Edge case handling

#### `src/services/multiplayerTransaction.ts`
Atomic transaction helpers for multiplayer operations.

**Functions:**
- `awardAnswer()` - Atomically award answer to player
- `startRound()` - Start new question round
- `endRound()` - End current round
- `updatePlayerPresence()` - Update player connection status
- `hostStartGame()` - Host starts game (atomic)
- `advanceTurn()` - Advance to next player's turn
- `submitTurnAnswer()` - Submit answer during turn (atomic)
- `forceAdvanceExpiredTurn()` - Force advance expired turn

**Purpose:** Prevents race conditions and ensures data consistency in concurrent multiplayer scenarios.

#### `src/services/multiplayerGameFlowV2.ts` (1,100+ lines)
Turn-based game flow implementation following specification.

**Key Functions:**
- `hostStartGame()` - Host starts game, initializes turn system
- `submitAnswer()` - Submit answer during player's turn
- `submitAnswerRoundBased()` - Round-based answer submission
- `advanceTurnOnTimeout()` - Automatically advance turn when time expires
- `hostEndGame()` - Host ends game gracefully
- `skipTurn()` - Skip current player's turn
- `migrateHost()` - Transfer host to another player
- `terminateRoom()` - Terminate room and clean up
- `handleHostDisconnection()` - Handle host disconnect gracefully
- `getServerOffset()` - Get server time offset for synchronization
- `calculateTimeRemaining()` - Calculate remaining time for turn
- `isAllowedToSubmit()` - Check if player can submit answer
- `findMatchingAnswer()` - Find matching answer using fuzzy matching

**Turn System:**
- Each player gets 60 seconds per turn (configurable)
- Only current player can submit during their turn
- Turn automatically advances on timeout
- Host can manually advance/skip turns

#### `src/services/serverGameService.ts`
Server-side validation and game logic.

**Purpose:** Provides server-side validation for game actions to prevent cheating and ensure consistency.

### Game Logic Services

#### `src/services/gameLogic.ts`
Single-player game logic.

**Functions:**
- `startNewGame()` - Initialize new single-player game
- `processAnswer()` - Process player answer and update state
- `nextQuestion()` - Advance to next question
- `generateGameResults()` - Generate final game results
- `isQuestionComplete()` - Check if all 10 answers found
- `checkQuestionComplete()` - Alias for compatibility

#### `src/services/questionsService.ts`
Question management and answer validation.

**Functions:**
- `getQuestionsByCategory()` - Get questions for category
- `getRandomQuestion()` - Get random question
- `getCategories()` - Get all available categories
- `normalizeAnswer()` - Normalize answer text for comparison
- `calculateSimilarity()` - Calculate string similarity
- `validateAnswer()` - Validate answer against correct answers
- `normalizeQuestion()` - Convert legacy question format to unified format
- `questionToGameQuestion()` - Convert Question to GameQuestion
- `questionToLegacyQuestion()` - Convert Question to LegacyQuestion

**Question Sources:**
- `src/data/sampleQuestions.ts` - Static question data
- Custom questions via `CustomQuestionService`

### Scoring Services

#### `src/services/scoring.ts`
Centralized scoring system.

**Functions:**
- `pointsForRank(rank)` - Calculate points for rank (1-10)
- `pointsForAnswerIndex(index)` - Calculate points for answer index
- `calculateTotalPoints()` - Calculate total points for multiple answers
- `rankFromPoints()` - Get rank from point value
- `validateScoring()` - Validate scoring calculation
- `getScoringInfo()` - Get scoring information for display

**Scoring Formula:**
- Rank 1 = 1 point
- Rank 2 = 2 points
- ...
- Rank 10 = 10 points

### Answer Validation Services

#### `src/services/fuzzyMatching.ts` (400+ lines)
Enhanced fuzzy matching for answer validation.

**Features:**
- Levenshtein distance calculation
- Nickname/alias matching
- Case-insensitive matching
- Common typo tolerance
- Similarity scoring (0.0 - 1.0)

**Functions:**
- `normalizeAnswerEnhanced()` - Enhanced text normalization
- `getAnswerVariations()` - Get variations of answer text
- `calculateSimilarity()` - Calculate similarity score
- `isSimilarEnough()` - Check if similarity meets threshold
- `findBestMatch()` - Find best matching answer
- `validateAnswerFuzzy()` - Validate answer with fuzzy matching

**Configuration:**
- Exact match threshold: 1.0
- High confidence: 0.85
- Medium confidence: 0.70
- Low confidence: 0.50
- Min length for fuzzy: 2 characters

#### `src/services/answerValidationService.ts`
Answer validation service wrapper.

**Methods:**
- `validateAnswer()` - Validate answer with sanitization and fuzzy matching
- `containsProfanity()` - Check for profanity (basic implementation)

### Content Moderation Services

#### `src/services/contentModerationService.ts`
Content moderation for user inputs.

**Features:**
- Profanity filtering
- Personal information detection (phone, email, SSN, credit card)
- Spam pattern detection
- External moderation service integration

**Methods:**
- `moderateContent()` - Main moderation function
- `checkProfanity()` - Check for profanity
- `checkPersonalInfo()` - Check for personal information
- `checkSpamPatterns()` - Check for spam patterns

#### `src/services/externalModerationService.ts`
External moderation service integration (mock implementation).

**Purpose:** Placeholder for third-party moderation services (e.g., Google Perspective API, AWS Comprehend).

### Security Services

#### `src/services/securityMonitoringService.ts`
Security event logging and monitoring.

**Features:**
- Security event logging
- Alert generation
- Security statistics
- Event querying and filtering

**Event Types:**
- AUTHENTICATION_FAILURE
- RATE_LIMIT_EXCEEDED
- SUSPICIOUS_ACTIVITY
- CONTENT_MODERATION_FLAG
- INPUT_VALIDATION_FAILURE
- GAME_CHEAT_ATTEMPT
- DATA_BREACH_ATTEMPT
- UNAUTHORIZED_ACCESS
- SYSTEM_ERROR
- SECURITY_POLICY_VIOLATION

#### `src/services/rateLimitService.ts`
Rate limiting service for API actions.

**Rate Limits:**
- Answer submission: 10 per minute
- Room creation: 5 per hour
- Room joining: 20 per 5 minutes
- Skip turn: 5 per 5 minutes
- Chat message: 30 per 5 minutes
- Profile update: 10 per hour
- Password reset: 3 per hour

**Implementation:** Currently in-memory (⚠️ Should be moved to Firestore for production)

### Edge Case Handling

#### `src/services/edgeCaseHandler.ts`
Comprehensive edge case handling.

**Handles:**
- Host disconnection → Host migration
- Player disconnection → Presence tracking
- Firebase outage → Reconnection with exponential backoff
- Duplicate room codes → Regeneration
- Room data corruption → Validation and recovery
- Network timeouts → Retry logic
- Concurrent updates → Transaction handling

### Time Synchronization

#### `src/services/timeSync.ts`
Server time synchronization for accurate timers.

**Functions:**
- `getServerTimeOffset()` - Get server time offset
- `formatTimeRemaining()` - Format time remaining for display

**Purpose:** Ensures synchronized timers across all clients by accounting for client-server time drift.

### User Profile Services

#### `src/services/userProfileService.ts`
User profile management.

**Methods:**
- `getUserProfile()` - Get user profile
- `updateUserProfile()` - Update user profile
- `updateAvatar()` - Update user avatar
- `updateDisplayName()` - Update display name

#### `src/services/localAvatarStorage.ts`
Local avatar storage (AsyncStorage/localStorage).

**Purpose:** Stores selected avatar locally for offline access and faster loading.

#### `src/services/localDisplayNameStorage.ts`
Local display name storage.

**Purpose:** Stores display name locally for offline access.

### Custom Questions

#### `src/services/customQuestionService.ts`
Custom question management.

**Features:**
- Save custom questions locally
- Retrieve all custom questions
- Delete custom questions
- Update question play count

**Storage:** AsyncStorage (mobile) / localStorage (web)

### Data Retention

#### `src/services/dataRetentionService.ts`
Data retention and GDPR compliance.

**Features:**
- Data retention policy management
- User data deletion (Right to be Forgotten)
- Data export functionality
- Data anonymization

**Retention Periods:**
- User profiles: 7 years
- Game data: 2 years
- Analytics data: 1 year
- Support data: 3 years
- Moderation logs: 7 years
- Rate limit logs: 3 months
- Privacy policy acceptances: 7 years

### Privacy Policy

#### `src/services/privacyPolicyService.ts`
Privacy policy acceptance tracking.

**Purpose:** Tracks user acceptance of privacy policy for GDPR compliance.

### Statistics

#### `src/services/statsService.ts`
Game statistics and analytics.

**Purpose:** Tracks user statistics, game history, and performance metrics.

### Firestore Service

#### `src/services/firestore.ts`
Firestore helper functions (if exists).

**Purpose:** Additional Firestore utilities and helpers.

---

## Features & Functionality

### Authentication Features

1. **Email/Password Authentication**
   - User registration with email validation
   - Password reset flow
   - Session persistence
   - Automatic re-authentication

2. **Google Sign-In**
   - OAuth 2.0 integration
   - Cross-platform support (iOS, Android, Web)
   - Token validation
   - Profile synchronization

3. **Profile Management**
   - Display name customization
   - Avatar selection
   - Profile persistence
   - Local caching for offline access

### Single-Player Features

1. **Game Modes**
   - Category selection
   - Question selection
   - Custom questions support

2. **Gameplay**
   - Answer submission
   - Real-time feedback
   - Score tracking
   - Progress indicators

3. **Team Mode** (Offline only, feature flag enabled)
   - Team setup
   - Team-based scoring
   - Round timers
   - Turn-based play

### Multiplayer Features

1. **Room Management**
   - Create room with unique 6-character code
   - Join room by code
   - Room lobby with player list
   - Host controls

2. **Real-Time Gameplay**
   - Turn-based system (60 seconds per turn)
   - Synchronized timers
   - Real-time score updates
   - Answer revelation system

3. **Host Features**
   - Start game
   - End game
   - Skip/advance turns
   - Host migration on disconnect

4. **Player Features**
   - Join/leave rooms
   - Submit answers during turn
   - View leaderboard
   - Presence indicators

5. **Edge Cases Handled**
   - Host disconnection → Automatic host migration
   - Player disconnection → Presence tracking
   - Network issues → Reconnection handling
   - Concurrent updates → Atomic transactions

### Answer Validation Features

1. **Fuzzy Matching**
   - Typo tolerance
   - Case-insensitive matching
   - Alias/nickname support
   - Similarity scoring

2. **Content Moderation**
   - Profanity filtering
   - Personal information detection
   - Spam detection
   - External moderation integration

### Security Features

1. **Rate Limiting**
   - Per-action rate limits
   - Block duration on violation
   - In-memory tracking (⚠️ Should be Firestore-based)

2. **Input Validation**
   - XSS protection (DOMPurify)
   - Input sanitization
   - Length validation
   - Format validation

3. **Security Monitoring**
   - Event logging
   - Alert generation
   - Suspicious activity detection
   - Audit trail

4. **Authentication Security**
   - Session timeout
   - Failed login tracking
   - Password strength requirements
   - Account lockout

### Custom Questions

1. **Creation**
   - Question text input
   - Answer list (up to 10)
   - Local storage
   - Category assignment

2. **Management**
   - View all custom questions
   - Delete questions
   - Play count tracking
   - Last played timestamp

### Avatar System

1. **Selection**
   - Pre-defined avatars
   - Character selection
   - Local persistence
   - Server synchronization

2. **Display**
   - Avatar icons
   - User avatars in multiplayer
   - Profile avatars

---

## Data Models & Types

### Core Types (`src/types/game.ts`)

#### `Question`
```typescript
{
  id: string;
  text: string;
  answers: Answer[];  // Always length up to 10
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
}
```

#### `Answer`
```typescript
{
  id: string;           // Stable ID
  text: string;         // Canonical answer text
  rank: number;         // 1..10 (1 highest)
  aliases?: string[];   // Accepted nicknames
}
```

#### `RoomData`
Complete multiplayer room state. See `src/types/game.ts` for full structure.

**Key Fields:**
- `roomCode`: string
- `hostId`: string
- `status`: 'lobby' | 'playing' | 'finished' | 'closed'
- `gamePhase`: 'lobby' | 'question' | 'answers' | 'results' | 'finished'
- `players`: `{ [playerId: string]: Player }`
- `questions`: `Question[]`
- `currentQuestionIndex`: number
- `revealedAnswers`: `(null | RevealedAnswer)[]` (length 10)
- `scores`: `{ [playerId: string]: number }`
- `turnOrder`: `string[]`
- `currentTurnIndex`: number
- `currentPlayerId`: string
- `turnStartTime`: number (server timestamp)
- `turnTimeLimit`: number (seconds)

#### `Player`
```typescript
{
  id: string;
  name: string;
  score: number;
  isHost: boolean;
  joinedAt: number;
  isConnected: boolean;
  lastSeen: number;
  selectedAvatar?: string;
}
```

#### `RevealedAnswer`
```typescript
{
  answerId: string;
  playerId: string;
  points: number;
}
```

### Navigation Types (`src/types/navigation.ts`)

Defines all screen navigation parameters and props.

### Team Types (`src/types/teams.ts`)

Team mode types (offline only, feature flag enabled).

### User Types (`src/types/index.ts`)

User and authentication types.

---

## Security Implementation

### Authentication Security

1. **Password Requirements**
   - Minimum 8 characters
   - Enforced on registration

2. **Session Management**
   - 24-hour session timeout
   - Automatic session extension on activity
   - Session cleanup on sign out

3. **Rate Limiting**
   - 5 failed login attempts → 15-minute lockout
   - Per-identifier tracking (email/IP)
   - Automatic reset after lockout period

4. **Account Protection**
   - Password reset via email
   - Secure token generation
   - Token expiration

### Input Security

1. **XSS Protection**
   - DOMPurify for HTML sanitization
   - All user inputs sanitized
   - Event handler removal
   - Protocol filtering (javascript:, data:, vbscript:)

2. **Input Validation**
   - Length limits
   - Format validation
   - Type checking
   - Null/undefined handling

3. **Content Moderation**
   - Profanity filtering
   - Personal information detection
   - Spam pattern detection
   - External moderation integration

### Firestore Security

1. **Security Rules**
   - User can only access own profile
   - Room access limited to players/host
   - Validation functions for room creation/updates
   - Deny-all default rule

2. **Data Validation**
   - Server-side validation in transactions
   - Input sanitization before writes
   - Type checking in rules

### Network Security

1. **HTTPS Only**
   - All Firebase connections over HTTPS
   - No cleartext traffic
   - TLS 1.2 minimum

2. **CORS Configuration**
   - Restricted origins
   - Proper headers
   - Security headers in web config

### Security Monitoring

1. **Event Logging**
   - All security events logged
   - Event categorization
   - Severity levels
   - Timestamp tracking

2. **Alerting**
   - Critical event alerts
   - Suspicious activity detection
   - Rate limit violation alerts

### Known Security Issues

1. **Hardcoded Firebase Config** ⚠️
   - Location: `src/services/firebase.ts`
   - Should use environment variables
   - Public API key (acceptable) but should be configurable

2. **In-Memory Rate Limiting** ⚠️
   - Location: `src/services/auth.ts`, `src/services/rateLimitService.ts`
   - Should be Firestore-based for production
   - Lost on server restart

3. **Excessive Console Logging** ⚠️
   - Many services log sensitive information
   - Should be removed or use proper logging service
   - Production builds should minimize logging

---

## Testing Infrastructure

### Test Framework

- **Jest**: `~29.7.0`
- **ts-jest**: `^26.1.1`
- **@testing-library/react-native**: `^13.3.3`
- **@firebase/rules-unit-testing**: `^5.0.0`

### Test Files

Located in `src/__tests__/`:

1. **Unit Tests:**
   - `scoring.test.ts` - Scoring calculations
   - `fuzzyMatching.test.ts` - Fuzzy matching logic
   - `questionsService.test.ts` - Question service
   - `answerValidationService.test.ts` - Answer validation
   - `security.test.ts` - Security features
   - `security-verification.test.ts` - Security verification

2. **Integration Tests:**
   - `integration/multiplayer.test.ts` - Multiplayer flow
   - `multiplayerGameFlowV2.test.ts` - Game flow V2
   - `multiplayerAnswerFlow.test.ts` - Answer submission flow

3. **Edge Case Tests:**
   - `edgeCaseTests.ts` - Edge case handling
   - `answerAwardAndReveal.test.ts` - Answer awarding
   - `answerSubmissionFix.test.ts` - Answer submission fixes

4. **Security Tests:**
   - `firestore-security.test.ts` - Firestore security rules
   - `penetration-testing.test.ts` - Penetration testing
   - `privacyPolicy.test.ts` - Privacy policy compliance

### Test Commands

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

### Test Configuration

**File**: `jest.config.js`

- Preset: `ts-jest`
- Test environment: `node`
- Test match: `**/__tests__/**/*.test.ts`
- Setup file: `src/__tests__/setup.ts`
- Timeout: 10 seconds

---

## Configuration & Environment

### Environment Variables

**File**: `env.example`

**Required:**
- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` - Google OAuth web client ID
- `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` - Google OAuth iOS client ID
- `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` - Google OAuth Android client ID

**Optional:**
- `EXPO_PUBLIC_FIREBASE_API_KEY` - Firebase API key (currently hardcoded)
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` - Firebase auth domain
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID` - Firebase project ID
- `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` - Firebase storage bucket
- `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` - Firebase messaging sender ID
- `EXPO_PUBLIC_FIREBASE_APP_ID` - Firebase app ID

### Feature Flags

**File**: `src/config/featureFlags.ts`

```typescript
export const FEATURES = {
  teamsEnabled: true, // Enable teams feature for testing
}
```

### App Configuration

**File**: `app.config.js`

- App name: `Top10Game`
- Bundle ID: `com.top10game.app`
- Version: `1.0.0`
- Platforms: iOS, Android, Web
- Deep linking scheme: `top10game`

### Design System

**File**: `src/design-system/index.ts`

Comprehensive design system with:
- Colors (primary, secondary, status colors)
- Spacing (4px base unit)
- Typography (font sizes, weights, line heights)
- Component styles (buttons, cards, inputs)
- Animations (durations, easing)
- Accessibility (touch targets, contrast ratios)

**File**: `src/utils/constants.ts`

Additional constants:
- `COLORS` - Color palette
- `SPACING` - Spacing scale
- `TYPOGRAPHY` - Typography system
- `ACCESSIBILITY` - Accessibility constants
- `ANIMATIONS` - Animation constants

---

## File Structure & Organization

```
Top10Game/
├── src/
│   ├── __tests__/              # Test files
│   │   ├── integration/       # Integration tests
│   │   └── *.test.ts          # Unit tests
│   ├── assets/                 # Static assets
│   │   └── avatars/           # Avatar assets
│   ├── components/             # Reusable UI components
│   │   ├── shared/            # Shared components
│   │   └── *.tsx              # Component files
│   ├── config/                 # Configuration files
│   │   ├── featureFlags.ts    # Feature flags
│   │   ├── features.ts        # Feature configuration
│   │   └── google.ts          # Google config
│   ├── contexts/               # React Context providers
│   │   ├── AuthContext.tsx    # Authentication context
│   │   ├── GameContext.tsx    # Single-player context
│   │   └── MultiplayerContext.tsx # Multiplayer context
│   ├── data/                   # Static data
│   │   └── sampleQuestions.ts # Question data
│   ├── design-system/          # Design system
│   │   └── index.ts           # Design tokens
│   ├── navigation/             # Navigation
│   │   └── AppNavigator.tsx   # Root navigator
│   ├── screens/                # Screen components
│   │   ├── AuthScreens/        # Authentication screens
│   │   ├── __tests__/         # Screen tests
│   │   └── *.tsx              # Screen files
│   ├── services/               # Business logic services
│   │   ├── game/              # Game-specific services (empty)
│   │   └── *.ts               # Service files
│   ├── types/                  # TypeScript types
│   │   ├── game.ts            # Game types
│   │   ├── navigation.ts      # Navigation types
│   │   ├── teams.ts           # Team types
│   │   └── index.ts           # Common types
│   └── utils/                  # Utility functions
│       ├── constants.ts       # Constants
│       ├── avatarUtils.ts     # Avatar utilities
│       ├── gameHelpers.ts     # Game helpers
│       ├── inputValidator.ts  # Input validation
│       ├── responsive.ts      # Responsive utilities
│       ├── deepLinking.ts     # Deep linking
│       ├── webNavigation.ts   # Web navigation
│       ├── webStorage.ts      # Web storage
│       └── webStyles.ts       # Web styles
├── App.tsx                      # Root component
├── app.config.js                # Expo configuration
├── firestore.rules              # Firestore security rules
├── jest.config.js               # Jest configuration
├── metro.config.js              # Metro bundler config
├── package.json                 # Dependencies
├── tsconfig.json                # TypeScript config
├── webpack.config.js            # Webpack config (web)
├── env.example                   # Environment variables template
├── README.md                     # Project README
└── KEEP_UPDATED.md              # This file
```

### Key Directories

**`src/services/`** - All business logic:
- Authentication, multiplayer, game logic
- Scoring, validation, moderation
- Security, rate limiting, edge cases

**`src/contexts/`** - Global state management:
- AuthContext: User authentication state
- GameContext: Single-player game state
- MultiplayerContext: Multiplayer game state

**`src/components/`** - Reusable UI components:
- Buttons, inputs, cards
- Modals, avatars, leaderboards
- Shared components in `shared/` subdirectory

**`src/screens/`** - Screen components:
- Organized by feature (Auth, Game, Multiplayer)
- Each screen is a complete page/route

**`src/types/`** - TypeScript type definitions:
- Game types, navigation types, user types
- Centralized type definitions

---

## Key Components

### Authentication Components

- `GoogleSignInButton.tsx` - Google OAuth button
- `SignOutButton.tsx` - Sign out button
- `Input.tsx` - Text input component
- `Button.tsx` - Button component

### Game Components

- `AnswerFeedback.tsx` - Answer submission feedback
- `ResultsModal.tsx` - Game results display
- `CategoryCard.tsx` - Category selection card
- `CategoryCarousel.tsx` - Category carousel
- `LoadingSpinner.tsx` - Loading indicator

### Multiplayer Components

- `MultiplayerLeaderboard.tsx` - Leaderboard display
- `RankingOverlay.tsx` - Ranking overlay
- `TeamSetupModal.tsx` - Team setup modal
- `HostAssignModal.tsx` - Host assignment modal
- `RoundTimeSelector.tsx` - Round time selector

### Avatar Components

- `AvatarDisplay.tsx` - Avatar display
- `AvatarIcon.tsx` - Avatar icon
- `AvatarSelectionModal.tsx` - Avatar selection modal
- `UserAvatar.tsx` - User avatar component

### Utility Components

- `CrossPlatformAlert.tsx` - Cross-platform alert
- `ToastNotification.tsx` - Toast notifications
- `PrivacyPolicyModal.tsx` - Privacy policy modal
- `EdgeCaseMonitor.tsx` - Edge case monitoring UI
- `GoogleConfigChecker.tsx` - Google config validation

### Shared Components (`src/components/shared/`)

- `StandardButton.tsx` - Standardized button
- `StandardCard.tsx` - Standardized card
- `StandardInput.tsx` - Standardized input

---

## Development Workflow

### Getting Started

1. **Prerequisites:**
   - Node.js 18+
   - npm or yarn
   - Expo CLI: `npm i -g @expo/cli`
   - Firebase project setup

2. **Installation:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   ```bash
   cp env.example .env
   # Fill in Google OAuth client IDs
   ```

4. **Firebase Setup:**
   - Follow `FIREBASE_SETUP.md`
   - Configure authentication providers
   - Set up Firestore security rules
   - Configure Google OAuth (see `GOOGLE_OAUTH_SETUP_GUIDE.md`)

5. **Start Development:**
   ```bash
   npm start              # Start Expo dev server
   npm run android        # Run on Android
   npm run ios            # Run on iOS
   npm run web            # Run on Web
   ```

### Development Commands

```bash
npm start                 # Start Expo dev server
npm run android          # Run on Android
npm run ios              # Run on iOS
npm run web              # Run on Web
npm run typecheck        # TypeScript type checking
npm test                 # Run tests
npm run test:watch       # Watch mode tests
npm run test:coverage    # Test coverage
```

### Code Style

- **Language**: TypeScript (strict mode)
- **Formatting**: No explicit Prettier config (IDE defaults)
- **Linting**: No explicit ESLint config (TypeScript compiler)
- **Naming**: Descriptive, camelCase for variables, PascalCase for components

### Git Workflow

- Feature branches for new features
- Small, focused commits
- Descriptive commit messages
- PR reviews before merge

### Debugging

1. **Expo DevTools**: Built-in debugging tools
2. **React Native Debugger**: Standalone debugger
3. **Console Logging**: Extensive console.log statements (⚠️ Should be reduced)
4. **Firebase Console**: Monitor Firestore and Auth
5. **EdgeCaseMonitor**: UI component for monitoring edge cases

---

## Deployment & Production

### Pre-Deployment Checklist

1. **Environment Variables:**
   - ✅ Move Firebase config to environment variables
   - ✅ Remove hardcoded credentials
   - ✅ Set up production Firebase project

2. **Security:**
   - ✅ Review Firestore security rules
   - ✅ Enable production security features
   - ✅ Remove console.log statements
   - ✅ Move rate limiting to Firestore
   - ✅ Enable external moderation services

3. **Performance:**
   - ✅ Optimize bundle size
   - ✅ Enable code splitting
   - ✅ Optimize images and assets
   - ✅ Review and optimize Firestore queries

4. **Testing:**
   - ✅ Run full test suite
   - ✅ Test on all platforms
   - ✅ Load testing for multiplayer
   - ✅ Security testing

### Build Commands

**Expo Build:**
```bash
eas build --platform ios
eas build --platform android
eas build --platform all
```

**Web Build:**
```bash
expo export:web
# Deploy to Vercel, Netlify, etc.
```

### Production Configuration

1. **Firebase:**
   - Use production Firebase project
   - Enable production security rules
   - Configure production OAuth redirect URIs
   - Set up production analytics

2. **App Stores:**
   - iOS: App Store Connect
   - Android: Google Play Console
   - Web: Static hosting (Vercel, Netlify, etc.)

3. **Monitoring:**
   - Firebase Analytics
   - Error tracking (Sentry, etc.)
   - Performance monitoring
   - Security event monitoring

---

## Known Issues & Technical Debt

### Critical Issues

1. **Hardcoded Firebase Configuration** ⚠️
   - **Location**: `src/services/firebase.ts`
   - **Issue**: Firebase config is hardcoded instead of using environment variables
   - **Impact**: Cannot easily switch between dev/prod environments
   - **Fix**: Move to environment variables using `EXPO_PUBLIC_*` prefix

2. **In-Memory Rate Limiting** ⚠️
   - **Location**: `src/services/auth.ts`, `src/services/rateLimitService.ts`
   - **Issue**: Rate limiting uses in-memory Maps, lost on restart
   - **Impact**: Rate limits don't persist, can be bypassed by restarting
   - **Fix**: Move to Firestore-based rate limiting

3. **Excessive Console Logging** ⚠️
   - **Location**: Throughout codebase
   - **Issue**: Many console.log statements with potentially sensitive data
   - **Impact**: Performance impact, potential security risk
   - **Fix**: Remove or replace with proper logging service

### Code Quality Issues

1. **Large Files**
   - `GameScreen.tsx`: 1,779 lines (should be split)
   - `multiplayerService.ts`: 1,700+ lines (should be modularized)
   - `multiplayerGameFlowV2.ts`: 1,100+ lines (should be split)

2. **Type Safety**
   - Some `any` types used (should be properly typed)
   - Route params use `any` in some places
   - `currentQuestion.answers` uses `any` in GameScreen

3. **Error Handling**
   - Inconsistent error handling patterns
   - Some silent failures
   - Missing error boundaries in some areas

4. **Memory Leaks**
   - Potential leaks in `useEffect` hooks without cleanup
   - Firestore listeners may not be properly cleaned up
   - `SessionManager` Map may grow unbounded

5. **Performance**
   - Large React Contexts may cause unnecessary re-renders
   - No code splitting implemented
   - Large bundle size

### Architecture Improvements

1. **Service Modularization**
   - Split large services into smaller, focused modules
   - Better separation of concerns

2. **State Management**
   - Consider Redux or Zustand for complex state
   - Optimize Context usage to prevent re-renders

3. **Code Splitting**
   - Implement lazy loading for screens
   - Split large components

4. **Testing Coverage**
   - Increase test coverage
   - Add E2E tests
   - Add visual regression tests

### Security Improvements

1. **Rate Limiting**
   - Move to Firestore-based implementation
   - Add IP-based rate limiting
   - Add distributed rate limiting

2. **Input Validation**
   - Strengthen validation rules
   - Add more comprehensive sanitization
   - Implement CSRF protection for web

3. **Monitoring**
   - Add external error tracking (Sentry)
   - Implement security alerting
   - Add performance monitoring

### Documentation Improvements

1. **API Documentation**
   - Document all service methods
   - Add JSDoc comments
   - Create API reference

2. **Component Documentation**
   - Document component props
   - Add usage examples
   - Create component library

3. **Architecture Documentation**
   - Add sequence diagrams
   - Document data flow
   - Create architecture decision records

---

## Additional Resources

### Internal Documentation

- `README.md` - Project overview and quick start
- `FIREBASE_SETUP.md` - Firebase setup guide
- `GOOGLE_OAUTH_SETUP_GUIDE.md` - Google OAuth setup
- `FIREBASE_PASSWORD_RESET_SETUP.md` - Password reset setup
- `SECURITY.md` - Security documentation
- `SECURITY_IMPLEMENTATION_GUIDE.md` - Security implementation
- `SECURITY_AUDIT_REPORT.md` - Security audit
- `SECURITY_VERIFICATION_CHECKLIST.md` - Security checklist
- `DATA_RETENTION_POLICY.md` - Data retention policy
- `FIGMA_DESIGN_PROMPT.md` - Design documentation
- `FIGMA_AI_DESIGN_PROMPT.md` - AI design generation prompt

### External Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [React Navigation](https://reactnavigation.org/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

---

## Version History

- **0.1.0** (Current)
  - Initial release
  - Single-player and multiplayer modes
  - Firebase authentication
  - Real-time multiplayer
  - Custom questions
  - Avatar system

---

## Contact & Support

For questions, issues, or contributions, please refer to the project repository.

---

**Document Maintained By:** Development Team  
**Last Comprehensive Review:** 2024  
**Next Review Date:** As needed

---

*This document should be updated whenever significant changes are made to the project architecture, features, or configuration.*

