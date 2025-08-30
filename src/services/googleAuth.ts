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
    const request = createAuthRequest();
    
    // Start the OAuth flow
    const result = await request.promptAsync({
      authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
      useProxy: Platform.select({ web: false, default: true })
    });

    if (result.type === 'success' && result.params.code) {
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

      if (tokenResult.accessToken && tokenResult.idToken) {
        return {
          idToken: tokenResult.idToken,
          accessToken: tokenResult.accessToken
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Google Sign-In error:', error);
    throw new Error('Failed to sign in with Google. Please try again.');
  }
};

// Get Google user info
export const getGoogleUserInfo = async (accessToken: string) => {
  try {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (response.ok) {
      return await response.json();
    }
    
    throw new Error('Failed to get user info');
  } catch (error) {
    console.error('Error getting Google user info:', error);
    throw new Error('Failed to get user information from Google.');
  }
};
