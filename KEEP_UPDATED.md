# Top 10 Game - Project Documentation

**Last Updated:** February 2026  
**Version:** 0.2.0  
**Status:** Active Development

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture](#architecture)
4. [Backend Services](#backend-services)
5. [Features](#features)
6. [Data Models](#data-models)
7. [Security](#security)
8. [File Structure](#file-structure)
9. [Development](#development)

---

## Project Overview

Top 10 Game is a cross-platform trivia game where players guess the top 10 answers in various categories. Supports single-player and real-time multiplayer modes.

### Core Mechanics
- **Single-Player**: Answer questions solo, find all 10 correct answers
- **Multiplayer**: Real-time rooms with turn-based gameplay
- **Scoring**: Rank-based (Rank 1 = 1 point, Rank 10 = 10 points)
- **Validation**: Fuzzy matching with alias/nickname support
- **Categories**: Sports, Movies, Music, Food, Countries, Masry, Custom Questions (10 slots)

### Key Features
- ✅ Firebase Authentication (Email/Password)
- ✅ Real-time multiplayer with Firestore
- ✅ Turn-based gameplay with synchronized timers
- ✅ Avatar selection and profile management
- ✅ Custom question creation (10 slots)
- ✅ Multi-language support (English/Arabic)
- ✅ Content moderation and security monitoring
- ✅ Rate limiting and abuse prevention
- ✅ Cross-platform (iOS, Android, Web)

---

## Technology Stack

### Frontend
- **React Native** `^0.81.4` - Mobile framework
- **Expo** `~54.0.31` - Development platform
- **React** `19.1.0` - UI library
- **TypeScript** `~5.9.2` - Type-safe JavaScript
- **React Navigation** `^6.1.17` - Navigation

### Backend
- **Firebase Auth** - Authentication
- **Cloud Firestore** - Real-time database
- **Firebase Storage** - File storage

### State Management
- **React Context API**: AuthContext, GameContext, MultiplayerContext, AudioContext, LanguageContext

### Storage
- **AsyncStorage** - Mobile local storage
- **localStorage** - Web storage
- **Firestore** - Cloud database

### Key Libraries
- **fastest-levenshtein** `^1.0.16` - Fuzzy matching
- **expo-linear-gradient** `~15.0.8` - UI gradients

### Logging
- **Centralized Logger** (`src/utils/logger.ts`): Environment-aware, silent in production

---

## Architecture

### Design Patterns
1. **Service Layer Pattern**: Business logic in service classes
2. **Singleton Pattern**: Services (AuthService, UserProfileService, CustomQuestionService)
3. **Observer Pattern**: Firestore real-time listeners
4. **Transaction Pattern**: Atomic Firestore updates
5. **Context Pattern**: Global state management

### Data Flow
User Action → Screen → Context → Service → Firebase → Listener → Context → Re-render

### State Strategy
- **Component State**: UI-specific (inputs, loading)
- **Context State**: Global app state (auth, game, multiplayer)
- **Firestore**: Persistent data (rooms, scores, answers)
- **Local Storage**: Preferences, avatars, custom questions

---

## Backend Services

### Firebase Configuration
**Project ID**: `top10-game-f9219`  
**Config**: Environment variables via `EXPO_PUBLIC_*` prefix in `.env`

### Firestore Collections

#### `userProfiles/{userId}`
User profiles (display name, avatar, preferences)

#### `multiplayerGames/{roomCode}`
Real-time multiplayer game rooms

**Key Fields**: `roomCode`, `hostId`, `status`, `gamePhase`, `players`, `questions`, `scores`, `turnOrder`, `currentPlayerId`, `turnTimeLimit`

#### Other Collections
- `securityEvents` - Security logs
- `rateLimits` - Rate limiting data
- `timeSyncDocs` - Server time sync

### Authentication
- Email/Password
- Google Sign-In (OAuth)
- Session persistence (24 hours)
- Password reset flow

---

## Features

### Authentication
- Email/Password registration and login
- Profile management (display name, avatar)
- Session persistence and auto re-authentication

### Single-Player
- Category selection
- Custom questions support (10 slots)
- Answer submission with real-time feedback
- Score tracking and progress indicators

### Multiplayer
- Create/join rooms (6-character code)
- Turn-based system (60 seconds per turn)
- Synchronized timers
- Real-time score updates
- Host controls (start, end, skip turns)
- Host migration on disconnect

### Custom Questions
- 10-slot system for question storage
- Create, edit, and delete questions
- Save questions to specific slots
- Slot titles displayed on selection screen
- Clear individual slots or all slots
- Question persistence across sessions

### Multi-Language
- English/Arabic language selector in Profile
- Persistent language preference
- RTL support ready for Arabic
- Translation infrastructure in place

### Answer Validation
- Fuzzy matching (typo tolerance)
- Case-insensitive
- Alias/nickname support
- Similarity scoring

### Security
- Rate limiting (Firestore-based)
- Input validation and sanitization
- XSS protection
- Content moderation (profanity, spam, PII detection)
- Security event logging
- Authentication security (session timeout, failed login tracking)

---

## Data Models

### Core Types

#### `Question`
```typescript
{
  id: string;
  question: string;
  answers: string[];
  category: string;
}
```

#### `CustomQuestion`
```typescript
{
  id: string; // 'custom-slot-1' through 'custom-slot-10'
  question: string;
  answers: string[];
  createdAt: Date;
  playCount: number;
}
```

#### `RoomData`
Multiplayer room state with players, scores, turn order, and game phase.

#### `Player`
```typescript
{
  id: string;
  name: string;
  score: number;
  isHost: boolean;
  joinedAt: number;
  isConnected: boolean;
  selectedAvatar?: string;
}
```

---

## Security

### Authentication
- Minimum 8 character passwords
- 24-hour session timeout
- Rate limiting (5 failed attempts → 15-min lockout)
- Secure password reset

### Input Security
- XSS protection (manual sanitization)
- Input validation (length, format, type)
- Content moderation (profanity, PII, spam)

### Firestore Security
- User can only access own profile
- Room access limited to participants
- Deny-all default rule

### Network
- HTTPS only
- TLS 1.2 minimum

### Security Status
✅ **SECURE FOR PRODUCTION** - All critical issues resolved

---

## File Structure

```
Top10Game/
├── src/
│   ├── __tests__/           # Test files
│   ├── backend/
│   │   ├── data/            # Sample questions
│   │   ├── services/        # Business logic
│   │   └── utils/           # Utilities
│   ├── frontend/
│   │   ├── components/      # UI components
│   │   ├── contexts/        # React contexts
│   │   ├── navigation/      # Navigation
│   │   └── screens/         # Screen components
│   └── shared/
│       ├── types/           # TypeScript types
│       └── translations/    # Language files
├── App.tsx                  # Root component
├── app.config.js            # Expo config
├── firestore.rules          # Security rules
└── package.json             # Dependencies
```

### Key Directories
- **`src/backend/services/`**: Business logic (auth, multiplayer, game, scoring, validation)
- **`src/frontend/contexts/`**: Global state (Auth, Game, Multiplayer, Audio, Language)
- **`src/frontend/components/`**: Reusable UI components
- **`src/frontend/screens/`**: Screen components
- **`src/shared/types/`**: TypeScript definitions
- **`src/shared/translations/`**: Language translation files

---

## Development

### Getting Started

1. **Prerequisites**: Node.js 18+, npm/yarn, Expo CLI
2. **Installation**: `npm install`
3. **Environment**: Copy `env.example` to `.env` and fill in Firebase config
4. **Firebase Setup**: Follow `FIREBASE_SETUP.md`
5. **Start**: `npm start`

### Commands

```bash
npm start                # Start Expo dev server
npm run android/ios/web  # Run on platform
npm run typecheck        # TypeScript check
npm test                 # Run tests
npm run test:coverage    # Test coverage
```

### Environment Variables

Required in `.env`:
- `EXPO_PUBLIC_FIREBASE_API_KEY`
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
- `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `EXPO_PUBLIC_FIREBASE_APP_ID`
- `EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID`
- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`

### Code Style
- TypeScript strict mode
- Descriptive naming (camelCase for variables, PascalCase for components)
- Use `logger` utility instead of `console` statements

---

## Recent Updates

### Custom Questions System (Feb 2026)
- Switched from unlimited list to 10-slot system
- Each slot can store one custom question
- Slot-based UI with slot selection screen
- Clear individual slots or all slots
- Persistent storage with migration from old format

### Language Support (Feb 2026)
- Added LanguageContext for app-wide language management
- English/Arabic language selector in Profile screen
- Persistent language preference (AsyncStorage/localStorage)
- RTL support infrastructure ready
- Translation file structure created

### Security Improvements (Jan 2026)
- All Firebase config moved to environment variables
- Firestore-based rate limiting (persistent)
- All console statements replaced with logger utility
- Fixed collection name mismatches
- Added missing Firestore security rules
- Deep link validation for password reset

---

*Update this document when making significant changes to architecture, features, or configuration.*
