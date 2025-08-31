import { initializeApp, getApps, getApp } from 'firebase/app';
import { Platform } from 'react-native';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
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

// Optional: Analytics (web only)
export let analytics: any | undefined;
if (Platform.OS === 'web') {
  try {
    // Lazy import to avoid bundling issues on native
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { getAnalytics } = require('firebase/analytics');
    analytics = getAnalytics(app);
  } catch {
    analytics = undefined;
  }
}

// Commonly used services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);



