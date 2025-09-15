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
- 👤 Avatar System with Custom Selection
- 🎯 Fuzzy Answer Matching with Nicknames
- 🔄 Atomic Transaction System

## 🎯 Game Modes

### Single-Player Mode
- **Offline Play with Friends**: Play with friends in the same room without internet
- **Host-Controlled Flow**: A host manages the entire game session
- **Answer Assignment**: Host assigns points to the team that gets the right answer
- **Flexible Game Length**: Game ends when 10 answers are submitted or host decides to end
- **Manual Scoring**: Host has full control over point distribution
- **Category Selection**: Choose from multiple trivia categories
- **Timer System**: 60-second timer for each question
- **Answer Table**: Visual display of all submitted answers with rankings

### Multiplayer Mode
- **Online Play with Friends**: Play with friends online by creating and joining rooms using the code
- **Room-Based System**: Create or join game rooms with unique codes
- **Real-Time Synchronization**: All players see updates in real-time
- **Host Controls**: Room creator controls game flow and can start/end games
- **Answer Submission**: Players submit answers and compete for the top score
- **Game End Conditions**:
  - All 10 answers have been submitted
  - Host decides to end the game
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
- **Partial Matching**: Supports partial word matches and contains logic for better recognition
- **Levenshtein Distance**: Uses advanced string similarity algorithms for accurate matching
- **Confidence Levels**: Provides different confidence levels (exact, high, medium, low) for matches
- **Official Answer Display**: Shows the correct official answer in results, not just what the player typed
- **Real-time Feedback**: Immediate visual feedback with green ✅ for correct answers and red ❌ for wrong answers

### Matching Examples
- ✅ "Micheal Jackson" → "Michael Jackson" (typo correction)
- ✅ "michael jackson" → "Michael Jackson" (case insensitive)
- ✅ "Mike Jackson" → "Michael Jackson" (nickname recognition)
- ✅ "MJ" → "Michael Jackson" (alias matching)
- ✅ "curry" → "Stephen Curry" (sports nickname)
- ✅ "CR7" → "Cristiano Ronaldo" (sports alias)
- ✅ "Dr. Michael Jackson" → "Michael Jackson" (title removal)
- ✅ "  Michael   Jackson  " → "Michael Jackson" (space normalization)

### Technical Implementation
- **Normalization**: Removes titles, articles, and normalizes text for better matching
- **Nickname Dictionary**: Comprehensive mapping of common names and their variations
- **Similarity Thresholds**: Configurable confidence levels for different match types
- **Performance Optimized**: Efficient matching for multiplayer scenarios
- **Atomic Transactions**: Prevents double-awarding of points with retry mechanisms

## 👤 Avatar System

The game includes a comprehensive avatar system that allows players to personalize their profiles:

### Avatar Features
- **5 Initial Avatars**: Mix of human and animal avatars
- **Custom Selection**: Players can choose from available avatars or select "No Avatar"
- **Cross-Platform Rendering**: Programmatic colored circles with emoji icons for consistent display
- **Persistent Storage**: Avatar selections are saved to Firebase and persist across sessions
- **Profile Integration**: Avatars appear in profile screen, home screen, and multiplayer leaderboards

### Avatar Types
- **Human Avatars**: Blue and red colored circles with 👤 emoji
- **Animal Avatars**: Orange, green, and purple colored circles with 🐾 emoji
- **No Avatar Option**: Question mark (?) for players who prefer not to use an avatar

### Technical Implementation
- **Programmatic Rendering**: Uses React Native `View` and `Text` components for cross-platform compatibility
- **Color Mapping**: Each avatar has a unique color associated with its ID
- **Firebase Integration**: Avatar selections stored in user profiles
- **State Management**: Integrated with authentication context for real-time updates

## 🎨 User Interface & Experience

### Clean & Streamlined Design
- **Minimalist Interface**: Removed redundant text and debug elements for a cleaner look
- **Clear Feedback**: Immediate visual feedback with color-coded animations
- **Concise Messaging**: Simplified text to reduce clutter and improve readability
- **Professional Appearance**: Clean, modern UI that focuses on gameplay
- **Purple Theme**: Consistent purple color scheme throughout the app

### Recent UI Improvements
- **Removed Debug Elements**: Eliminated debug buttons and overlays from production
- **Enhanced Feedback System**: 
  - ✅ Green animation for correct answers
  - ❌ Red animation for wrong answers
  - Clear "Wrong Answer" messaging instead of generic "Try Again"
- **Streamlined Text**: 
  - Removed "Game in progress - Submit your answers" text
  - Removed "Found X of Y answers" counter
  - Simplified turn indicators to "Your turn" and "Waiting for [player]"
- **Improved Error Handling**: Better error messages and user guidance
- **Answer Button Styling**: Fully purple answer buttons with consistent theming
- **Timer Management**: Optimized timer display and removal of redundant timers

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

### Architecture Overview
The game follows a modular architecture with clear separation of concerns:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   UI Layer      │    │  Service Layer  │    │  Data Layer     │
│                 │    │                 │    │                 │
│ • Components    │◄───┤ • Auth Service  │◄───┤ • Firebase      │
│ • Screens       │    │ • Game Logic    │    │ • Firestore     │
│ • Contexts      │    │ • Multiplayer   │    │ • Auth          │
│ • Navigation    │    │ • Scoring       │    │ • Storage       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

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

export type Player = {
  id: string;
  name: string;
  score: number;
  isHost: boolean;
  joinedAt: number;
  isConnected: boolean;
  lastSeen: number;
  selectedAvatar?: string;
};

export type RoomData = {
  roomCode: string;
  hostId: string;
  status: 'lobby' | 'playing' | 'finished' | 'closed';
  players: { [playerId: string]: Player };
  currentAnswers: Answer[];
  revealedAnswers: (null | RevealedAnswer)[];
  scores: { [playerId: string]: number };
  // ... additional fields
};
```

### Core Services

#### Authentication Service (`src/services/auth.ts`)
- **User Management**: Handle login, logout, and profile updates
- **Firebase Integration**: Seamless integration with Firebase Auth
- **Profile Persistence**: Maintain user data across sessions
- **Avatar Management**: Handle avatar selection and updates

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

#### User Profile Service (`src/services/userProfileService.ts`)
- **Profile CRUD**: Create, read, update, and delete user profiles
- **Avatar Management**: Handle avatar selection and updates
- **Data Persistence**: Ensure profile data is saved to Firebase

### State Management

#### AuthContext (`src/contexts/AuthContext.tsx`)
- **User State**: Manage current user and authentication status
- **Loading States**: Handle loading and pending action states
- **Profile Updates**: Real-time profile updates including avatars
- **Error Handling**: Graceful handling of authentication errors

#### GameContext (`src/contexts/GameContext.tsx`)
- **Single-Player State**: Manage single-player game state
- **Question Management**: Handle question selection and progression
- **Answer Tracking**: Track submitted answers and scores

#### MultiplayerContext (`src/contexts/MultiplayerContext.tsx`)
- **Room State**: Manage multiplayer room state
- **Player Management**: Track players and their status
- **Turn Management**: Handle turn-based gameplay
- **Real-time Updates**: Synchronize state across players

### Component Architecture

#### Core Components
- **`UserAvatar`**: Displays user avatars with fallback support
- **`AvatarIcon`**: Smaller avatar display for lists and headers
- **`AvatarSelectionModal`**: Modal for selecting avatars
- **`AnswerFeedback`**: Visual feedback for answer submissions
- **`MultiplayerLeaderboard`**: Real-time leaderboard display
- **`ResultsModal`**: Game results and scoring display

#### Screen Components
- **`GameScreen`**: Main gameplay interface
- **`ProfileScreen`**: User profile and avatar management
- **`CreateRoomScreen`**: Multiplayer room creation
- **`JoinRoomScreen`**: Join existing multiplayer rooms
- **`RoomLobbyScreen`**: Pre-game lobby for multiplayer

## 🧪 Testing

The project includes comprehensive testing for critical game functionality:

### Unit Tests
- **Scoring System**: Validate point calculations
- **Question Normalization**: Test answer matching logic
- **Answer Validation**: Ensure correct answer detection
- **Fuzzy Matching**: Test nickname and alias recognition
- **Avatar System**: Test avatar selection and display

### Integration Tests
- **Concurrent Answer Awarding**: Test atomic transactions
- **Multiplayer Flow**: Validate turn-based gameplay
- **Edge Case Handling**: Test error scenarios
- **Authentication Flow**: Test login and profile management

### Test Files
- `src/__tests__/scoring.test.ts` - Scoring system tests
- `src/__tests__/questionsService.test.ts` - Question handling tests
- `src/__tests__/integration/multiplayer.test.ts` - Multiplayer integration tests
- `src/__tests__/edgeCaseTests.ts` - Edge case handling tests
- `src/__tests__/fuzzyMatching.test.ts` - Fuzzy matching system tests
- `src/__tests__/answerAwardAndReveal.test.ts` - Answer scoring and revelation tests
- `src/__tests__/answerSubmissionFix.test.ts` - Answer submission fixes tests
- `src/__tests__/multiplayerAnswerFlow.test.ts` - Multiplayer answer flow integration tests
- `src/__tests__/multiplayerGameFlowV2.test.ts` - Multiplayer game flow v2 tests

### Running Tests
```bash
npx jest                   # Run all tests
npx jest --watch          # Run tests in watch mode
npx jest --coverage       # Run tests with coverage report
```

## 🐛 Recent Bug Fixes & Improvements

### Answer Submission & Scoring
- **Fixed Feedback Animation**: Correct answers now show green ✅, wrong answers show red ❌
- **Enhanced Fuzzy Matching**: Improved partial matching and nickname recognition
- **Atomic Transactions**: Added retry mechanisms and fallback systems for reliable scoring
- **Answer Revelation**: Fixed issue where correct answers weren't being revealed in the table
- **Point Calculation**: Ensured correct points are awarded based on answer rank (1-10 points)

### Multiplayer Stability
- **Room Creation**: Added verification steps to ensure rooms are properly created
- **Join Room Issues**: Fixed "Room not found" errors and improved error handling
- **Malicious Activity Detection**: Refined detection to not flag normal join attempts
- **Connection Handling**: Better handling of player disconnections and edge cases

### UI/UX Enhancements
- **Cleaner Interface**: Removed debug elements and redundant text
- **Better Feedback**: Clear visual indicators for correct/incorrect answers
- **Streamlined Text**: Simplified messaging throughout the game
- **Professional Look**: Enhanced overall visual appeal and user experience
- **Answer Button Styling**: Fixed inner button colors to be fully purple
- **Timer Management**: Removed redundant timers and optimized display
- **Layout Improvements**: Moved answer input to bottom, improved turn indicators

### Avatar System
- **Cross-Platform Rendering**: Fixed avatar display on mobile devices
- **Programmatic Rendering**: Replaced SVG images with colored circles and emojis
- **Persistent Storage**: Fixed avatar persistence across app sessions
- **Profile Integration**: Ensured avatars display correctly in all screens

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- Firebase project
- Git

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

### Step 5: Configure Firestore Rules
The project includes Firestore security rules in `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User profiles - users can read/write their own profile
    match /userProfiles/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Game rooms - authenticated users can read/write
    match /rooms/{roomId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── AnswerFeedback.tsx      # Answer validation feedback
│   ├── AvatarIcon.tsx          # Small avatar display component
│   ├── AvatarSelectionModal.tsx # Avatar selection modal
│   ├── Button.tsx             # Reusable button component
│   ├── CategoryCard.tsx       # Category selection cards
│   ├── MultiplayerLeaderboard.tsx # Real-time leaderboard
│   ├── ResultsModal.tsx       # Game results display
│   ├── UserAvatar.tsx         # Main avatar display component
│   └── ...                    # Other components
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
│   ├── ProfileScreen.tsx     # User profile and avatar management
│   └── ...                   # Other screens
├── services/         # Business logic
│   ├── auth.ts              # Authentication service
│   ├── authService.ts       # Additional auth utilities
│   ├── scoring.ts           # Centralized scoring system
│   ├── multiplayerService.ts # Multiplayer functionality
│   ├── multiplayerTransaction.ts # Atomic transactions
│   ├── timeSync.ts          # Timer synchronization
│   ├── questionsService.ts  # Question management
│   ├── userProfileService.ts # User profile management
│   └── ...                  # Other services
├── types/            # TypeScript definitions
│   ├── game.ts              # Game-related types
│   ├── navigation.ts        # Navigation types
│   ├── teams.ts             # Team-related types
│   └── index.ts             # Main type exports
└── utils/            # Utility functions
    ├── avatarConstants.ts   # Avatar definitions and constants
    ├── avatarUtils.ts       # Avatar utility functions
    ├── constants.ts         # App constants
    ├── gameHelpers.ts       # Game utility functions
    └── ...                  # Other utilities
```

## 🎮 Available Scripts

- `npm start` - Start the development server
- `npm run android` - Run on Android device/emulator
- `npm run ios` - Run on iOS device/simulator
- `npm run web` - Run in web browser
- `npx jest` - Run test suite
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
- **Fixed**: "Room not found" errors have been resolved with better room creation verification

**Scoring Inconsistencies**
- Verify all players are using the same game version
- Check that atomic transactions are working properly
- Ensure answer normalization is consistent
- **Fixed**: Answer revelation and scoring issues have been resolved with atomic transactions

**Answer Matching Issues**
- **Fixed**: Fuzzy matching now supports partial matches and nicknames
- **Fixed**: "CR7" and "curry" now properly match their respective answers
- **Fixed**: Feedback animation now correctly shows green for correct answers, red for wrong answers

**Avatar Display Issues**
- **Fixed**: Avatars now display correctly on both web and mobile
- **Fixed**: Avatar selection persists across app sessions
- **Fixed**: Loading spinners no longer appear unnecessarily

### Debug Tools
- **EdgeCaseMonitor**: Real-time monitoring dashboard for multiplayer issues
- **Console Logging**: Comprehensive debug information
- **Firebase Console**: Database and authentication monitoring

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`npx jest`)
5. Run type checking (`npm run typecheck`)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

### Code Style Guidelines
- Use TypeScript for all new code
- Follow existing naming conventions
- Add tests for new functionality
- Update documentation for new features
- Ensure cross-platform compatibility

### Testing Requirements
- Unit tests for new services and utilities
- Integration tests for new multiplayer features
- UI tests for new components
- Manual testing on both web and mobile platforms

## 📄 License

This project is licensed under the MIT License - see the [LICENSE.txt](LICENSE.txt) file for details.

## 🎯 Roadmap

### Recently Completed ✅
- [x] Enhanced fuzzy matching with partial matching and nicknames
- [x] Fixed answer revelation and scoring system
- [x] Improved UI/UX with cleaner interface and better feedback
- [x] Resolved multiplayer connection and room creation issues
- [x] Added comprehensive testing for critical game functionality
- [x] Implemented atomic transactions with retry mechanisms
- [x] Added avatar system with cross-platform rendering
- [x] Fixed answer button styling and timer management
- [x] Improved layout and theme consistency

### Planned Features
- [ ] Custom category creation
- [ ] Tournament mode
- [ ] Advanced statistics
- [ ] Push notifications
- [ ] Offline mode
- [ ] Multiple language support
- [ ] More avatar options
- [ ] Team-based multiplayer
- [ ] Custom question creation

### Technical Improvements
- [x] Enhanced error handling and edge case management
- [x] Comprehensive testing suite
- [ ] Performance optimization
- [ ] Advanced analytics
- [ ] CI/CD pipeline
- [ ] Code splitting for better performance
- [ ] Progressive Web App (PWA) support

## 🏗️ Development Architecture

### Key Design Patterns
- **Context Pattern**: Used for state management across the app
- **Service Layer Pattern**: Business logic separated from UI components
- **Atomic Transactions**: Ensures data consistency in multiplayer scenarios
- **Observer Pattern**: Real-time updates through Firebase listeners
- **Factory Pattern**: Used for creating game instances and services

### Performance Considerations
- **Lazy Loading**: Components and services loaded on demand
- **Memoization**: React.memo used for expensive components
- **Debouncing**: Input handling and API calls debounced
- **Connection Pooling**: Efficient Firebase connection management
- **State Optimization**: Minimal re-renders through careful state management

### Security Measures
- **Firebase Security Rules**: Proper access control for Firestore
- **Input Validation**: All user inputs validated and sanitized
- **Authentication**: Secure user authentication with Firebase
- **Data Encryption**: Sensitive data encrypted in transit
- **Rate Limiting**: Protection against abuse and spam

---

**Built with ❤️ using React Native, Expo, TypeScript, and Firebase**

For developers looking to contribute or understand the codebase, this README provides a comprehensive overview of the game's architecture, features, and implementation details. The codebase is well-structured with clear separation of concerns, making it easy to navigate and extend.