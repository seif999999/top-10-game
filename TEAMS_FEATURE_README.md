# Teams & Turn-Based Play Feature

## Overview
This feature adds local, offline teams & turn-based play to single-player games. Up to 4 teams can compete with timed turns, and the host manually assigns points by tapping answers.

## How to Test

### 1. Enable the Feature
The feature is controlled by the `FEATURES.teamsEnabled` flag in `src/config/featureFlags.ts`. It's currently set to `true`.

### 2. Start a Team Game
1. Navigate to **Categories** → Choose any category
2. Select a question from the list
3. **Team Setup Modal** should appear automatically (since teams are enabled)
4. Configure your teams:
   - Number of teams (1-4)
   - Edit team names
   - Set round timer (30/60/90 seconds, default 60s)
   - Optionally set max rounds
   - Ensure "I am the host" is checked
5. Tap **Start Game**

### 3. Play the Game (Host Mode)
- The game screen shows all possible answers as locked 🔒 initially
- **Current Team Indicator** shows active team, color, and score
- **Round Timer** counts down (auto-advances to next team when reaches 0)
- **Host Assignment**:
  1. Tap any locked answer row
  2. **Host Assign Modal** opens
  3. Select which team gets the answer (current team pre-selected)
  4. Adjust points if needed (default from answer rank)
  5. Tap **Assign**
  6. Answer reveals and points are added to the selected team

### 4. Turn Management
- **End Turn** button to manually skip to next team
- Timer auto-advances turns when it reaches 0
- Teams cycle through until game ends or host manually ends

### 5. Game End Conditions
- All answers assigned to teams
- Max rounds reached (if set)
- Host manually ends the game

## Files Added/Modified

### New Files
- `src/config/featureFlags.ts` - Feature toggle
- `src/types/teams.ts` - Team-related types and constants
- `src/components/TeamSetupModal.tsx` - Pre-game team configuration
- `src/components/HostAssignModal.tsx` - Host answer assignment interface

### Modified Files
- `src/types/index.ts` - Added `shuffledQuestions` to `GameState`
- `src/types/navigation.ts` - Added `teamConfig` to `GameScreen` params
- `src/contexts/GameContext.tsx` - Added team mode state and actions
- `src/screens/QuestionSelectionScreen.tsx` - Integrated team setup modal
- `src/screens/GameScreen.tsx` - Added team mode UI and logic

## Key Features Implemented

✅ **Team Setup Modal** with all requested controls
✅ **Host Answer Assignment** via tapping answer rows
✅ **Team Indicator** showing current team, color, and score
✅ **Round Timer** with auto-advance functionality
✅ **Turn Controls** (End Turn, Pass)
✅ **Answer Revealing** with team badges showing assignments
✅ **Team Scoring** separate from single-player scores
✅ **Offline/Local Only** - no network or multiplayer modifications

## Safety Features

- **Feature Toggle**: Can be disabled by setting `FEATURES.teamsEnabled = false`
- **Multiplayer Isolation**: Team mode UI only shows in single-player mode
- **No Regression**: Existing single-player and multiplayer modes unchanged
- **Reversible**: All changes are additive and can be safely removed

## Testing Checklist

- [ ] Team setup modal appears after selecting a question (single-player only)
- [ ] All team configuration options work (teams, names, timer, rounds)
- [ ] Game starts with correct team state
- [ ] Host can tap locked answers to open assignment modal
- [ ] Answer assignment reveals answer and adds points to correct team
- [ ] Team indicator shows current team with correct info
- [ ] Timer counts down and auto-advances turns
- [ ] End Turn button works
- [ ] Game ends when all answers assigned or manually ended
- [ ] Multiplayer mode unaffected (no team UI should show)
- [ ] Single-player mode without teams still works normally

## Notes

- Default timer: 60 seconds
- Max teams: 4
- Team colors are pre-defined (Red, Teal, Blue, Green)
- Host must confirm all answer assignments (no auto-assignment)
- Unlimited rounds by default (host can set 1, 3, or 5 rounds)
