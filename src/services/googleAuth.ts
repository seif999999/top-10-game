import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';

// Configure WebBrowser for OAuth
WebBrowser.maybeCompleteAuthSession();

import { GOOGLE_CONFIG, getGoogleClientId, getGoogleRedirectUri } from '../config/google';

// Scopes for Google Sign-In
const GOOGLE_SCOPES = GOOGLE_CONFIG.SCOPES;

// Create the auth request
const createAuthRequest = () => {
  // Use the proper redirect URI from our config
  const redirectUri = getGoogleRedirectUri();

  console.log('🔧 Creating AuthRequest with:', {
    clientId: getGoogleClientId(),
    redirectUri,
    scopes: GOOGLE_SCOPES
  });

  const request = new AuthSession.AuthRequest({
    clientId: getGoogleClientId(),
    scopes: GOOGLE_SCOPES,
    redirectUri,
    responseType: AuthSession.ResponseType.Token, // Use token response type for simpler flow
    extraParams: {
      access_type: 'offline',
      prompt: 'select_account'
    }
  });

  console.log('✅ AuthRequest created successfully');
  return request;
};

// Sign in with Google
export const signInWithGoogle = async (): Promise<{ idToken: string; accessToken: string } | null> => {
  try {
    console.log('🔐 Starting Google Sign-In flow...');
    
    // Log configuration status
    const { getGoogleConfigStatus } = await import('../config/google');
    getGoogleConfigStatus();
    
    const request = createAuthRequest();
    
    console.log('📱 Platform:', Platform.OS);
    console.log('🔑 Client ID:', getGoogleClientId());
    console.log('🔗 Redirect URI:', request.redirectUri);
    
    // Check if client ID is properly configured
    const clientId = getGoogleClientId();
    if (clientId.includes('YOUR_') || clientId.includes('your_')) {
      throw new Error('Google OAuth client ID not properly configured. Please check your .env file.');
    }
    
    console.log('🚀 Starting OAuth prompt...');
    
    // Get the discovery document for Google OAuth
    const discovery = await AuthSession.fetchDiscoveryAsync('https://accounts.google.com');
    
    // Start the OAuth flow with timeout
    const result = await Promise.race([
      request.promptAsync(discovery),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('OAuth prompt timed out after 30 seconds')), 30000)
      )
    ]);

    console.log('📋 Auth result type:', result.type);
    
    if (result.type === 'success' && result.params.access_token) {
      console.log('✅ Access token received directly from OAuth flow');
      
      const accessToken = result.params.access_token;
      const idToken = result.params.id_token;
      
      console.log('🎯 OAuth result:', {
        hasAccessToken: !!accessToken,
        hasIdToken: !!idToken,
        tokenType: result.params.token_type
      });

      if (accessToken && idToken) {
        console.log('✅ Google Sign-In successful!');
        return {
          idToken: idToken,
          accessToken: accessToken
        };
      } else {
        throw new Error('OAuth flow failed - missing required tokens');
      }
    } else if (result.type === 'cancel' || result.type === 'dismiss') {
      console.log('❌ User cancelled or dismissed Google Sign-In');
      return null;
    } else if (result.type === 'error') {
      console.error('❌ Google Sign-In error:', result.error);
      throw new Error(`Google Sign-In failed: ${result.error}`);
    } else {
      console.error('❌ Unexpected auth result:', result);
      throw new Error('Unexpected authentication result');
    }

  } catch (error) {
    console.error('💥 Google Sign-In error:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('network')) {
        throw new Error('Network error. Please check your internet connection and try again.');
      } else if (error.message.includes('client')) {
        throw new Error('Google Sign-In configuration error. Please contact support.');
      } else if (error.message.includes('redirect')) {
        throw new Error('Redirect URI mismatch. Please contact support.');
      } else {
        throw new Error(`Google Sign-In failed: ${error.message}`);
      }
    }
    
    throw new Error('Failed to sign in with Google. Please try again.');
  }
};

// Get Google user info
export const getGoogleUserInfo = async (accessToken: string) => {
  try {
    console.log('👤 Fetching Google user info...');
    
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (response.ok) {
      const userInfo = await response.json();
      console.log('✅ User info received:', {
        id: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture ? 'Available' : 'Not available'
      });
      return userInfo;
    } else {
      console.error('❌ Failed to get user info:', response.status, response.statusText);
      throw new Error(`Failed to get user info: ${response.status}`);
    }
  } catch (error) {
    console.error('💥 Error getting Google user info:', error);
    throw new Error('Failed to get user information from Google.');
  }
};

// Validate Google ID token (basic validation)
export const validateGoogleIdToken = (idToken: string): boolean => {
  try {
    // Basic validation - check if it's a JWT format
    const parts = idToken.split('.');
    if (parts.length !== 3) {
      return false;
    }
    
    // Decode the payload (second part)
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    
    // Check if token is not expired
    const currentTime = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < currentTime) {
      return false;
    }
    
    // Check if issuer is Google
    if (payload.iss !== 'https://accounts.google.com' && payload.iss !== 'accounts.google.com') {
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('❌ ID token validation failed:', error);
    return false;
  }
};
