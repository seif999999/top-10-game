# Top 10 Game

A React Native trivia game built with Expo and TypeScript where players compete to guess the top 10 answers in various categories. The game features both single-player and multiplayer modes with a unified scoring system and real-time synchronization.

## 🎮 Project Overview

**Top 10** is a competitive trivia game where players attempt to guess the most popular answers to questions across different categories. The game challenges players to think of the top 10 answers that would appear in a survey or poll, with points awarded based on how close their guesses are to the actual rankings.

### Key Features
- 🔐 Firebase Authentication with Google Sign-in
- 🎮 Real-time Multiplayer Game Rooms
- 📱 Cross-platform (iOS, Android, Web)
- 🎨 Modern UI with Dark Theme
- 📊 Centralized Scoring System
- ⏱️ Synchronized Timers
- 🏆 Real-time Leaderboards

## 🎯 Game Modes

### Single-Player Mode
- **Host-Controlled Flow**: A host manages the entire game session
- **Answer Assignment**: Host assigns points based on answer accuracy and ranking
- **Flexible Game Length**: Game ends when 10 answers are submitted or host decides to end
- **Manual Scoring**: Host has full control over point distribution
- **Category Selection**: Choose from multiple trivia categories

### Multiplayer Mode
- **Turn-Based System**: Each player gets individual turns (not team-based)
- **Strict Timing**: Each turn is exactly 60 seconds long
- **Answer Submission**: Players can only submit answers during their turn
- **Turn End Conditions**:
  - Timer expires (60 seconds)
  - Player submits an answer (correct or incorrect)
- **Game End Conditions**:
  - All 10 answers have been submitted
  - Host decides to close the room
- **Host Privileges**:
  - Start the game
  - Close the room/game for all players
  - Manage game flow
- **Player Limitations**:
  - Can only exit individually
  - Cannot close the room
  - Must wait for their turn to submit answers

## 🏆 Scoring System

The game uses a **centralized scoring system** that ensures consistency across both single-player and multiplayer modes:

### Point Distribution
- **Rank 1**: 1 point (lowest value)
- **Rank 2**: 2 points
- **Rank 3**: 3 points
- **Rank 4**: 4 points
- **Rank 5**: 5 points
- **Rank 6**: 6 points
- **Rank 7**: 7 points
- **Rank 8**: 8 points
- **Rank 9**: 9 points
- **Rank 10**: 10 points (highest value)

### Scoring Features
- **Atomic Transactions**: Prevents double-awarding of points
- **Unified Logic**: Same scoring calculation for single-player and multiplayer
- **Answer Validation**: Smart matching with aliases and nicknames
- **Real-time Updates**: Live score updates during gameplay

## 🔍 Enhanced Answer Matching System

The game features an advanced **fuzzy matching system** that makes answer submission more forgiving and user-friendly:

### Key Features
- **Flexible Matching**: Accepts answers with small typos, different casing, extra spaces, and punctuation
- **Nickname Support**: Recognizes common nicknames and abbreviations (e.g., "Mike" for "Michael", "MJ" for "Michael Jackson")
- **Levenshtein Distance**: Uses advanced string similarity algorithms for accurate matching
- **Confidence Levels**: Provides different confidence levels (exact, high, medium, low) for matches
- **Official Answer Display**: Shows the correct official answer in results, not just what the player typed

### Matching Examples
- ✅ "Micheal Jackson" → "Michael Jackson" (typo correction)
- ✅ "michael jackson" → "Michael Jackson" (case insensitive)
- ✅ "Mike Jackson" → "Michael Jackson" (nickname recognition)
- ✅ "MJ" → "Michael Jackson" (alias matching)
- ✅ "Dr. Michael Jackson" → "Michael Jackson" (title removal)
- ✅ "  Michael   Jackson  " → "Michael Jackson" (space normalization)

### Technical Implementation
- **Normalization**: Removes titles, articles, and normalizes text for better matching
- **Nickname Dictionary**: Comprehensive mapping of common names and their variations
- **Similarity Thresholds**: Configurable confidence levels for different match types
- **Performance Optimized**: Efficient matching for multiplayer scenarios

## 🎮 Game Flow

### Single-Player Flow
1. **Setup**: Host selects category and questions
2. **Game Start**: Host begins the game session
3. **Answer Collection**: Host collects answers from players
4. **Scoring**: Host assigns points based on answer rankings
5. **Results**: Display final scores and rankings
6. **Game End**: Host decides when to end the session

### Multiplayer Flow
1. **Room Creation**: Host creates a room and selects category
2. **Player Joining**: Players join using room code
3. **Game Start**: Host starts the game for all players
4. **Turn Rotation**: Players take turns in order
5. **Answer Submission**: Each player submits during their 60-second turn
6. **Real-time Updates**: All players see live updates
7. **Game End**: Automatic when all answers submitted or host closes room

### Host Responsibilities
- Create and manage game rooms
- Select categories and questions
- Start and end games
- Monitor player activity
- Close rooms when needed

### Player Responsibilities
- Join rooms using codes
- Submit answers during their turn
- Wait for their turn to play
- Exit individually if needed

## 🏗️ Technical Implementation

### Unified Data Types
The game uses consistent data structures across single-player and multiplayer modes:

```typescript
// Core game types (src/types/game.ts)
export type Answer = {
  id: string;
  text: string;
  rank: number;        // 1-10 (1 highest)
  aliases?: string[];  // accepted nicknames
};

export type Question = {
  id: string;
  text: string;
  answers: Answer[];
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
};
```

### Core Services

#### Scoring System (`src/services/scoring.ts`)
- **`pointsForRank(rank)`**: Calculate points for answer rank
- **`pointsForAnswerIndex(index)`**: Calculate points for array position
- **`calculateTotalPoints(answers)`**: Sum points for multiple correct answers
- **Atomic validation**: Prevents scoring inconsistencies

#### Multiplayer Infrastructure (`src/services/multiplayerService.ts`)
- **Room Management**: Create, join, and manage game rooms
- **Presence Monitoring**: Track active players and connections
- **Role Enforcement**: Ensure host privileges are respected
- **Real-time Updates**: Synchronize game state across players

#### Transaction Helpers (`src/services/multiplayerTransaction.ts`)
- **Atomic Operations**: Safe concurrent database updates
- **Conflict Resolution**: Handle simultaneous answer submissions
- **Data Integrity**: Ensure consistent game state

#### Time Synchronization (`src/services/timeSync.ts`)
- **Server Offsets**: Synchronize timers across different devices
- **Turn Management**: Ensure fair timing for all players
- **Network Compensation**: Account for network delays

#### Question Management (`src/services/questionsService.ts`)
- **Answer Normalization**: Standardize answer text for comparison
- **Alias Matching**: Support for nicknames and variations
- **Safe String Handling**: Prevent injection and encoding issues

### State Management

#### MultiplayerContext (`src/contexts/MultiplayerContext.tsx`)
- **Role Enforcement**: Manage host vs player permissions
- **Presence Monitoring**: Track player connections and activity
- **State Updates**: Real-time synchronization of game state
- **Error Handling**: Graceful handling of connection issues

## 🧪 Testing

The project includes comprehensive testing for critical game functionality:

### Unit Tests
- **Scoring System**: Validate point calculations
- **Question Normalization**: Test answer matching logic
- **Answer Validation**: Ensure correct answer detection

### Integration Tests
- **Concurrent Answer Awarding**: Test atomic transactions
- **Multiplayer Flow**: Validate turn-based gameplay
- **Edge Case Handling**: Test error scenarios

### Test Files
- `src/__tests__/scoring.test.ts` - Scoring system tests
- `src/__tests__/questionsService.test.ts` - Question handling tests
- `src/__tests__/integration/multiplayer.test.ts` - Multiplayer integration tests
- `src/__tests__/edgeCaseTests.ts` - Edge case handling tests

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- Firebase project

### Installation

1. **Clone the repository**:
```bash
git clone <repository-url>
cd Top10Game
```

2. **Install dependencies**:
```bash
npm install
```

3. **Set up Firebase**:
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication with Email/Password and Google providers
   - Create a `.env` file in the root directory:

```env
FIREBASE_API_KEY=your_api_key_here
FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
FIREBASE_APP_ID=your_app_id
FIREBASE_MEASUREMENT_ID=your_measurement_id_optional
```

4. **Start the development server**:
```bash
npm start
```

5. **Run on your preferred platform**:
```bash
npm run android    # Android
npm run ios        # iOS
npm run web        # Web
```

## 🔧 Firebase Setup

### Step 1: Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name and follow the setup wizard

### Step 2: Enable Authentication
1. In your Firebase project, go to "Authentication"
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Enable "Email/Password" and "Google" providers
5. Save changes

### Step 3: Configure Firestore
1. Go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" for development
4. Select a location for your database

### Step 4: Get Configuration
1. In Firebase Console, click the gear icon (Project Settings)
2. Scroll down to "Your apps" section
3. Click "Add app" and choose "Web"
4. Copy the configuration values to your `.env` file

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── AnswerFeedback.tsx      # Answer validation feedback
│   ├── Button.tsx             # Reusable button component
│   ├── CategoryCard.tsx       # Category selection cards
│   ├── MultiplayerLeaderboard.tsx # Real-time leaderboard
│   ├── ResultsModal.tsx       # Game results display
│   └── ...
├── contexts/           # State management
│   ├── AuthContext.tsx        # Authentication state
│   ├── GameContext.tsx        # Single-player game state
│   └── MultiplayerContext.tsx # Multiplayer game state
├── data/              # Static data
│   └── sampleQuestions.ts     # Question database
├── navigation/        # Navigation configuration
│   └── AppNavigator.tsx       # Main navigation setup
├── screens/          # App screens
│   ├── AuthScreens/          # Login, Register, ForgotPassword
│   ├── GameScreen.tsx        # Main gameplay interface
│   ├── CreateRoomScreen.tsx  # Multiplayer room creation
│   ├── JoinRoomScreen.tsx    # Join multiplayer room
│   └── ...
├── services/         # Business logic
│   ├── auth.ts              # Authentication service
│   ├── scoring.ts           # Centralized scoring system
│   ├── multiplayerService.ts # Multiplayer functionality
│   ├── multiplayerTransaction.ts # Atomic transactions
│   ├── timeSync.ts          # Timer synchronization
│   └── questionsService.ts  # Question management
├── types/            # TypeScript definitions
│   ├── game.ts              # Game-related types
│   ├── navigation.ts        # Navigation types
│   └── teams.ts             # Team-related types
└── utils/            # Utility functions
    ├── constants.ts         # App constants
    └── gameHelpers.ts       # Game utility functions
```

## 🎮 Available Scripts

- `npm start` - Start the development server
- `npm run android` - Run on Android device/emulator
- `npm run ios` - Run on iOS device/simulator
- `npm run web` - Run in web browser
- `npm test` - Run test suite
- `npm run typecheck` - Run TypeScript type checking

## 🔍 Troubleshooting

### Common Issues

**Authentication Not Working**
- Ensure Firebase configuration is correct in `.env` file
- Check that Email/Password and Google authentication are enabled
- Verify Firebase project settings
- Use the "Test Firebase Config" button in the login screen

**Multiplayer Connection Issues**
- Check internet connection
- Verify Firebase project is active
- Ensure room codes are entered correctly
- Check console logs for specific error messages

**Scoring Inconsistencies**
- Verify all players are using the same game version
- Check that atomic transactions are working properly
- Ensure answer normalization is consistent

### Debug Tools
- **EdgeCaseMonitor**: Real-time monitoring dashboard for multiplayer issues
- **Console Logging**: Comprehensive debug information
- **Firebase Console**: Database and authentication monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`npm test`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE.txt](LICENSE.txt) file for details.

## 🎯 Roadmap

### Planned Features
- [ ] Custom category creation
- [ ] Tournament mode
- [ ] Advanced statistics
- [ ] Push notifications
- [ ] Offline mode
- [ ] Multiple language support

### Technical Improvements
- [ ] Performance optimization
- [ ] Enhanced error handling
- [ ] Advanced analytics
- [ ] Automated testing
- [ ] CI/CD pipeline

---

**Built with ❤️ using React Native, Expo, TypeScript, and Firebase**