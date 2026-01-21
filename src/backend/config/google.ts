import { Platform } from 'react-native';
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
  
  // ⚠️ SECURITY WARNING: Client Secret should NEVER be exposed to client-side code
  // This should be moved to a secure backend service
  // For now, we'll remove it from client-side configuration
  // CLIENT_SECRET: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_SECRET || 'YOUR_CLIENT_SECRET',
  
  // Redirect URI scheme for your app
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
  // For Expo OAuth flows, always use the Web Client ID
  // because Expo's auth service is web-based
  return GOOGLE_CONFIG.WEB_CLIENT_ID;
};

// Helper function to get the redirect URI
export const getGoogleRedirectUri = (): string => {
  // For Expo development, use the proper Expo OAuth redirect URI format
  // This will be: https://auth.expo.io/@your-username/your-app-slug
  // For production, you might want to use a custom scheme
  if (__DEV__) {
    // In development, use Expo's OAuth redirect URI
    // Note: Expo sometimes uses @anonymol instead of @anonymous
    return 'https://auth.expo.io/@anonymol/top10game';
  } else {
    // In production, you can use custom scheme
    return `${GOOGLE_CONFIG.REDIRECT_URI_SCHEME}://auth`;
  }
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
