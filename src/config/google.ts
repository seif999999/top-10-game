import { Platform } from 'react-native';

// Google OAuth Configuration
// You need to get these credentials from Google Cloud Console

export const GOOGLE_CONFIG = {
  // Web Client ID (for web platform)
  WEB_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
  
  // iOS Client ID (for iOS platform)
  IOS_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
  
  // Android Client ID (for Android platform)
  ANDROID_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com',
  
  // Client Secret (for server-side token exchange)
  CLIENT_SECRET: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_SECRET || 'YOUR_CLIENT_SECRET',
  
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
  switch (Platform.OS) {
    case 'ios':
      return GOOGLE_CONFIG.IOS_CLIENT_ID;
    case 'android':
      return GOOGLE_CONFIG.ANDROID_CLIENT_ID;
    case 'web':
      return GOOGLE_CONFIG.WEB_CLIENT_ID;
    default:
      // Fallback to web client ID for other platforms
      return GOOGLE_CONFIG.WEB_CLIENT_ID;
  }
};

// Helper function to get the redirect URI
export const getGoogleRedirectUri = (): string => {
  return `${GOOGLE_CONFIG.REDIRECT_URI_SCHEME}://auth`;
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
  return {
    web: GOOGLE_CONFIG.WEB_CLIENT_ID !== 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
    ios: GOOGLE_CONFIG.IOS_CLIENT_ID !== 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
    android: GOOGLE_CONFIG.ANDROID_CLIENT_ID !== 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com',
    clientSecret: GOOGLE_CONFIG.CLIENT_SECRET !== 'YOUR_CLIENT_SECRET',
    currentPlatform: Platform.OS,
    currentClientId: getGoogleClientId()
  };
};
