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

export type AuthListenerUnsubscribe = () => void;

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
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName) {
      await updateProfile(cred.user, { displayName });
    }
    return mapFirebaseUser(cred.user);
  } catch (error) {
    const err = error as AuthError | Error;
    throw new Error(getFriendlyAuthMessage(err));
  }
};

export const signInWithEmail = async (email: string, password: string): Promise<User> => {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return mapFirebaseUser(cred.user);
  } catch (error) {
    const err = error as AuthError | Error;
    throw new Error(getFriendlyAuthMessage(err));
  }
};

export const signInWithGoogle = async (idToken: string): Promise<User> => {
  try {
    const credential = GoogleAuthProvider.credential(idToken);
    const cred = await signInWithCredential(auth, credential);
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
    
    // Step 1: Sign out from Firebase
    console.log('🔥 Signing out from Firebase...');
    await signOut(auth);
    console.log('✅ Firebase sign-out successful');
    
    // Step 2: Clear auth storage
    console.log('🧹 Clearing authentication storage...');
    await clearAuthStorage();
    
    // Step 3: Clear user data
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
    
    // Return the updated user object
    return mapFirebaseUser(currentUser);
  } catch (error) {
    const err = error as AuthError | Error;
    throw new Error(`Failed to update profile: ${getFriendlyAuthMessage(err)}`);
  }
};

export const subscribeToAuthChanges = (cb: (user: User | null) => void): AuthListenerUnsubscribe => {
  const unsub = onAuthStateChanged(auth, (fbUser) => {
    cb(fbUser ? mapFirebaseUser(fbUser) : null);
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



