import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
  sendPasswordResetEmail,
  User as FirebaseUser,
  AuthError
} from 'firebase/auth';
import { auth } from './firebase';
import { User } from '../types';

export type AuthListenerUnsubscribe = () => void;

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
    await signOut(auth);
  } catch (error) {
    const err = error as AuthError | Error;
    throw new Error(getFriendlyAuthMessage(err));
  }
};

export const getCurrentUser = (): User | null => {
  return auth.currentUser ? mapFirebaseUser(auth.currentUser) : null;
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



