import { initializeApp, getApps, getApp } from 'firebase/app';
import { Platform } from 'react-native';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import Constants from 'expo-constants';
// Note: Firebase Analytics is web-only with the JS SDK
// We will import and init it conditionally on web to avoid native runtime errors

const extra = (Constants?.expoConfig?.extra as any) ?? (Constants as any)?.manifestExtra ?? {};
const firebaseConfig = (extra?.firebase ?? {}) as {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
};

// Check if we have the minimum required configuration
const hasValidConfig = firebaseConfig?.apiKey && firebaseConfig?.projectId;

if (!hasValidConfig) {
  console.error('Firebase config is missing or incomplete. Ensure env vars are set via app.config.js extra.firebase');
  
  // Create a mock config for development/testing
  const mockConfig = {
    apiKey: 'mock-api-key',
    authDomain: 'mock-project.firebaseapp.com',
    projectId: 'mock-project',
    storageBucket: 'mock-project.appspot.com',
    messagingSenderId: '123456789',
    appId: 'mock-app-id'
  };
  
  console.warn('Using mock Firebase config for development. Authentication will not work.');
  firebaseConfig.apiKey = mockConfig.apiKey;
  firebaseConfig.authDomain = mockConfig.authDomain;
  firebaseConfig.projectId = mockConfig.projectId;
  firebaseConfig.storageBucket = mockConfig.storageBucket;
  firebaseConfig.messagingSenderId = mockConfig.messagingSenderId;
  firebaseConfig.appId = mockConfig.appId;
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



