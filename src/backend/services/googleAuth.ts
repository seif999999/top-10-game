import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure WebBrowser for OAuth
WebBrowser.maybeCompleteAuthSession();

import { GOOGLE_CONFIG, getGoogleClientId, getGoogleRedirectUri } from '../config/google';
import { logger } from '../utils/logger';
import { TIMING } from '../utils/constants';
import { AppError } from '../../shared/errors';

// Scopes for Google Sign-In
const GOOGLE_SCOPES = GOOGLE_CONFIG.SCOPES;

// Storage key for OAuth state
const OAUTH_STATE_KEY = 'oauth_state_token';

/**
 * Generate and store OAuth state token for CSRF protection
 */
const generateAndStoreOAuthState = async (): Promise<string> => {
  try {
    // Generate cryptographically secure random state token
    const stateBytes = await Crypto.getRandomBytesAsync(32);
    const state = Array.from(stateBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    // Store state in session storage for validation
    if (Platform.OS === 'web') {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(OAUTH_STATE_KEY, state);
      }
    } else {
      await AsyncStorage.setItem(OAUTH_STATE_KEY, state);
    }
    
    logger.log('🔐 OAuth state token generated and stored');
    return state;
  } catch (error) {
    logger.error('❌ Error generating OAuth state:', error);
    // ⚠️ FALLBACK: Use timestamp-based state if crypto fails (should never happen in production)
    // This is acceptable as a last resort fallback, but should be logged as an error
    const { generateSecureId } = await import('../utils/secureRandom');
    const fallbackState = await generateSecureId('state').catch(() => {
      // Last resort: timestamp only (no random component)
      return `state_${Date.now()}`;
    });
    if (Platform.OS === 'web' && typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(OAUTH_STATE_KEY, fallbackState);
    } else {
      await AsyncStorage.setItem(OAUTH_STATE_KEY, fallbackState);
    }
    return fallbackState;
  }
};

/**
 * Validate OAuth state token to prevent CSRF attacks
 */
const validateOAuthState = async (receivedState: string): Promise<boolean> => {
  try {
    let storedState: string | null = null;
    
    if (Platform.OS === 'web') {
      if (typeof sessionStorage !== 'undefined') {
        storedState = sessionStorage.getItem(OAUTH_STATE_KEY);
        sessionStorage.removeItem(OAUTH_STATE_KEY);
      }
    } else {
      storedState = await AsyncStorage.getItem(OAUTH_STATE_KEY);
      await AsyncStorage.removeItem(OAUTH_STATE_KEY);
    }
    
    if (!storedState) {
      logger.warn('⚠️ OAuth state validation failed: No stored state found');
      return false;
    }
    
    const isValid = storedState === receivedState;
    
    if (!isValid) {
      logger.warn('⚠️ OAuth state validation failed: State mismatch (possible CSRF attack)');
    } else {
      logger.log('✅ OAuth state validation successful');
    }
    
    return isValid;
  } catch (error) {
    logger.error('❌ Error validating OAuth state:', error);
    return false;
  }
};

/**
 * Create the auth request with CSRF protection
 * ✅ SECURITY: Generates and stores state token for CSRF protection
 */
const createAuthRequest = async () => {
  // Use the proper redirect URI from our config
  const redirectUri = getGoogleRedirectUri();
  
  // ✅ SECURITY: Generate and store state token for CSRF protection
  const state = await generateAndStoreOAuthState();

  logger.log('🔧 Creating AuthRequest with:', {
    clientId: getGoogleClientId(),
    redirectUri,
    scopes: GOOGLE_SCOPES,
    hasState: !!state
  });

  const request = new AuthSession.AuthRequest({
    clientId: getGoogleClientId(),
    scopes: GOOGLE_SCOPES,
    redirectUri,
    responseType: AuthSession.ResponseType.Token, // Use token response type for simpler flow
    state: state, // ✅ Add state parameter for CSRF protection
    extraParams: {
      access_type: 'offline',
      prompt: 'select_account'
    }
  });

  logger.log('✅ AuthRequest created successfully with CSRF protection');
  return request;
};

// Sign in with Google
export const signInWithGoogle = async (): Promise<{ idToken: string; accessToken: string } | null> => {
  try {
    logger.log('🔐 Starting Google Sign-In flow...');
    
    // Log configuration status
    const { getGoogleConfigStatus } = await import('../config/google');
    getGoogleConfigStatus();
    
    const request = await createAuthRequest();
    
    logger.log('📱 Platform:', Platform.OS);
    logger.log('🔑 Client ID:', getGoogleClientId());
    logger.log('🔗 Redirect URI:', request.redirectUri);
    
    // Check if client ID is properly configured
    const clientId = getGoogleClientId();
    if (clientId.includes('YOUR_') || clientId.includes('your_')) {
      throw new AppError({
        code: 'GOOGLE_OAUTH_CONFIG_MISSING',
        message: 'Google OAuth client ID not properly configured. Please check your .env file.',
        userMessage: 'Google Sign-In is not properly configured. Please contact support.'
      });
    }
    
    logger.log('🚀 Starting OAuth prompt...');
    
    // Get the discovery document for Google OAuth
    const discovery = await AuthSession.fetchDiscoveryAsync('https://accounts.google.com');
    
    // Start the OAuth flow with timeout
    const result = await Promise.race([
      request.promptAsync(discovery),
      new Promise((_, reject) => 
        setTimeout(() => reject(new AppError({
          code: 'OAUTH_TIMEOUT',
          message: 'OAuth prompt timed out after 30 seconds',
          userMessage: 'Sign-in timed out. Please try again.'
        })), TIMING.TIMEOUT_30_SECONDS)
      )
    ]);

    logger.log('📋 Auth result type:', result.type);
    
    // ✅ SECURITY: Validate state parameter to prevent CSRF attacks
    if (result.type === 'success' && result.params.state) {
      const stateValid = await validateOAuthState(result.params.state);
      if (!stateValid) {
        logger.error('❌ OAuth state validation failed - possible CSRF attack');
        throw new AppError({
          code: 'OAUTH_STATE_VALIDATION_FAILED',
          message: 'OAuth state validation failed. Please try again.',
          userMessage: 'Security validation failed. Please try signing in again.'
        });
      }
    } else if (result.type === 'success' && !result.params.state) {
      logger.warn('⚠️ OAuth response missing state parameter');
      // For backwards compatibility, allow but log warning
      // In future versions, this should be required
    }
    
    if (result.type === 'success' && result.params.access_token) {
      logger.log('✅ Access token received directly from OAuth flow');
      
      const accessToken = result.params.access_token;
      const idToken = result.params.id_token;
      
      // ✅ SECURITY: Log token presence only, never the actual tokens
      logger.log('🎯 OAuth result:', {
        hasAccessToken: !!accessToken,
        hasIdToken: !!idToken,
        tokenType: result.params.token_type
        // Note: Actual tokens are never logged for security
      });

      if (accessToken && idToken) {
        logger.log('✅ Google Sign-In successful!');
        return {
          idToken: idToken,
          accessToken: accessToken
        };
      } else {
        throw new AppError({
          code: 'OAUTH_MISSING_TOKENS',
          message: 'OAuth flow failed - missing required tokens',
          userMessage: 'Sign-in failed. Please try again.'
        });
      }
    } else if (result.type === 'success' && !result.params.access_token) {
      throw new AppError({
        code: 'OAUTH_MISSING_ACCESS_TOKEN',
        message: 'OAuth flow failed - missing access token',
        userMessage: 'Sign-in failed. Please try again.'
      });
    } else if (result.type === 'cancel' || result.type === 'dismiss') {
      logger.log('❌ User cancelled or dismissed Google Sign-In');
      return null;
    } else if (result.type === 'error') {
      logger.error('❌ Google Sign-In error:', result.error);
      throw new AppError({
        code: 'GOOGLE_SIGNIN_ERROR',
        message: `Google Sign-In failed: ${result.error}`,
        userMessage: 'Google Sign-In failed. Please try again.'
      });
    } else {
      logger.error('❌ Unexpected auth result:', result);
      throw new AppError({
        code: 'OAUTH_UNEXPECTED_RESULT',
        message: 'Unexpected authentication result',
        userMessage: 'Sign-in failed. Please try again.'
      });
    }

  } catch (error) {
    logger.error('💥 Google Sign-In error:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('network')) {
        throw new AppError({
          code: 'NETWORK_ERROR',
          message: 'Network error. Please check your internet connection and try again.',
          userMessage: 'Network error. Please check your internet connection and try again.'
        });
      } else if (error.message.includes('client')) {
        throw new AppError({
          code: 'GOOGLE_CONFIG_ERROR',
          message: 'Google Sign-In configuration error. Please contact support.',
          userMessage: 'Google Sign-In configuration error. Please contact support.'
        });
      } else if (error.message.includes('redirect')) {
        throw new AppError({
          code: 'OAUTH_REDIRECT_MISMATCH',
          message: 'Redirect URI mismatch. Please contact support.',
          userMessage: 'Sign-in configuration error. Please contact support.'
        });
      } else {
        throw new AppError({
          code: 'GOOGLE_SIGNIN_FAILED',
          message: `Google Sign-In failed: ${error.message}`,
          userMessage: 'Google Sign-In failed. Please try again.'
        });
      }
    }
    
    throw new AppError({
      code: 'GOOGLE_SIGNIN_GENERAL_ERROR',
      message: 'Failed to sign in with Google. Please try again.',
      userMessage: 'Failed to sign in with Google. Please try again.'
    });
  }
};

// Get Google user info
export const getGoogleUserInfo = async (accessToken: string) => {
  try {
    logger.log('👤 Fetching Google user info...');
    
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (response.ok) {
      const userInfo = await response.json();
      logger.log('✅ User info received:', {
        id: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture ? 'Available' : 'Not available'
      });
      return userInfo;
    } else {
      logger.error('❌ Failed to get user info:', response.status, response.statusText);
      throw new AppError({
        code: 'GOOGLE_USER_INFO_ERROR',
        message: `Failed to get user info: ${response.status}`,
        userMessage: 'Failed to retrieve user information. Please try again.'
      });
    }
  } catch (error) {
    logger.error('💥 Error getting Google user info:', error);
    throw new AppError({
      code: 'GOOGLE_USER_INFO_FAILED',
      message: 'Failed to get user information from Google.',
      userMessage: 'Failed to retrieve user information. Please try again.'
    });
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
    logger.error('❌ ID token validation failed:', error);
    return false;
  }
};
