# Multiplayer Robustness Migration Guide

This document outlines the changes made to improve multiplayer robustness and provides migration notes for developers.

## Overview

The multiplayer system has been refactored to address critical issues including:
- Data structure unification between single-player and multiplayer
- Atomic transaction handling for scoring
- Timer synchronization across clients
- Role-based access control
- Reconnection and state recovery
- Input validation and error handling

## Key Changes

### 1. Unified Data Types (`src/types/game.ts`)

**New unified types:**
```typescript
export type Answer = {
  id: string;           // stable id
  text: string;         // canonical answer text
  rank: number;         // 1..10 (1 highest)
  aliases?: string[];   // accepted nicknames
};

export type Question = {
  id: string;
  text: string;
  answers: Answer[];    // always length up to 10
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
};
```

**Migration:** All existing `Question` and `GameQuestion` types are now unified under these canonical types.

### 2. Centralized Scoring (`src/services/scoring.ts`)

**New scoring function:**
```typescript
export function pointsForRank(rank: number): number {
  return Math.max(10, (11 - rank) * 10); // rank 1 => 100, rank 10 => 10
}
```

**Migration:** All scoring calculations now use this unified function instead of custom calculations.

### 3. Atomic Transactions (`src/services/multiplayerTransaction.ts`)

**New transaction helpers:**
- `awardAnswer()` - Atomically awards points and marks answers as revealed
- `startRound()` - Starts a new round with proper validation
- `endRound()` - Ends current round and advances to next question
- `updatePlayerPresence()` - Updates player connection status

**Migration:** Replace direct Firestore updates with these transaction helpers for critical operations.

### 4. Timer Synchronization (`src/services/timeSync.ts`)

**New time sync functions:**
- `getServerTimeOffset()` - Calculates client-server time offset
- `calculateTimeRemaining()` - Computes accurate time remaining
- `formatTimeRemaining()` - Formats time for display

**Migration:** Use these functions instead of client-side time calculations for accurate synchronization.

### 5. Question Normalization (`src/services/questionsService.ts`)

**New normalization functions:**
- `normalizeQuestion()` - Converts legacy question formats to unified format
- `safeToLower()` - Safe string normalization preventing undefined errors
- `assertQuestionShape()` - Runtime validation of question data

**Migration:** Use these functions when loading questions to ensure consistent data structure.

## Breaking Changes

### 1. Type Imports
**Before:**
```typescript
import { RoomData, Player, Question } from '../services/multiplayerService';
```

**After:**
```typescript
import { RoomData, Player, Question } from '../types/game';
```

### 2. Question Data Structure
**Before:**
```typescript
// Mixed formats
answers: string[] | QuestionAnswer[]
```

**After:**
```typescript
// Unified format
answers: Answer[]
```

### 3. Scoring Calculations
**Before:**
```typescript
// Custom calculations
const points = Math.max(1, 10 - answerIndex);
```

**After:**
```typescript
// Unified scoring
import { pointsForRank } from '../services/scoring';
const points = pointsForRank(rank);
```

## Migration Steps

### 1. Update Imports
Replace all imports of types from `multiplayerService` with imports from `types/game`:

```typescript
// Old
import { RoomData, Player, Question } from '../services/multiplayerService';

// New
import { RoomData, Player, Question } from '../types/game';
```

### 2. Normalize Question Data
When loading questions, use the normalization function:

```typescript
import { normalizeQuestion } from '../services/questionsService';

// Normalize legacy questions
const normalizedQuestions = questions.map(q => normalizeQuestion(q));
```

### 3. Use Atomic Transactions
Replace direct Firestore updates with transaction helpers:

```typescript
import { awardAnswer, startRound, endRound } from '../services/multiplayerTransaction';

// Old
await updateDoc(roomRef, { /* updates */ });

// New
await awardAnswer(roomCode, answerText, playerId, rank);
```

### 4. Implement Safe String Handling
Use safe string functions to prevent undefined errors:

```typescript
import { safeToLower } from '../services/questionsService';

// Old
const normalized = answer.toLowerCase().trim();

// New
const normalized = safeToLower(answer);
```

### 5. Use Centralized Scoring
Replace custom scoring with unified function:

```typescript
import { pointsForRank } from '../services/scoring';

// Old
const points = Math.max(1, 10 - answerIndex);

// New
const points = pointsForRank(rank);
```

## Testing

### Unit Tests
Run the new unit tests:
```bash
npm test src/__tests__/scoring.test.ts
npm test src/__tests__/questionsService.test.ts
```

### Integration Tests
Run the integration tests with Firebase Emulator:
```bash
# Start Firebase Emulator
firebase emulators:start --only firestore

# Run integration tests
npm test src/__tests__/integration/multiplayer.test.ts
```

## Configuration

### Firebase Setup
The system now uses Firestore exclusively. Ensure your Firebase configuration includes:

```typescript
// src/services/firebase.ts
export const DATABASE_TYPE = 'firestore';
export const isFirestore = true;
export const isRealtimeDB = false;
```

### Google Services Files
For production builds, configure Google services files:

1. **Android:** Place `google-services.json` in project root
2. **iOS:** Place `GoogleService-Info.plist` in project root
3. **EAS Build:** Use EAS secrets for CI/CD

## Performance Improvements

### 1. Memory Management
- All Firestore listeners are properly unsubscribed on component unmount
- Presence monitoring uses efficient intervals
- State updates are batched where possible

### 2. Network Optimization
- Atomic transactions reduce network calls
- Server timestamps ensure accurate synchronization
- Presence updates are throttled to 30-second intervals

### 3. Error Handling
- Comprehensive error boundaries
- Graceful degradation for network issues
- User-friendly error messages

## Security Enhancements

### 1. Role-Based Access Control
- Host-only actions are enforced at both UI and database levels
- Non-host users cannot start/end games or modify room state
- All critical operations validate user permissions

### 2. Input Validation
- All user inputs are sanitized before processing
- String operations use safe functions to prevent crashes
- Question data is validated at runtime

### 3. Rate Limiting
- Answer submissions are rate-limited
- Presence updates are throttled
- Concurrent operations are handled atomically

## Troubleshooting

### Common Issues

1. **"Cannot read property 'toLowerCase' of undefined"**
   - Use `safeToLower()` instead of direct `.toLowerCase()`
   - Ensure all string values are validated before processing

2. **Timer synchronization issues**
   - Use `calculateTimeRemaining()` with server timestamps
   - Implement proper client-server time offset calculation

3. **Double-awarding of points**
   - Use `awardAnswer()` transaction instead of direct updates
   - Ensure all scoring operations are atomic

4. **Memory leaks**
   - Ensure all Firestore listeners are unsubscribed
   - Use proper cleanup in useEffect hooks

### Debug Logging

The system includes comprehensive debug logging:
- `🎮 ROOM_START` - Game start events
- `✅ AWARD_ANSWER` - Successful point awards
- `🎮 CLIENT_NAVIGATE` - Auto-navigation events
- `🕐 TIMERSYNC` - Timer synchronization events
- `⚠️ PRESENCE` - Presence update warnings

## Support

For issues or questions about the migration:
1. Check the debug logs for specific error messages
2. Verify all imports are updated to use new types
3. Ensure Firebase configuration is correct
4. Run unit tests to verify functionality

## Future Enhancements

Planned improvements:
1. Cloud Functions for server-side validation
2. Advanced presence management with heartbeat
3. Real-time collaboration features
4. Performance monitoring and analytics
5. Automated testing in CI/CD pipeline
