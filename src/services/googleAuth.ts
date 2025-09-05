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
  const redirectUri = AuthSession.makeRedirectUri({
    scheme: GOOGLE_CONFIG.REDIRECT_URI_SCHEME,
    path: 'auth'
  });

  const request = new AuthSession.AuthRequest({
    clientId: getGoogleClientId(),
    scopes: GOOGLE_SCOPES,
    redirectUri,
    responseType: AuthSession.ResponseType.Code,
    extraParams: {
      access_type: 'offline',
      prompt: 'consent'
    }
  });

  return request;
};

// Sign in with Google
export const signInWithGoogle = async (): Promise<{ idToken: string; accessToken: string } | null> => {
  try {
    console.log('🔐 Starting Google Sign-In flow...');
    
    const request = createAuthRequest();
    
    console.log('📱 Platform:', Platform.OS);
    console.log('🔑 Client ID:', getGoogleClientId());
    console.log('🔗 Redirect URI:', request.redirectUri);
    
    // Start the OAuth flow
    const result = await request.promptAsync({
      authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
      useProxy: Platform.select({ web: false, default: true }),
      // Web-specific configuration
      ...(Platform.OS === 'web' && {
        additionalParameters: {
          prompt: 'select_account'
        }
      })
    });

    console.log('📋 Auth result type:', result.type);
    
    if (result.type === 'success' && result.params.code) {
      console.log('✅ Authorization code received, exchanging for tokens...');
      
      // Exchange the authorization code for tokens
      const tokenResult = await AuthSession.exchangeCodeAsync(
        {
          clientId: getGoogleClientId(),
          clientSecret: GOOGLE_CONFIG.CLIENT_SECRET,
          code: result.params.code,
          redirectUri: request.redirectUri,
          extraParams: {
            code_verifier: request.codeChallenge
          }
        },
        {
          tokenEndpoint: 'https://oauth2.googleapis.com/token'
        }
      );

      console.log('🎯 Token exchange result:', {
        hasAccessToken: !!tokenResult.accessToken,
        hasIdToken: !!tokenResult.idToken,
        tokenType: tokenResult.tokenType
      });

      if (tokenResult.accessToken && tokenResult.idToken) {
        console.log('✅ Google Sign-In successful!');
        return {
          idToken: tokenResult.idToken,
          accessToken: tokenResult.accessToken
        };
      } else {
        throw new Error('Token exchange failed - missing required tokens');
      }
    } else if (result.type === 'cancel') {
      console.log('❌ User cancelled Google Sign-In');
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
