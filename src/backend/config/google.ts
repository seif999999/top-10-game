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

// Expo auth proxy URL — must be in Google Cloud Console authorized redirect URIs.
// On native, we always use this so the request never sends the app scheme (top10game://).
const EXPO_PROXY_REDIRECT_URI = 'https://auth.expo.io/@seifnazmy/top10game';

// Helper function to get the redirect URI (must match Google Cloud Console)
// Native: always use Expo proxy URL so Google never receives top10game:// (avoids 400 invalid_request).
// Web: use makeRedirectUri with useProxy for current origin.
export const getGoogleRedirectUri = (): string => {
  if (Platform.OS === 'web') {
    try {
      const uri = AuthSession.makeRedirectUri() || EXPO_PROXY_REDIRECT_URI;
      console.log('[Google Config] Using redirect URI (web):', uri);
      logger.log('[GoogleAuth] Redirect URI:', uri);
      return uri;
    } catch (e) {
      logger.warn('getGoogleRedirectUri: makeRedirectUri failed, using proxy', e);
      console.log('[Google Config] Using proxy redirect URI:', EXPO_PROXY_REDIRECT_URI);
      return EXPO_PROXY_REDIRECT_URI;
    }
  }
  // Native (iOS/Android): always use proxy so Google never receives top10game:// (avoids 400 invalid_request)
  const uri = EXPO_PROXY_REDIRECT_URI;
  console.log('[Google Config] Using redirect URI (native):', uri);
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
