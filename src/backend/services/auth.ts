import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
  sendPasswordResetEmail,
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

export type AuthListenerUnsubscribe = () => void;

// Security configuration
interface SecurityConfig {
  maxLoginAttempts: number;
  lockoutDuration: number;
  sessionTimeout: number;
  passwordMinLength: number;
}

const SECURITY_CONFIG: SecurityConfig = {
  maxLoginAttempts: 5,
  lockoutDuration: 15 * 60 * 1000, // 15 minutes
  sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
  passwordMinLength: 8
};

// Rate limiting for authentication attempts
class AuthRateLimit {
  private attempts: Map<string, { count: number; lastAttempt: number }> = new Map();
  
  isBlocked(identifier: string): boolean {
    const record = this.attempts.get(identifier);
    if (!record) return false;
    
    if (Date.now() - record.lastAttempt > SECURITY_CONFIG.lockoutDuration) {
      this.attempts.delete(identifier);
      return false;
    }
    
    return record.count >= SECURITY_CONFIG.maxLoginAttempts;
  }
  
  recordAttempt(identifier: string): void {
    const existing = this.attempts.get(identifier);
    this.attempts.set(identifier, {
      count: existing ? existing.count + 1 : 1,
      lastAttempt: Date.now()
    });
  }
  
  reset(identifier: string): void {
    this.attempts.delete(identifier);
  }
  
  getRemainingTime(identifier: string): number {
    const record = this.attempts.get(identifier);
    if (!record) return 0;
    
    const elapsed = Date.now() - record.lastAttempt;
    return Math.max(0, SECURITY_CONFIG.lockoutDuration - elapsed);
  }
}

// Session management
class SessionManager {
  private sessionTimers: Map<string, NodeJS.Timeout> = new Map();
  
  startSession(userId: string, onExpire: () => void): void {
    this.clearSession(userId);
    
    const timer = setTimeout(() => {
      logger.warn(`Session expired for user ${userId}`);
      onExpire();
    }, SECURITY_CONFIG.sessionTimeout);
    
    this.sessionTimers.set(userId, timer);
  }
  
  extendSession(userId: string, onExpire: () => void): void {
    this.startSession(userId, onExpire);
  }
  
  clearSession(userId: string): void {
    const timer = this.sessionTimers.get(userId);
    if (timer) {
      clearTimeout(timer);
      this.sessionTimers.delete(userId);
    }
  }
}

// Global instances
const authRateLimit = new AuthRateLimit();
const sessionManager = new SessionManager();

// Storage keys for auth-related data
const AUTH_STORAGE_KEYS = {
  USER_DATA: 'auth_user_data',
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'auth_refresh_token',
  GOOGLE_TOKENS: 'auth_google_tokens',
  REMEMBER_ME: 'auth_remember_me'
};

/**
 * Clear all authentication-related data from storage
 */
const clearAuthStorage = async (): Promise<void> => {
  try {
    logger.log('🧹 Clearing auth storage...');
    
    // Clear all auth-related keys
    const keysToRemove = Object.values(AUTH_STORAGE_KEYS);
    
    if (Platform.OS === 'web') {
      // On web, use localStorage
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        logger.log(`🗑️ Removed from localStorage: ${key}`);
      });
    } else {
      // On mobile, use AsyncStorage
      await AsyncStorage.multiRemove(keysToRemove);
      logger.log(`🗑️ Removed from AsyncStorage: ${keysToRemove.join(', ')}`);
    }
    
    logger.log('✅ Auth storage cleared successfully');
  } catch (error) {
    logger.error('❌ Error clearing auth storage:', error);
    // Don't throw here - we still want to sign out from Firebase
  }
};

/**
 * Clear all user data and game progress
 */
const clearUserData = async (): Promise<void> => {
  try {
    logger.log('🧹 Clearing user data...');
    
    if (Platform.OS === 'web') {
      // On web, clear localStorage
      const keys = Object.keys(localStorage);
      const userDataKeys = keys.filter(key => 
        key.startsWith('game_') || 
        key.startsWith('user_') || 
        key.startsWith('stats_') ||
        key.startsWith('history_')
      );
      
      userDataKeys.forEach(key => {
        localStorage.removeItem(key);
        logger.log(`🗑️ Removed user data from localStorage: ${key}`);
      });
    } else {
      // On mobile, clear AsyncStorage
      const keys = await AsyncStorage.getAllKeys();
      const userDataKeys = keys.filter(key => 
        key.startsWith('game_') || 
        key.startsWith('user_') || 
        key.startsWith('stats_') ||
        key.startsWith('history_')
      );
      
      if (userDataKeys.length > 0) {
        await AsyncStorage.multiRemove(userDataKeys);
        logger.log(`🗑️ Removed user data from AsyncStorage: ${userDataKeys.join(', ')}`);
      }
    }
    
    logger.log('✅ User data cleared successfully');
  } catch (error) {
    logger.error('❌ Error clearing user data:', error);
    // Don't throw here - we still want to sign out from Firebase
  }
};

export const signUpWithEmail = async (
  email: string,
  password: string,
  displayName?: string
): Promise<User> => {
  logger.log('🔍 DEBUG: signUpWithEmail called with:', { email, displayName, password: password ? '***' : '' });
  try {
    logger.log('🔍 DEBUG: Calling createUserWithEmailAndPassword...');
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    logger.log('✅ DEBUG: createUserWithEmailAndPassword successful');
    
    if (displayName) {
      logger.log('🔍 DEBUG: Updating profile with displayName...');
      await updateProfile(cred.user, { displayName });
      logger.log('✅ DEBUG: Profile updated with displayName');
    }
    
    logger.log('🔍 DEBUG: Mapping Firebase user...');
    const user = mapFirebaseUser(cred.user);
    logger.log('✅ DEBUG: User mapped successfully:', user);
    return user;
  } catch (error) {
    logger.error('❌ DEBUG: signUpWithEmail error:', error);
    const err = error as AuthError | Error;
    const friendlyMessage = getFriendlyAuthMessage(err);
    logger.error('❌ DEBUG: Friendly error message:', friendlyMessage);
    throw new Error(friendlyMessage);
  }
};

export const signInWithEmail = async (email: string, password: string): Promise<User> => {
  logger.log('🔍 DEBUG: signInWithEmail called with:', { email, password: password ? '***' : '' });
  
  // Check rate limiting
  if (authRateLimit.isBlocked(email)) {
    const remainingTime = Math.ceil(authRateLimit.getRemainingTime(email) / 1000 / 60);
    logger.log('❌ DEBUG: Rate limit exceeded for email:', email);
    throw new Error(`Too many login attempts. Please try again in ${remainingTime} minutes.`);
  }

  try {
    logger.log('🔍 DEBUG: Calling signInWithEmailAndPassword...');
    const cred = await signInWithEmailAndPassword(auth, email, password);
    logger.log('✅ DEBUG: signInWithEmailAndPassword successful');
    
    // Reset rate limiting on successful login
    authRateLimit.reset(email);
    logger.log('🔍 DEBUG: Rate limit reset for email');
    
    // Start session management
    sessionManager.startSession(cred.user.uid, () => {
      logger.log('Session expired, signing out user');
      signOutUser();
    });
    logger.log('🔍 DEBUG: Session management started');
    
    logger.log('🔍 DEBUG: Mapping Firebase user...');
    const user = mapFirebaseUser(cred.user);
    logger.log('✅ DEBUG: User mapped successfully:', user);
    
    // Store session for persistence
    await storeUserSession(user);
    logger.log('✅ DEBUG: User session stored for persistence');
    
    return user;
  } catch (error) {
    logger.error('❌ DEBUG: signInWithEmail error:', error);
    // Record failed attempt
    authRateLimit.recordAttempt(email);
    logger.log('🔍 DEBUG: Failed attempt recorded for email');
    
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
    
    await sendPasswordResetEmail(auth, email);
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
    logger.log('🔍 Checking current authentication state...');
    logger.log('🔍 Auth instance:', auth ? 'Available' : 'Not available');
    logger.log('🔍 Platform:', Platform.OS);
    
    const fbUser = auth.currentUser;
    logger.log('🔍 Current Firebase user:', fbUser ? `ID: ${fbUser.uid}, Email: ${fbUser.email}` : 'None');
    
    if (fbUser) {
      logger.log('✅ User is already authenticated:', fbUser.email);
      
      // Load user profile with avatar data from Firestore
      try {
        const { UserProfileService } = await import('./userProfileService');
        const userProfileService = UserProfileService.getInstance();
        const userProfile = await userProfileService.getUserProfile(fbUser.uid);
        
        if (userProfile) {
          logger.log('✅ User profile loaded from Firestore:', userProfile.displayName || userProfile.email);
          logger.log('🔍 User profile selectedAvatar:', userProfile.selectedAvatar);
          const user = {
            ...userProfile,
            email: fbUser.email || userProfile.email || '',
            displayName: userProfile.displayName || fbUser.displayName || undefined
          };
          
          logger.log('🔍 Final user object selectedAvatar:', user.selectedAvatar);
          
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
      logger.log('🚪 No Firebase user found, checking stored session...');
      
      // Try to retrieve from stored session as fallback
      const storedUser = await retrieveUserSession();
      if (storedUser) {
        logger.log('✅ Retrieved user from stored session:', storedUser.email);
        return storedUser;
      }
      
      logger.log('🚪 No stored session found');
      return null;
    }
  } catch (error) {
    logger.error('❌ Error checking current user:', error);
    
    // Try to retrieve from stored session as fallback
    try {
      const storedUser = await retrieveUserSession();
      if (storedUser) {
        logger.log('✅ Retrieved user from stored session (fallback):', storedUser.email);
        return storedUser;
      }
    } catch (fallbackError) {
      logger.error('❌ Error retrieving stored session:', fallbackError);
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
    logger.log('🔍 updateUserProfile: Current user:', currentUser ? `ID: ${currentUser.uid}, Email: ${currentUser.email}` : 'None');
    
    // Always try to get user from stored session first, as it's more reliable
    const storedUser = await retrieveUserSession();
    logger.log('🔍 updateUserProfile: Stored user:', storedUser ? `ID: ${storedUser.id}, Email: ${storedUser.email}` : 'None');
    
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


// Store user session data for persistence
const storeUserSession = async (user: User): Promise<void> => {
  try {
    logger.log('💾 Storing user session for persistence...');
    logger.log('🔍 Storing user data:', { id: user.id, email: user.email, displayName: user.displayName, selectedAvatar: user.selectedAvatar });
    
    const sessionData = {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      selectedAvatar: user.selectedAvatar,
      timestamp: Date.now()
    };
    
    if (Platform.OS === 'web') {
      localStorage.setItem('user_session', JSON.stringify(sessionData));
      logger.log('✅ User session stored in localStorage');
    } else {
      await AsyncStorage.setItem('user_session', JSON.stringify(sessionData));
      logger.log('✅ User session stored in AsyncStorage');
    }
  } catch (error) {
    logger.error('❌ Error storing user session:', error);
  }
};

// Retrieve user session data for persistence
const retrieveUserSession = async (): Promise<User | null> => {
  try {
    logger.log('🔍 Retrieving user session from storage...');
    
    let sessionData: string | null = null;
    
    if (Platform.OS === 'web') {
      sessionData = localStorage.getItem('user_session');
    } else {
      sessionData = await AsyncStorage.getItem('user_session');
    }
    
    if (!sessionData) {
      logger.log('🚪 No stored user session found');
      return null;
    }
    
    const parsed = JSON.parse(sessionData);
    
    // Check if session is not too old (24 hours)
    const sessionAge = Date.now() - parsed.timestamp;
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    if (sessionAge > maxAge) {
      logger.log('⏰ Stored session is too old, clearing...');
      await clearUserSession();
      return null;
    }
    
    logger.log('✅ User session retrieved from storage:', parsed.email);
    logger.log('🔍 Stored session selectedAvatar:', parsed.selectedAvatar);
    logger.log('🔍 Stored session id:', parsed.id);
    logger.log('🔍 Full stored session data:', parsed);
    
    // Handle migration from old session format (uid -> id)
    if (!parsed.id && parsed.uid) {
      logger.log('🔄 Migrating session from old format (uid -> id)');
      parsed.id = parsed.uid;
      delete parsed.uid;
      
      // Update the stored session with the new format
      try {
        await storeUserSession(parsed as User);
        logger.log('✅ Session migrated and updated');
      } catch (migrationError) {
        logger.warn('⚠️ Failed to migrate session:', migrationError);
      }
    }
    
    // Validate that we have a valid user ID
    if (!parsed.id) {
      logger.error('❌ Stored session missing user ID, clearing session...');
      await clearUserSession();
      return null;
    }
    
    return parsed as User;
  } catch (error) {
    logger.error('❌ Error retrieving user session:', error);
    return null;
  }
};

// Clear user session data
const clearUserSession = async (): Promise<void> => {
  try {
    logger.log('🧹 Clearing user session from storage...');
    
    if (Platform.OS === 'web') {
      localStorage.removeItem('user_session');
    } else {
      await AsyncStorage.removeItem('user_session');
    }
    
    logger.log('✅ User session cleared from storage');
  } catch (error) {
    logger.error('❌ Error clearing user session:', error);
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
    logger.log('🔍 Current user check:', currentUser ? 'User found' : 'No user');
    
    // For mobile platforms, check if AsyncStorage is working
    if (Platform.OS !== 'web') {
      try {
        const testKey = 'auth_persistence_test';
        const testValue = 'test_value_' + Date.now();
        
        await AsyncStorage.setItem(testKey, testValue);
        const retrievedValue = await AsyncStorage.getItem(testKey);
        
        if (retrievedValue === testValue) {
          logger.log('✅ AsyncStorage is working correctly');
          await AsyncStorage.removeItem(testKey);
        } else {
          logger.error('❌ AsyncStorage test failed');
          return false;
        }
      } catch (storageError) {
        logger.error('❌ AsyncStorage error:', storageError);
        return false;
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
  logger.log('🔐 subscribeToAuthChanges: Setting up Firebase auth state listener...');
  
  const unsub = onAuthStateChanged(auth, async (fbUser) => {
    logger.log('🔄 Firebase auth state changed:', fbUser ? `User ID: ${fbUser.uid}, Email: ${fbUser.email}` : 'No user');
    
    if (fbUser) {
      logger.log('👤 Loading user profile for:', fbUser.uid);
      
      // Load user profile with avatar data from Firestore
      try {
        const { UserProfileService } = await import('./userProfileService');
        const userProfileService = UserProfileService.getInstance();
        const userProfile = await userProfileService.getUserProfile(fbUser.uid);
        
        if (userProfile) {
          logger.log('✅ User profile loaded from Firestore:', userProfile.displayName || userProfile.email);
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
  
  logger.log('✅ Firebase auth state listener set up successfully');
  return unsub;
};

const mapFirebaseUser = (fbUser: FirebaseUser): User => {
  return {
    id: fbUser.uid,
    email: fbUser.email ?? '',
    displayName: fbUser.displayName ?? undefined,
    createdAt: fbUser.metadata?.creationTime ? new Date(fbUser.metadata.creationTime) : undefined,
    stats: undefined
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
    
    // Login-specific errors
    if (code === 'auth/invalid-credential') {
      return 'Invalid email or password. Please check your credentials and try again.';
    }
    if (code === 'auth/wrong-password') {
      return 'Incorrect password. Please try again.';
    }
    
    // Registration-specific errors
    if (code === 'auth/email-already-in-use') {
      return 'An account with this email already exists. Please sign in instead.';
    }
    if (code === 'auth/weak-password') {
      return 'Password is too weak. Please choose a stronger password (at least 6 characters).';
    }
  }
  
  return 'Authentication failed. Please check your details and try again.';
};



