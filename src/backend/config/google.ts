import { Platform } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import { logger } from '../utils/logger';

// Google OAuth Configuration
// You need to get these credentials from Google Cloud Console

export const GOOGLE_CONFIG = {
  // Web Client ID (for web platform) - Safe to expose, but should come from environment
  WEB_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',
  
  // iOS Client ID (for iOS platform) - Safe to expose, but should come from environment
  IOS_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '',
  
  // Android Client ID (for Android platform) - Safe to expose, but should come from environment
  ANDROID_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '',
  
  // Redirect URI scheme for your app (must match app.config.js scheme)
  REDIRECT_URI_SCHEME: 'top10game',
  
  // Scopes for Google Sign-In
  SCOPES: [
    'openid',
    'profile',
    'email'
  ]
};

// Helper function to get the appropriate client ID for the current platform
export const getGoogleClientId = (): string => {
  if (Platform.OS === 'android' && GOOGLE_CONFIG.ANDROID_CLIENT_ID) {
    return GOOGLE_CONFIG.ANDROID_CLIENT_ID;
  }
  if (Platform.OS === 'ios' && GOOGLE_CONFIG.IOS_CLIENT_ID) {
    return GOOGLE_CONFIG.IOS_CLIENT_ID;
  }
  return GOOGLE_CONFIG.WEB_CLIENT_ID;
};

// Fallback when getRedirectUrl is unavailable (bare workflow)
const FALLBACK_REDIRECT_URI = 'https://auth.expo.io/@seifnazmy/top10game';

// Helper function to get the redirect URI (must match Google Cloud Console)
// For Expo Go: uses getRedirectUrl which returns auth.expo.io with correct project (handles @anonymous if not signed in)
// For web: uses makeRedirectUri for current origin
export const getGoogleRedirectUri = (): string => {
  let uri: string;
  if (Platform.OS === 'web') {
    try {
      uri = AuthSession.makeRedirectUri();
    } catch {
      uri = 'http://localhost:19006';
    }
  } else {
    try {
      // getRedirectUrl returns https://auth.expo.io/@owner/slug - correct for Expo Go proxy
      uri = AuthSession.getRedirectUrl();
    } catch {
      uri = FALLBACK_REDIRECT_URI;
    }
  }
  logger.log('[GoogleAuth] Redirect URI:', uri);
  return uri;
};

// Helper function to check if Google Sign-In is properly configured
export const isGoogleSignInConfigured = (): boolean => {
  const clientId = getGoogleClientId();
  return clientId !== 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com' && 
         clientId !== 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com' && 
         clientId !== 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com';
};

// Helper function to get configuration status
export const getGoogleConfigStatus = () => {
  const status = {
    web: GOOGLE_CONFIG.WEB_CLIENT_ID !== 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
    ios: GOOGLE_CONFIG.IOS_CLIENT_ID !== 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
    android: GOOGLE_CONFIG.ANDROID_CLIENT_ID !== 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com',
    // clientSecret removed for security - should be handled server-side
    currentPlatform: Platform.OS,
    currentClientId: getGoogleClientId(),
    redirectUri: getGoogleRedirectUri(),
    envVars: {
      web: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      ios: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
      android: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID
    }
  };
  
  logger.log('🔧 Google OAuth Configuration Status:', status);
  return status;
};
