import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
  sendPasswordResetEmail,
  type ActionCodeSettings,
  User as FirebaseUser,
  AuthError,
  GoogleAuthProvider,
  signInWithCredential
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { auth } from './firebase';
import { User } from '../../shared/types';
import SecurityMonitoringService from './securityMonitoringService';
import { logger } from '../utils/logger';
import { AppError } from '../../shared/errors';
// Split modules for rate limiting and session management
import { authRateLimit } from './authRateLimit';
import { 
  sessionManager, 
  clearAuthStorage, 
  clearUserData, 
  storeUserSession, 
  retrieveUserSession, 
  clearUserSession 
} from './sessionManager';

export type AuthListenerUnsubscribe = () => void;

// Re-export for backwards compatibility
export { authRateLimit } from './authRateLimit';
export { sessionManager, clearAuthStorage, clearUserData } from './sessionManager';

export const signUpWithEmail = async (
  email: string,
  password: string,
  displayName?: string
): Promise<User> => {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    
    if (displayName) {
      await updateProfile(cred.user, { displayName });
    }
    
    const user = mapFirebaseUser(cred.user);
    return user;
  } catch (error) {
    logger.error('❌ signUpWithEmail error:', error);
    const err = error as AuthError | Error;
    const friendlyMessage = getFriendlyAuthMessage(err);
    throw new Error(friendlyMessage);
  }
};

export const signInWithEmail = async (email: string, password: string): Promise<User> => {
  // Check rate limiting
  const isBlocked = await authRateLimit.isBlocked(email);
  if (isBlocked) {
    const remainingTime = await authRateLimit.getRemainingTime(email);
    const remainingMinutes = Math.ceil(remainingTime / 1000 / 60);
    throw new AppError({
      code: 'RATE_LIMIT_EXCEEDED',
      message: `Too many login attempts. Please try again in ${remainingMinutes} minutes.`,
      userMessage: `Too many login attempts. Please try again in ${remainingMinutes} minutes.`
    });
  }

  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    
    // Reset rate limiting on successful login
    await authRateLimit.reset(email);
    
    // Start session management
    sessionManager.startSession(cred.user.uid, () => {
      logger.log('Session expired, signing out user');
      signOutUser();
    });
    
    const user = mapFirebaseUser(cred.user);
    
    // Store session for persistence
    await storeUserSession(user);
    
    return user;
  } catch (error) {
    logger.error('❌ signInWithEmail error:', error);
    // Record failed attempt
    await authRateLimit.recordAttempt(email);
    
    // Log security event
    try {
      await SecurityMonitoringService.logSecurityEvent({
        userId: email,
        eventType: 'AUTHENTICATION_FAILURE',
        severity: 'MEDIUM',
        description: `Failed login attempt for email: ${email}`,
        metadata: {
          ipAddress: 'unknown',
          userAgent: 'mobile',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    } catch (logError) {
      logger.error('Failed to log security event:', logError);
    }
    
    const err = error as AuthError | Error;
    const friendlyMessage = getFriendlyAuthMessage(err);
    logger.error('❌ DEBUG: Friendly error message:', friendlyMessage);
    throw new Error(friendlyMessage);
  }
};

export const signInWithGoogle = async (idToken: string): Promise<User> => {
  try {
    const credential = GoogleAuthProvider.credential(idToken);
    const cred = await signInWithCredential(auth, credential);
    
    // Start session management
    sessionManager.startSession(cred.user.uid, () => {
      logger.log('Session expired, signing out user');
      signOutUser();
    });
    
    return mapFirebaseUser(cred.user);
  } catch (error) {
    const err = error as AuthError | Error;
    throw new Error(getFriendlyAuthMessage(err));
  }
};

export const resetPassword = async (email: string): Promise<void> => {
  try {
    logger.log('🔐 DEBUG: Starting password reset for email:', email);
    logger.log('🔐 DEBUG: Firebase Auth instance:', auth ? 'Available' : 'Not available');
    logger.log('🔐 DEBUG: Auth domain:', auth?.config?.authDomain);
    
    // Configure auth settings for better email delivery
    if (auth) {
      auth.languageCode = 'en';
    }

    const authDomain = auth?.config?.authDomain || process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '';
    const actionCodeSettings: ActionCodeSettings = {
      // Firebase uses this continue URL when generating a mobile-first reset link.
      url: `https://${authDomain}/reset-password`,
      handleCodeInApp: true,
      iOS: {
        bundleId: 'com.top10game.app',
      },
      android: {
        packageName: 'com.top10game.app',
        installApp: true,
      },
    };

    await sendPasswordResetEmail(auth, email, actionCodeSettings);
    logger.log('✅ DEBUG: Password reset email sent successfully');
  } catch (error) {
    logger.error('❌ DEBUG: Password reset error:', error);
    const err = error as AuthError | Error;
    throw new Error(getFriendlyAuthMessage(err));
  }
};

export const signOutUser = async (): Promise<void> => {
  try {
    logger.log('🚪 Starting sign-out process...');
    logger.log(`📱 Platform: ${Platform.OS}`);
    
    // Step 1: Clear session management
    const currentUser = auth.currentUser;
    if (currentUser) {
      sessionManager.clearSession(currentUser.uid);
    }
    
    // Step 2: Sign out from Firebase
    logger.log('🔥 Signing out from Firebase...');
    await signOut(auth);
    logger.log('✅ Firebase sign-out successful');
    
    // Step 3: Clear user session
    logger.log('🧹 Clearing user session...');
    await clearUserSession();
    
    // Step 4: Clear auth storage
    logger.log('🧹 Clearing authentication storage...');
    await clearAuthStorage();
    
    // Step 5: Clear user data
    logger.log('🗑️ Clearing user data...');
    await clearUserData();
    
    logger.log('✅ Sign-out process completed successfully');
  } catch (error) {
    logger.error('💥 Sign-out error:', error);
    
    // Even if there's an error, try to clear storage
    try {
      logger.log('🔄 Attempting to clear storage despite error...');
      await clearUserSession();
      await clearAuthStorage();
      await clearUserData();
      logger.log('✅ Storage cleared despite sign-out error');
    } catch (storageError) {
      logger.error('❌ Failed to clear storage:', storageError);
    }
    
    // Re-throw the original error
    const err = error as AuthError | Error;
    throw new Error(`Sign-out failed: ${getFriendlyAuthMessage(err)}`);
  }
};

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const fbUser = auth.currentUser;
    
    if (fbUser) {
      // ✅ SECURITY: Email only logged in dev mode
      logger.log('✅ User is already authenticated:', __DEV__ ? fbUser.email : fbUser.uid);
      
      // Load user profile with avatar data from Firestore
      try {
        const { UserProfileService } = await import('./userProfileService');
        const userProfileService = UserProfileService.getInstance();
        const userProfile = await userProfileService.getUserProfile(fbUser.uid);
        
        if (userProfile) {
          // ✅ SECURITY: Email only logged in dev mode
          const displayInfo = userProfile.displayName || (__DEV__ ? userProfile.email : 'User');
          logger.log('✅ User profile loaded from Firestore:', displayInfo);
          const user = {
            ...userProfile,
            email: fbUser.email || userProfile.email || '',
            displayName: userProfile.displayName || fbUser.displayName || undefined
          };
          
          // Store session for persistence
          await storeUserSession(user);
          return user;
        } else {
          logger.log('⚠️ No user profile found in Firestore, using Firebase user data');
          const user = mapFirebaseUser(fbUser);
          await storeUserSession(user);
          return user;
        }
      } catch (error) {
        logger.error('❌ Error loading user profile:', error);
        logger.log('🔄 Falling back to basic Firebase user data');
        const user = mapFirebaseUser(fbUser);
        await storeUserSession(user);
        return user;
      }
    } else {
      // ✅ SECURITY: Firebase Auth says NO user - DO NOT fall back to stored session
      // This prevents session fixation attacks and ensures Firebase Auth is the source of truth
      logger.log('🚪 No Firebase user found - clearing any stale stored session');
      
      // Clear any stale stored session for security
      await clearUserSession();
      
      logger.log('🚪 No authenticated user');
      return null;
    }
  } catch (error) {
    logger.error('❌ Error checking current user:', error);
    
    // ✅ SECURITY: On error, fail secure - clear session and return null
    try {
      await clearUserSession();
    } catch (clearError) {
      logger.error('❌ Error clearing session:', clearError);
    }
    
    return null;
  }
};

export const updateUserProfile = async (updates: { displayName?: string; avatarId?: string }): Promise<User> => {
  try {
    logger.log('🔍 updateUserProfile: Starting profile update...');
    logger.log('🔍 updateUserProfile: Auth instance available:', !!auth);
    logger.log('🔍 updateUserProfile: Updates:', updates);
    
    const currentUser = auth.currentUser;
    // ✅ SECURITY: Email only logged in dev mode
    logger.log('🔍 updateUserProfile: Current user:', currentUser ? `ID: ${currentUser.uid}${__DEV__ ? `, Email: ${currentUser.email}` : ''}` : 'None');
    
    // Always try to get user from stored session first, as it's more reliable
    const storedUser = await retrieveUserSession();
    logger.log('🔍 updateUserProfile: Stored user:', storedUser ? `ID: ${storedUser.id}${__DEV__ ? `, Email: ${storedUser.email}` : ''}` : 'None');
    
    if (!currentUser && !storedUser) {
      logger.error('❌ updateUserProfile: No Firebase user or stored session found');
      throw new Error('No user is currently signed in');
    }
    
    // Use stored user if Firebase Auth is not synced
    if (!currentUser && storedUser) {
      logger.log('✅ updateUserProfile: Using stored user (Firebase Auth not synced)');
      logger.log('🔍 updateUserProfile: Stored user ID:', storedUser.id);
      
      // Validate that stored user has a valid ID
      if (!storedUser.id) {
        logger.error('❌ updateUserProfile: Stored session missing user ID, forcing re-authentication');
        throw new Error('User session is invalid. Please sign in again.');
      }
      
      // Update Firestore directly without Firebase Auth
      const { UserProfileService } = await import('./userProfileService');
      const userProfileService = UserProfileService.getInstance();
      
      // Get current user profile to preserve existing data
      const currentProfile = await userProfileService.getUserProfile(storedUser.id);
      
      if (currentProfile) {
        // Check if there are actual changes
        const hasDisplayNameChange = updates.displayName && currentProfile.displayName !== updates.displayName;
        const hasAvatarChange = updates.avatarId !== undefined && currentProfile.selectedAvatar !== updates.avatarId;
        
        if (hasDisplayNameChange || hasAvatarChange) {
          const updatedProfile = {
            ...currentProfile,
            email: storedUser.email || currentProfile.email || '',
            ...(updates.displayName && { displayName: updates.displayName }),
            ...(updates.avatarId !== undefined && { selectedAvatar: updates.avatarId }),
            lastUpdated: new Date()
          };
          await userProfileService.updateUserProfile(updatedProfile);
          
          // Store updated session for persistence
          await storeUserSession(updatedProfile);
          
          return updatedProfile;
        } else {
          // No change needed, return current profile
          return {
            ...currentProfile,
            email: storedUser.email || currentProfile.email || ''
          };
        }
      } else {
        // If no profile exists, create one with the provided data
        const newProfile = {
          id: storedUser.id,
          email: storedUser.email || '',
          ...(updates.displayName && { displayName: updates.displayName }),
          ...(updates.avatarId !== undefined && { selectedAvatar: updates.avatarId }),
          createdAt: new Date(),
          lastUpdated: new Date()
        };
        await userProfileService.updateUserProfile(newProfile);
        
        // Store new session for persistence
        await storeUserSession(newProfile);
        
        return newProfile;
      }
    }
    
    // Update the Firebase user profile if displayName is provided
    if (updates.displayName) {
      await updateProfile(currentUser, { displayName: updates.displayName });
    }
    
    // Also update the Firestore profile to keep it in sync
    const { UserProfileService } = await import('./userProfileService');
    const userProfileService = UserProfileService.getInstance();
    
    // Get current user profile to preserve existing data
    const currentProfile = await userProfileService.getUserProfile(currentUser.uid);
    
    // Update only the provided fields in Firestore, preserving other data
    if (currentProfile) {
      // Check if there are actual changes
      const hasDisplayNameChange = updates.displayName && currentProfile.displayName !== updates.displayName;
      const hasAvatarChange = updates.avatarId !== undefined && currentProfile.selectedAvatar !== updates.avatarId;
      
      if (hasDisplayNameChange || hasAvatarChange) {
        const updatedProfile = {
          ...currentProfile,
          email: currentUser.email || currentProfile.email || '',
          ...(updates.displayName && { displayName: updates.displayName }),
          ...(updates.avatarId !== undefined && { selectedAvatar: updates.avatarId }),
          lastUpdated: new Date()
        };
        await userProfileService.updateUserProfile(updatedProfile);
        
        // Store updated session for persistence
        await storeUserSession(updatedProfile);
        
        return updatedProfile;
      } else {
        // No change needed, return current profile with email from Firebase Auth
        return {
          ...currentProfile,
          email: currentUser.email || currentProfile.email || ''
        };
      }
    } else {
      // If no profile exists, create one with the provided data
      const newProfile = {
        id: currentUser.uid,
        email: currentUser.email || '',
        ...(updates.displayName && { displayName: updates.displayName }),
        ...(updates.avatarId !== undefined && { selectedAvatar: updates.avatarId }),
        createdAt: new Date(),
        lastUpdated: new Date()
      };
      await userProfileService.updateUserProfile(newProfile);
      
      // Store new session for persistence
      await storeUserSession(newProfile);
      
      return newProfile;
    }
  } catch (error) {
    const err = error as AuthError | Error;
    throw new Error(`Failed to update profile: ${getFriendlyAuthMessage(err)}`);
  }
};


// Force clear all authentication data and require re-login
export const forceReAuthentication = async (): Promise<void> => {
  try {
    logger.log('🔄 Forcing re-authentication...');
    
    // Clear Firebase auth
    await signOut(auth);
    
    // Clear all stored sessions
    await clearUserSession();
    await clearAuthStorage();
    await clearUserData();
    
    logger.log('✅ Re-authentication forced successfully');
  } catch (error) {
    logger.error('❌ Error forcing re-authentication:', error);
    throw error;
  }
};

// Verify authentication persistence is working
export const verifyAuthPersistence = async (): Promise<boolean> => {
  try {
    logger.log('🔍 Verifying authentication persistence...');
    
    // Check if auth is properly initialized
    if (!auth) {
      logger.error('❌ Auth instance not available');
      return false;
    }
    
    // Check if we can access current user
    const currentUser = auth.currentUser;
    
    // For mobile platforms, check if AsyncStorage is working
    if (Platform.OS !== 'web') {
      const testKey = 'auth_persistence_test';
      try {
        const testValue = 'test_value_' + Date.now();
        await AsyncStorage.setItem(testKey, testValue);
        const retrievedValue = await AsyncStorage.getItem(testKey);
        if (retrievedValue !== testValue) {
          logger.error('❌ AsyncStorage test failed');
          return false;
        }
      } catch (storageError) {
        logger.error('❌ AsyncStorage error:', storageError);
        return false;
      } finally {
        await AsyncStorage.removeItem(testKey).catch(() => {});
      }
    }
    
    logger.log('✅ Authentication persistence verification passed');
    return true;
  } catch (error) {
    logger.error('❌ Authentication persistence verification failed:', error);
    return false;
  }
};

export const subscribeToAuthChanges = (cb: (user: User | null) => void): AuthListenerUnsubscribe => {
  
  const unsub = onAuthStateChanged(auth, async (fbUser) => {
    if (fbUser) {
      
      // Load user profile with avatar data from Firestore
      try {
        const { UserProfileService } = await import('./userProfileService');
        const userProfileService = UserProfileService.getInstance();
        const userProfile = await userProfileService.getUserProfile(fbUser.uid);
        
        if (userProfile) {
          // ✅ SECURITY: Email only logged in dev mode
          const displayInfo = userProfile.displayName || (__DEV__ ? userProfile.email : 'User');
          logger.log('✅ User profile loaded from Firestore:', displayInfo);
          // Ensure displayName falls back to Firebase user's displayName if not set in Firestore
          // Always use email from Firebase Auth user, not from Firestore
          const userWithFallbackDisplayName = {
            ...userProfile,
            email: fbUser.email || userProfile.email || '',
            displayName: userProfile.displayName || fbUser.displayName || undefined
          };
          cb(userWithFallbackDisplayName);
        } else {
          logger.log('⚠️ No user profile found in Firestore, using Firebase user data');
          // Fallback to basic Firebase user data if profile not found
          cb(mapFirebaseUser(fbUser));
        }
      } catch (error) {
        logger.error('❌ Error loading user profile:', error);
        logger.log('🔄 Falling back to basic Firebase user data');
        // Fallback to basic Firebase user data on error
        cb(mapFirebaseUser(fbUser));
      }
    } else {
      logger.log('🚪 No authenticated user, calling callback with null');
      cb(null);
    }
  });
  
  return unsub;
};

const mapFirebaseUser = (fbUser: FirebaseUser): User => {
  return {
    id: fbUser.uid,
    email: fbUser.email ?? '',
    displayName: fbUser.displayName ?? undefined,
    createdAt: fbUser.metadata?.creationTime ? new Date(fbUser.metadata.creationTime) : undefined,
    stats: undefined,
    coins: 0 // Default coin balance for new users
  };
};

const getFriendlyAuthMessage = (error: AuthError | Error): string => {
  if ((error as AuthError).code) {
    const code = (error as AuthError).code;
    
    // Common errors that apply to multiple operations
    if (code === 'auth/invalid-email') {
      return 'Invalid email format. Please enter a valid email address.';
    }
    if (code === 'auth/user-not-found') {
      return 'No account found with this email address. Please check your email or create a new account.';
    }
    if (code === 'auth/network-request-failed') {
      return 'Network error. Please check your internet connection and try again.';
    }
    if (code === 'auth/too-many-requests') {
      return 'Too many attempts. Please try again later.';
    }
    if (code === 'auth/operation-not-allowed') {
      return 'This operation is not enabled. Please contact support.';
    }
    if (code === 'auth/user-disabled') {
      return 'This account has been disabled. Please contact support.';
    }
    
    // ✅ SECURITY: Use generic error messages to prevent account enumeration
    // Login-specific errors - use generic message to prevent distinguishing between
    // "user not found" and "wrong password" (prevents account enumeration)
    if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
      return 'Invalid email or password. Please check your credentials and try again.';
    }
    if (code === 'auth/user-not-found') {
      // ✅ SECURITY: Use same generic message as wrong password to prevent account enumeration
      return 'Invalid email or password. Please check your credentials and try again.';
    }
    
    // Registration-specific errors
    if (code === 'auth/email-already-in-use') {
      // ✅ SECURITY: This is acceptable to show during registration (user is trying to create account)
      return 'An account with this email already exists. Please sign in instead.';
    }
    if (code === 'auth/weak-password') {
      return 'Password is too weak. Please choose a stronger password (at least 6 characters).';
    }
  }
  
  return 'Authentication failed. Please check your details and try again.';
};



