import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
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
  const message = 'Authentication failed. Please check your details and try again.';
  if ((error as AuthError).code) {
    const code = (error as AuthError).code;
    if (code.includes('auth/invalid-credential')) return 'Invalid email or password.';
    if (code.includes('auth/email-already-in-use')) return 'Email already in use.';
    if (code.includes('auth/weak-password')) return 'Password is too weak.';
    if (code.includes('auth/network-request-failed')) return 'Network error. Try again later.';
    if (code.includes('auth/invalid-email')) return 'Invalid email format.';
    if (code.includes('auth/user-not-found')) return 'No account found with this email.';
    if (code.includes('auth/wrong-password')) return 'Incorrect password.';
  }
  return message;
};



