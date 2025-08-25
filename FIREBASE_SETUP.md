# Firebase Setup Guide

## Prerequisites
1. Create a Firebase project at https://console.firebase.google.com/
2. Enable Authentication with Email/Password provider
3. Get your Firebase configuration

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
FIREBASE_API_KEY=your_api_key_here
FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
FIREBASE_APP_ID=your_app_id
FIREBASE_MEASUREMENT_ID=your_measurement_id_optional
```

## Steps to Get Firebase Config

1. Go to Firebase Console
2. Select your project
3. Click on the gear icon (Project Settings)
4. Scroll down to "Your apps" section
5. Click "Add app" and choose "Web"
6. Copy the config values to your `.env` file

## Enable Authentication

1. In Firebase Console, go to Authentication
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Enable "Email/Password" provider
5. Save changes

## Testing

After setup, restart your development server:
```bash
npm start
```

The authentication should now work properly.
