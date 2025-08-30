// Google OAuth Configuration
// You need to get these credentials from Google Cloud Console

export const GOOGLE_CONFIG = {
  // Web Client ID (for web platform)
  WEB_CLIENT_ID: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
  
  // iOS Client ID (for iOS platform)
  IOS_CLIENT_ID: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
  
  // Android Client ID (for Android platform)
  ANDROID_CLIENT_ID: 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com',
  
  // Client Secret (for server-side token exchange)
  CLIENT_SECRET: 'YOUR_CLIENT_SECRET',
  
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
  // You can implement platform-specific logic here
  // For now, return the web client ID as default
  return GOOGLE_CONFIG.WEB_CLIENT_ID;
};

// Helper function to get the redirect URI
export const getGoogleRedirectUri = (): string => {
  return `${GOOGLE_CONFIG.REDIRECT_URI_SCHEME}://auth`;
};
