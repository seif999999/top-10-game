
# Top 10 Game

A React Native game built with Expo and TypeScript where players compete to guess the top 10 answers in various categories.

## Features

- 🔐 Firebase Authentication
- 🎮 Multiplayer game rooms
- 📱 Cross-platform (iOS, Android, Web)
- 🎨 Modern UI with dark theme
- 📊 Real-time scoring and statistics

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- Firebase project

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Top10Game
```

2. Install dependencies:
```bash
npm install
```

3. Set up Firebase:
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication with Email/Password provider
   - Create a `.env` file in the root directory with your Firebase configuration:

```env
FIREBASE_API_KEY=your_api_key_here
FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
FIREBASE_APP_ID=your_app_id
FIREBASE_MEASUREMENT_ID=your_measurement_id_optional
```

4. Start the development server:
```bash
npm start
```

5. Open the app on your device or simulator

## Firebase Setup

### Step 1: Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name and follow the setup wizard

### Step 2: Enable Authentication
1. In your Firebase project, go to "Authentication"
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Enable "Email/Password" provider
5. Save changes

### Step 3: Get Configuration
1. In Firebase Console, click the gear icon (Project Settings)
2. Scroll down to "Your apps" section
3. Click "Add app" and choose "Web"
4. Copy the configuration values to your `.env` file

### Step 4: Test Authentication
1. Restart your development server
2. Try to register a new account
3. Check the console logs for any errors

## Troubleshooting

### Authentication Not Working
- Ensure Firebase configuration is correct in `.env` file
- Check that Email/Password authentication is enabled in Firebase Console
- Look at console logs for specific error messages
- Use the "Test Firebase Config" button in the login screen

### Common Issues
- **"Firebase config is missing"**: Check your `.env` file and restart the server
- **"Invalid email or password"**: Ensure the user exists and credentials are correct
- **Network errors**: Check your internet connection and Firebase project status

## Project Structure

```
src/
├── components/          # Reusable UI components
├── contexts/           # React contexts (Auth, etc.)
├── navigation/         # Navigation configuration
├── screens/           # App screens
│   ├── AuthScreens/   # Login and Register screens
│   └── ...           # Other screens
├── services/          # API and Firebase services
├── types/             # TypeScript type definitions
└── utils/             # Utility functions and constants
```

## Development

### Available Scripts
- `npm start` - Start the development server
- `npm run android` - Run on Android
- `npm run ios` - Run on iOS
- `npm run web` - Run on web

### Code Style
- Use TypeScript for all new code
- Follow React Native best practices
- Use functional components with hooks
- Maintain consistent naming conventions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
