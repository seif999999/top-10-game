import { initializeApp, getApps, getApp } from 'firebase/app';
import { Platform } from 'react-native';
import { initializeAuth, getAuth } from 'firebase/auth';
import { getFirestore, serverTimestamp } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
// Note: Firebase Analytics is web-only with the JS SDK
// We will import and init it conditionally on web to avoid native runtime errors

// Temporary hardcoded Firebase configuration to bypass environment variable issues
const firebaseConfig = {
  apiKey: 'AIzaSyAu096CybNo1NMFCHVLi1PtPfy4cXgpTgQ',
  authDomain: 'top10-game-f9219.firebaseapp.com',
  projectId: 'top10-game-f9219',
  storageBucket: 'top10-game-f9219.firebasestorage.app',
  messagingSenderId: '807249280703',
  appId: '1:807249280703:web:3706f3bbf0029ef43d500a',
  measurementId: 'G-NCGRYEPFKZ'
};

// Debug logging to see what's actually loaded
console.log('🔍 Firebase Config Debug:');
console.log('Using hardcoded Firebase config:', firebaseConfig);

// Check if we have the minimum required configuration
const hasValidConfig = firebaseConfig?.apiKey && firebaseConfig?.projectId;

console.log('hasValidConfig:', hasValidConfig);

if (!hasValidConfig) {
  console.error('Firebase config is missing or incomplete.');
  throw new Error('Firebase configuration is invalid');
}

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Initialize Auth with React Native persistence
let auth: any;
try {
  // Try to get existing auth instance first
  auth = getAuth(app);
} catch (error) {
  // If no auth instance exists, initialize with persistence
  console.log('🔐 Initializing Firebase Auth with persistence...');
  
  if (Platform.OS === 'web') {
    // For web platform, use default auth
    auth = initializeAuth(app);
    console.log('✅ Firebase Auth initialized for web');
  } else {
    // For React Native platforms, try to use AsyncStorage persistence
    try {
      // Try to import getReactNativePersistence from firebase/auth (v10+)
      const { getReactNativePersistence } = require('firebase/auth');
      
      auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
      console.log('✅ Firebase Auth initialized with AsyncStorage persistence');
    } catch (persistenceError) {
      // Fallback: use default auth if persistence is not available
      console.warn('⚠️ React Native persistence not available, using default auth');
      auth = initializeAuth(app);
      console.log('✅ Firebase Auth initialized with default persistence');
    }
  }
}

// Optional: Analytics (web only)
export let analytics: any | undefined;
if (Platform.OS === 'web') {
  try {
    // Lazy import to avoid bundling issues on native
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { getAnalytics } = require('firebase/analytics');
    analytics = getAnalytics(app);
    console.log('✅ Firebase Analytics initialized for web');
  } catch (error) {
    console.warn('⚠️ Firebase Analytics not available:', error);
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
console.log('🔥 Firebase configuration complete:');
console.log(`   Database: ${DATABASE_TYPE.toUpperCase()}`);
console.log(`   Project: ${firebaseConfig.projectId}`);
console.log(`   Auth: ${auth ? 'Initialized' : 'Failed'}`);
console.log(`   Firestore: ${db ? 'Initialized' : 'Failed'}`);



