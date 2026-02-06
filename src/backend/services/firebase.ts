import { initializeApp, getApps, getApp } from 'firebase/app';
import { Platform } from 'react-native';
import { initializeAuth, getAuth, connectAuthEmulator } from 'firebase/auth';
import type { Auth } from 'firebase/auth';
import { getFirestore, serverTimestamp, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { logger } from '../utils/logger';
import { AppError } from '../../shared/errors';
import type { Analytics } from 'firebase/analytics';
// Note: Firebase Analytics is web-only with the JS SDK
// We will import and init it conditionally on web to avoid native runtime errors

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '',
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || ''
};

// Note: App name for email templates is configured in Firebase Console
// Go to Authentication > Templates to set the app name for email templates

// Validate that all required config values are present
const requiredConfigKeys = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
const missingKeys = requiredConfigKeys.filter(key => !firebaseConfig[key as keyof typeof firebaseConfig]);

if (missingKeys.length > 0) {
  logger.error('❌ Missing Firebase configuration:', missingKeys.join(', '));
  throw new AppError({
    code: 'FIREBASE_CONFIG_MISSING',
    message: `Missing Firebase configuration: ${missingKeys.join(', ')}`,
    userMessage: 'Firebase configuration is missing. Please check your .env file.',
    context: { missingKeys }
  });
}

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Initialize Auth with proper persistence
let auth: Auth;

if (Platform.OS === 'web') {
  // For web, use getAuth which has localStorage persistence by default
  auth = getAuth(app);
} else {
  // For React Native, ALWAYS use initializeAuth with AsyncStorage persistence
  // This ensures authentication state persists across app restarts
  try {
    // Try to import getReactNativePersistence (available in Firebase v9+)
    const { getReactNativePersistence } = require('firebase/auth');
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
  } catch (persistenceError: any) {
    // If auth already exists, try to get it
    if (persistenceError.code === 'auth/already-initialized') {
      logger.log('⚠️ Auth already initialized, using existing instance...');
      auth = getAuth(app);
      logger.log('✅ Using existing Firebase Auth instance');
    } else {
      // Other error - try initializeAuth without explicit persistence (fallback)
      logger.log('⚠️ Could not import getReactNativePersistence, trying initializeAuth without explicit persistence...');
      try {
        auth = initializeAuth(app);
      } catch (initError: any) {
        if (initError.code === 'auth/already-initialized') {
          logger.log('⚠️ Auth already initialized, using existing instance...');
          auth = getAuth(app);
          logger.log('✅ Using existing Firebase Auth instance');
        } else {
          logger.error('❌ Failed to initialize Firebase Auth:', initError);
          throw new AppError({
            code: 'FIREBASE_AUTH_INIT_FAILED',
            message: 'Failed to initialize Firebase Auth',
            userMessage: 'Failed to initialize authentication. Please try again.',
            cause: initError
          });
        }
      }
    }
  }
}

// Configure auth settings for better email delivery
if (auth) {
  auth.languageCode = 'en';
  // Note: auth.app.name is read-only, cannot be modified
}

// Optional: Analytics (web only)
export let analytics: Analytics | undefined;
if (Platform.OS === 'web') {
  try {
    // Lazy import to avoid bundling issues on native
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { getAnalytics } = require('firebase/analytics');
    analytics = getAnalytics(app);
    logger.log('✅ Firebase Analytics initialized for web');
  } catch (error) {
    logger.warn('⚠️ Firebase Analytics not available:', error);
    analytics = undefined;
  }
}

// Export auth instance
export { auth };
export const db = getFirestore(app);
export const storage = getStorage(app);

// Connect to Firebase Emulators (optional)
// Set EXPO_PUBLIC_USE_FIREBASE_EMULATOR=true in your .env file to enable
// By default, the app connects to the real Firebase services
const USE_EMULATOR = process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATOR === 'true';

if (USE_EMULATOR) {
  try {
    // Determine emulator host based on platform
    // For React Native: Android uses 10.0.2.2, iOS/Web use localhost
    const EMULATOR_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
    
    // Connect Firestore emulator (only if not already connected)
    // Check if already connected by checking internal settings
    const firestoreSettings = (db as any)._delegate?._settings;
    if (!firestoreSettings?.host?.includes('localhost') && !firestoreSettings?.host?.includes('10.0.2.2')) {
      connectFirestoreEmulator(db, EMULATOR_HOST, 8080);
      logger.log(`✅ Connected to Firestore Emulator at ${EMULATOR_HOST}:8080`);
    }
    
    // Connect Auth emulator (only if not already connected)
    const authSettings = (auth as any)._delegate?._settings;
    if (!authSettings?.config?.emulator) {
      connectAuthEmulator(auth, `http://${EMULATOR_HOST}:9099`, { disableWarnings: true });
      logger.log(`✅ Connected to Auth Emulator at ${EMULATOR_HOST}:9099`);
    }
  } catch (error: any) {
    // Ignore "already connected" errors
    if (error?.message?.includes('already connected') || error?.code === 'already-connected') {
      logger.log('⚠️ Emulators already connected');
    } else {
      logger.warn('⚠️ Failed to connect to Firebase Emulators:', error?.message || error);
    }
  }
}

// Database type detection and helpers
export const DATABASE_TYPE = 'firestore'; // Detected: using Firestore
export const isFirestore = true;
export const isRealtimeDB = false;

// Helper functions for database operations
export const getServerTimestamp = () => serverTimestamp();




