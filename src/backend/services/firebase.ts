import { initializeApp, getApps, getApp } from 'firebase/app';
import { Platform } from 'react-native';
import { initializeAuth, getAuth } from 'firebase/auth';
import type { Auth } from 'firebase/auth';
import { getFirestore, serverTimestamp } from 'firebase/firestore';
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

// Debug logging to see what's actually loaded
logger.log('🔍 Firebase Config Debug:');
logger.log('Using environment-based Firebase config');
logger.log('Project ID:', firebaseConfig.projectId);

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Initialize Auth with default persistence
let auth: Auth;

// Check if auth already exists
try {
  auth = getAuth(app);
  logger.log('✅ Using existing Firebase Auth instance');
} catch (error) {
  logger.log('🔐 Initializing new Firebase Auth...');
  
  try {
    if (Platform.OS === 'web') {
      // For web, use getAuth which has localStorage persistence by default
      auth = getAuth(app);
      logger.log('✅ Firebase Auth initialized for web with localStorage persistence');
    } else {
      // For React Native, use initializeAuth with AsyncStorage persistence
      try {
        // Try to import getReactNativePersistence (available in Firebase v9+)
        const { getReactNativePersistence } = require('firebase/auth');
        auth = initializeAuth(app, {
          persistence: getReactNativePersistence(AsyncStorage)
        });
        logger.log('✅ Firebase Auth initialized for React Native with AsyncStorage persistence');
      } catch (persistenceError) {
        // Fallback: initializeAuth should automatically use AsyncStorage if available
        logger.log('⚠️ Could not import getReactNativePersistence, using default persistence');
        auth = initializeAuth(app);
        logger.log('✅ Firebase Auth initialized for React Native (default persistence)');
      }
    }
  } catch (error) {
    logger.error('❌ Failed to initialize Firebase Auth:', error);
    throw new AppError({
      code: 'FIREBASE_AUTH_INIT_FAILED',
      message: 'Failed to initialize Firebase Auth',
      userMessage: 'Failed to initialize authentication. Please try again.',
      cause: error
    });
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

// Database type detection and helpers
export const DATABASE_TYPE = 'firestore'; // Detected: using Firestore
export const isFirestore = true;
export const isRealtimeDB = false;

// Helper functions for database operations
export const getServerTimestamp = () => serverTimestamp();

// Log database configuration
logger.log('🔥 Firebase configuration complete:');
logger.log(`   Database: ${DATABASE_TYPE.toUpperCase()}`);
logger.log(`   Project: ${firebaseConfig.projectId}`);
logger.log(`   Auth: ${auth ? 'Initialized' : 'Failed'}`);
logger.log(`   Firestore: ${db ? 'Initialized' : 'Failed'}`);



