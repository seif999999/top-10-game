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
import { User } from '../types';
import SecurityMonitoringService from './securityMonitoringService';

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
      console.warn(`Session expired for user ${userId}`);
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
    console.log('🧹 Clearing auth storage...');
    
    // Clear all auth-related keys
    const keysToRemove = Object.values(AUTH_STORAGE_KEYS);
    
    if (Platform.OS === 'web') {
      // On web, use localStorage
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        console.log(`🗑️ Removed from localStorage: ${key}`);
      });
    } else {
      // On mobile, use AsyncStorage
      await AsyncStorage.multiRemove(keysToRemove);
      console.log(`🗑️ Removed from AsyncStorage: ${keysToRemove.join(', ')}`);
    }
    
    console.log('✅ Auth storage cleared successfully');
  } catch (error) {
    console.error('❌ Error clearing auth storage:', error);
    // Don't throw here - we still want to sign out from Firebase
  }
};

/**
 * Clear all user data and game progress
 */
const clearUserData = async (): Promise<void> => {
  try {
    console.log('🧹 Clearing user data...');
    
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
        console.log(`🗑️ Removed user data from localStorage: ${key}`);
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
        console.log(`🗑️ Removed user data from AsyncStorage: ${userDataKeys.join(', ')}`);
      }
    }
    
    console.log('✅ User data cleared successfully');
  } catch (error) {
    console.error('❌ Error clearing user data:', error);
    // Don't throw here - we still want to sign out from Firebase
  }
};

export const signUpWithEmail = async (
  email: string,
  password: string,
  displayName?: string
): Promise<User> => {
  console.log('🔍 DEBUG: signUpWithEmail called with:', { email, displayName, password: password ? '***' : '' });
  try {
    console.log('🔍 DEBUG: Calling createUserWithEmailAndPassword...');
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    console.log('✅ DEBUG: createUserWithEmailAndPassword successful');
    
    if (displayName) {
      console.log('🔍 DEBUG: Updating profile with displayName...');
      await updateProfile(cred.user, { displayName });
      console.log('✅ DEBUG: Profile updated with displayName');
    }
    
    console.log('🔍 DEBUG: Mapping Firebase user...');
    const user = mapFirebaseUser(cred.user);
    console.log('✅ DEBUG: User mapped successfully:', user);
    return user;
  } catch (error) {
    console.error('❌ DEBUG: signUpWithEmail error:', error);
    const err = error as AuthError | Error;
    const friendlyMessage = getFriendlyAuthMessage(err);
    console.error('❌ DEBUG: Friendly error message:', friendlyMessage);
    throw new Error(friendlyMessage);
  }
};

export const signInWithEmail = async (email: string, password: string): Promise<User> => {
  console.log('🔍 DEBUG: signInWithEmail called with:', { email, password: password ? '***' : '' });
  
  // Check rate limiting
  if (authRateLimit.isBlocked(email)) {
    const remainingTime = Math.ceil(authRateLimit.getRemainingTime(email) / 1000 / 60);
    console.log('❌ DEBUG: Rate limit exceeded for email:', email);
    throw new Error(`Too many login attempts. Please try again in ${remainingTime} minutes.`);
  }

  try {
    console.log('🔍 DEBUG: Calling signInWithEmailAndPassword...');
    const cred = await signInWithEmailAndPassword(auth, email, password);
    console.log('✅ DEBUG: signInWithEmailAndPassword successful');
    
    // Reset rate limiting on successful login
    authRateLimit.reset(email);
    console.log('🔍 DEBUG: Rate limit reset for email');
    
    // Start session management
    sessionManager.startSession(cred.user.uid, () => {
      console.log('Session expired, signing out user');
      signOutUser();
    });
    console.log('🔍 DEBUG: Session management started');
    
    console.log('🔍 DEBUG: Mapping Firebase user...');
    const user = mapFirebaseUser(cred.user);
    console.log('✅ DEBUG: User mapped successfully:', user);
    return user;
  } catch (error) {
    console.error('❌ DEBUG: signInWithEmail error:', error);
    // Record failed attempt
    authRateLimit.recordAttempt(email);
    console.log('🔍 DEBUG: Failed attempt recorded for email');
    
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
      console.error('Failed to log security event:', logError);
    }
    
    const err = error as AuthError | Error;
    const friendlyMessage = getFriendlyAuthMessage(err);
    console.error('❌ DEBUG: Friendly error message:', friendlyMessage);
    throw new Error(friendlyMessage);
  }
};

export const signInWithGoogle = async (idToken: string): Promise<User> => {
  try {
    const credential = GoogleAuthProvider.credential(idToken);
    const cred = await signInWithCredential(auth, credential);
    
    // Start session management
    sessionManager.startSession(cred.user.uid, () => {
      console.log('Session expired, signing out user');
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
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    const err = error as AuthError | Error;
    throw new Error(getFriendlyAuthMessage(err));
  }
};

export const signOutUser = async (): Promise<void> => {
  try {
    console.log('🚪 Starting sign-out process...');
    console.log(`📱 Platform: ${Platform.OS}`);
    
    // Step 1: Clear session management
    const currentUser = auth.currentUser;
    if (currentUser) {
      sessionManager.clearSession(currentUser.uid);
    }
    
    // Step 2: Sign out from Firebase
    console.log('🔥 Signing out from Firebase...');
    await signOut(auth);
    console.log('✅ Firebase sign-out successful');
    
    // Step 3: Clear auth storage
    console.log('🧹 Clearing authentication storage...');
    await clearAuthStorage();
    
    // Step 4: Clear user data
    console.log('🗑️ Clearing user data...');
    await clearUserData();
    
    console.log('✅ Sign-out process completed successfully');
  } catch (error) {
    console.error('💥 Sign-out error:', error);
    
    // Even if there's an error, try to clear storage
    try {
      console.log('🔄 Attempting to clear storage despite error...');
      await clearAuthStorage();
      await clearUserData();
      console.log('✅ Storage cleared despite sign-out error');
    } catch (storageError) {
      console.error('❌ Failed to clear storage:', storageError);
    }
    
    // Re-throw the original error
    const err = error as AuthError | Error;
    throw new Error(`Sign-out failed: ${getFriendlyAuthMessage(err)}`);
  }
};

export const getCurrentUser = (): User | null => {
  return auth.currentUser ? mapFirebaseUser(auth.currentUser) : null;
};

export const updateUserProfile = async (displayName: string): Promise<User> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('No user is currently signed in');
    }
    
    // Update the Firebase user profile
    await updateProfile(currentUser, { displayName });
    
    // Also update the Firestore profile to keep it in sync
    const { UserProfileService } = await import('./userProfileService');
    const userProfileService = UserProfileService.getInstance();
    
    // Get current user profile to preserve avatar data
    const currentProfile = await userProfileService.getUserProfile(currentUser.uid);
    
    // Update only the displayName in Firestore, preserving avatar data
    if (currentProfile) {
      // Only update if displayName actually changed
      if (currentProfile.displayName !== displayName) {
        const updatedProfile = {
          ...currentProfile,
          email: currentUser.email || currentProfile.email || '',
          displayName: displayName,
          lastUpdated: new Date()
        };
        await userProfileService.updateUserProfile(updatedProfile);
        return updatedProfile;
      } else {
        // No change needed, return current profile with email from Firebase Auth
        return {
          ...currentProfile,
          email: currentUser.email || currentProfile.email || ''
        };
      }
    } else {
      // If no profile exists, create one with just displayName
      const newProfile = {
        id: currentUser.uid,
        email: currentUser.email || '',
        displayName: displayName,
        createdAt: new Date(),
        lastUpdated: new Date()
      };
      await userProfileService.updateUserProfile(newProfile);
      return newProfile;
    }
  } catch (error) {
    const err = error as AuthError | Error;
    throw new Error(`Failed to update profile: ${getFriendlyAuthMessage(err)}`);
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
          // Ensure displayName falls back to Firebase user's displayName if not set in Firestore
          // Always use email from Firebase Auth user, not from Firestore
          const userWithFallbackDisplayName = {
            ...userProfile,
            email: fbUser.email || userProfile.email || '',
            displayName: userProfile.displayName || fbUser.displayName || undefined
          };
          cb(userWithFallbackDisplayName);
        } else {
          // Fallback to basic Firebase user data if profile not found
          cb(mapFirebaseUser(fbUser));
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
        // Fallback to basic Firebase user data on error
        cb(mapFirebaseUser(fbUser));
      }
    } else {
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
    stats: undefined
  };
};

const getFriendlyAuthMessage = (error: AuthError | Error): string => {
  if ((error as AuthError).code) {
    const code = (error as AuthError).code;
    
    // Login-specific errors
    if (code === 'auth/invalid-credential') {
      return 'Invalid email or password. Please check your credentials and try again.';
    }
    if (code === 'auth/user-not-found') {
      return 'No account found with this email address. Please check your email or create a new account.';
    }
    if (code === 'auth/wrong-password') {
      return 'Incorrect password. Please try again.';
    }
    if (code === 'auth/invalid-email') {
      return 'Invalid email format. Please enter a valid email address.';
    }
    if (code === 'auth/user-disabled') {
      return 'This account has been disabled. Please contact support.';
    }
    if (code === 'auth/too-many-requests') {
      return 'Too many failed login attempts. Please try again later.';
    }
    
    // Registration-specific errors
    if (code === 'auth/email-already-in-use') {
      return 'An account with this email already exists. Please sign in instead.';
    }
    if (code === 'auth/weak-password') {
      return 'Password is too weak. Please choose a stronger password (at least 6 characters).';
    }
    
    // General errors
    if (code === 'auth/network-request-failed') {
      return 'Network error. Please check your internet connection and try again.';
    }
    if (code === 'auth/operation-not-allowed') {
      return 'Email/password sign-in is not enabled. Please contact support.';
    }
  }
  
  return 'Authentication failed. Please check your details and try again.';
};



