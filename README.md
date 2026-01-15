# Top 10 Game

[![Build](https://img.shields.io/badge/build-passing-brightgreen)](./)
[![Tests](https://img.shields.io/badge/tests-jest-blue)](./)
[![License: MIT](https://img.shields.io/badge/license-MIT-yellow)](LICENSE.txt)
[![Expo](https://img.shields.io/badge/expo-~54.0.0-black)](https://expo.dev)

Top 10 is a cross-platform trivia game built with Expo, React Native, and TypeScript. Players compete to guess the top 10 answers in various categories. The app supports single-player and real-time multiplayer with unified scoring, synchronized timers, and Firebase-backed persistence.

## Table of Contents
1. Project Overview
2. Game Mechanics & Flows
3. Architecture & System Design
4. Code Structure & Organization
5. Detailed Technical Implementation
6. Configuration & Settings
7. Installation & Setup
8. Usage & Examples
9. API Documentation
10. Development Workflow
11. Deployment
12. Troubleshooting & FAQ
13. Extension & Modification Guide
14. Technical Specifications
15. Contributing & Maintenance
16. References & Resources

## 1. Project Overview
- Name: Top 10 Game
- Description: Trivia game where players guess the top 10 answers per category. Multiplayer rooms enable real-time, turn-based play.
- Key Features:
  - Firebase Auth with Email/Password authentication
  - Real-time multiplayer (rooms, turns, presence, host controls)
  - Unified scoring across modes, atomic Firestore transactions
  - Cross-platform: Web, iOS, Android (Expo)
  - Avatar system and profile persistence
  - Fuzzy answer matching with alias/nickname support
  - Modern UI with streamlined feedback
- Tech Stack: Expo, React Native, TypeScript, React Navigation, Firebase (Auth, Firestore, Storage), Jest
- Status: Active development (version per package.json: 0.1.0)
- Screenshots/GIFs: Add assets in `assets/` and reference here.

## 2. Game Mechanics & Flows
- Core Loop: Select category → present question → player submits answers during their turn → validate and score → reveal correct answers → advance turn or question → finish after all answers revealed or host ends.
- States: `lobby` → `playing` → `finished`/`closed` (see `RoomData.status`). Questions also track `gamePhase` such as `question`/`results`).
- Player Actions:
  - Host: create room, start/end game, next question, reveal answers, kick player
  - Player: join room, submit answers on turn, advance/skip if permitted
- Win/Lose: Highest score at end of all questions wins; ties allowed.
- Scoring: Rank 1..10 maps to 1..10 points. Central functions in `src/services/scoring.ts` and flows in `multiplayerTransaction.ts` and `multiplayerGameFlowV2.ts` ensure atomic updates and consistency.
- Progression: Questions iterate; each has up to 10 answers. Difficulty and categories are defined in data/services.
- Rules:
  1) Only current player can submit during their turn
  2) Each correct answer reveals once globally
  3) Question completes when all answers revealed or host ends
  4) Scores update atomically; no double-awards

## 3. Architecture & System Design
- Layers:
  - UI: components and screens
  - Service: auth, scoring, multiplayer, questions, transactions, time sync
  - Data: Firebase (Auth, Firestore, Storage)
- Design Patterns:
  - Context for app state (`AuthContext`, `GameContext`, `MultiplayerContext`)
  - Service Layer abstraction around Firebase
  - Observer via Firestore listeners
  - Atomic transaction pattern to serialize concurrent updates
- Data Flow: UI triggers service actions → services read/write Firestore within transactions → contexts subscribe to changes and update UI.
- State Management: Context + reducer per domain. Multiplayer uses a rich reducer with connection, role, selection, and turn state.
- Events: Turn advancement, host migration notifications, room termination messages.
- Module Dependencies: Screens depend on contexts; contexts depend on services; services depend on Firebase SDK.

## 4. Code Structure & Organization
```
src/
  components/           UI building blocks (answer feedback, avatars, leaderboard, etc.)
  contexts/             App state providers (auth, single-player, multiplayer)
  data/                 Static/sample questions
  navigation/           Root navigator and routing
  screens/              Feature screens (auth, game, multiplayer, profile)
  services/             Business logic (auth, scoring, multiplayer, transactions, time sync)
  types/                TypeScript types (game, navigation, teams)
  utils/                Helpers (avatar utils, constants, web storage/styles)
```
Naming favors descriptive nouns for data and verbs for actions. Services encapsulate Firebase calls; contexts expose imperative actions and derived state.

## 5. Detailed Technical Implementation
- Auth: `src/contexts/AuthContext.tsx` wires Firebase Auth via `auth.ts`/`authService.ts`. Session persistence, profile syncing, and avatar selection are handled and stored in Firestore.
- Firebase Init: `src/services/firebase.ts` initializes app/auth/firestore/storage. **Note:** Firebase config is currently hardcoded for development. For production, move to environment variables (`EXPO_PUBLIC_*`).
- Multiplayer: `MultiplayerContext.tsx` + `multiplayerService.ts` + `multiplayerTransaction.ts` manage rooms, presence, turn order, submissions, and atomic scoring. `multiplayerGameFlowV2.ts` advances questions/turns and reveals answers.
- Single-Player: `GameContext.tsx` with `gameLogic.ts` and `questionsService.ts` for answer validation and scoring.
- Scoring: `scoring.ts` provides canonical point mapping. Transactions compute and apply points, update `scores`, `revealedAnswers`, and advance `currentTurnIndex`.
- Answer Matching: Fuzzy and alias matching via `questionsService.ts` and helpers. Accepts typos/case/spacing and common nicknames.
- Error Handling & Logging: Guard clauses, explicit error messages, and console logging in services and contexts. Basic error boundary in `App.tsx` (consider adding error reporting service for production).
- Performance: Batched Firestore updates in transactions, memoized components, and reduced re-renders through context selectors.

## 6. Configuration & Settings
- Environment Variables: Firebase configuration is currently hardcoded in `src/services/firebase.ts` for development. For production, move to environment variables using Expo `EXPO_PUBLIC_*` prefix. Optional Google OAuth variables (not used in UI):
```
# Optional - Google OAuth (backend services may use, but UI does not)
# EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your_web_client_id.apps.googleusercontent.com
# EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your_ios_client_id.apps.googleusercontent.com
# EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your_android_client_id.apps.googleusercontent.com

# Firebase public config (recommended for production)
# EXPO_PUBLIC_FIREBASE_API_KEY=...
# EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
# EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
# EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
# EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
# EXPO_PUBLIC_FIREBASE_APP_ID=...
```
- Config Files: `package.json`, `tsconfig.json`, `jest.config.js`, `metro.config.js`, `webpack.config.js`, `firestore.rules`.
- Customizable Parameters: Limits and thresholds in `edgeCaseHandler.ts` (timeouts, limits, max players), feature flags in `src/config/features.ts` and `src/config/featureFlags.ts` if present.
- Defaults: Safe development defaults; production should tighten security rules and disable mock moderation providers.

## 7. Installation & Setup
- Prerequisites: Node 18+, npm, Git, Expo CLI (`npm i -g @expo/cli`), Firebase project.
- Steps:
  1) Clone repo and `npm install`
  2) Configure Firebase (Auth providers, Firestore, rules) per guides
  3) Start: `npm start`; platforms: `npm run android | ios | web`
- See `FIREBASE_SETUP.md` and `FIREBASE_PASSWORD_RESET_SETUP.md` for detailed Firebase setup.
- Note: Firebase config is currently hardcoded in `src/services/firebase.ts` for development. For production, use environment variables.

## 8. Usage & Examples
- Run locally: `npm start` then launch platform of choice.
- Basic flow: Register/Login → Home → Single or Multiplayer → Category → Game.
- Testing:
```
npx jest
npx jest --watch
npx jest --coverage
```

## 9. API Documentation
This is a client app using Firebase as backend. Internal service contracts worth noting:
- `MultiplayerService`/`multiplayerTransaction`: Firestore document `multiplayerGames/{roomCode}` fields: `players`, `scores`, `currentAnswers`, `revealedAnswers`, `turnOrder`, `currentTurnIndex`, `currentPlayerId`, `answersSubmittedCount`, `status`, `gamePhase`.
- Auth/profile: `userProfiles/{userId}` holds display and avatar selections.

## 10. Development Workflow
- Dev Setup: Use npm. Typecheck: `npm run typecheck`. Linting follows TS defaults (configure as needed).
- Build: Managed by Expo. Web bundling via Metro/Webpack config provided.
- Testing: Jest with `@testing-library/react-native`; see `src/__tests__`.
- Debugging: Expo devtools, console logs, `EdgeCaseMonitor` UI, Firebase Console.
- Style: TypeScript, descriptive naming, guard clauses, minimal nesting.
- Git: Branch per feature, small PRs, conventional messages encouraged.

## 11. Deployment
- Production: Use Expo build/eas submit for iOS/Android; deploy web via static hosting (e.g., Vercel/Netlify). Ensure production Firebase project and environment variables are configured.
- Environments: Dev vs prod Firebase projects; toggle moderation providers and feature flags appropriately.
- Monitoring: Firebase Console (Auth/Firestore). Add crash/error reporting as needed.
- Backup & Recovery: Firestore exports or scheduled backups per Firebase best practices.

## 12. Troubleshooting & FAQ
- Auth not working: Verify Firebase configuration in `src/services/firebase.ts`, ensure Email/Password provider is enabled in Firebase Console, check network connectivity.
- Room not found: Ensure room creation succeeded and you're on the same Firebase project.
- Scoring mismatch: Check atomic transaction logs and that clients run the same version.
- Answer not recognized: Confirm aliases in questions and fuzzy matching thresholds.
- Firebase connection issues: Verify Firebase project ID and API keys are correct in `src/services/firebase.ts`.

## 13. Extension & Modification Guide
- Add feature flags in `config/` and guard UI/flows accordingly.
- Add services under `src/services/` and expose actions via contexts.
- Extend scoring via `scoring.ts` while preserving atomic updates.
- Customize moderation by enabling providers in `externalModerationService.ts`.

## 14. Technical Specifications
- Performance: Transaction-based updates; expect low-latency turn updates. Optimize by batching and minimizing listeners.
- Resources: Runs on typical mobile devices and modern browsers. Firestore read/write within free tier for small rooms.
- Scalability: Room-per-doc model; horizontal by room. Consider sharding for very large audiences.
- Security: Follow `firestore.rules`. Inputs validated and sanitized. Rate limiting in `rateLimitService.ts`.
- Compatibility: React Native 0.81, React 19, Expo ~54; Web via `react-native-web`.

## 15. Contributing & Maintenance
- Use feature branches, keep changes scoped, add tests and update docs.
- Keep README aligned with changes in Auth, Multiplayer, and Firebase config.

## 16. References & Resources
- Internal docs: `KEEP_UPDATED.md` (comprehensive project documentation), `SECURITY.md`, `SECURITY_IMPLEMENTATION_GUIDE.md`, `SECURITY_AUDIT_REPORT.md`, `SECURITY_VERIFICATION_CHECKLIST.md`, `FIREBASE_SETUP.md`, `FIREBASE_PASSWORD_RESET_SETUP.md`.
- Third-party: Expo, Firebase, React Navigation, Jest, React Native.

---
Built with React Native, Expo, TypeScript, and Firebase.
