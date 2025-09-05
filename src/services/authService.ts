import { signInAnonymously } from 'firebase/auth';
import { auth } from './firebase';

export class AuthService {
  private static instance: AuthService;
  
  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Ensure user is authenticated before any multiplayer operations
   */
  async ensureAuthenticated(): Promise<string> {
    try {
      let user = auth.currentUser;
      
      if (!user) {
        console.log('No user found, signing in anonymously...');
        const userCredential = await signInAnonymously(auth);
        user = userCredential.user;
      }
      
      if (!user?.uid) {
        throw new Error('Failed to authenticate user');
      }
      
      console.log('User authenticated:', user.uid);
      return user.uid;
    } catch (error) {
      console.error('Authentication error:', error);
      throw new Error('Failed to authenticate user');
    }
  }

  /**
   * Get current user ID (returns null if not authenticated)
   */
  getCurrentUserId(): string | null {
    return auth.currentUser?.uid || null;
  }

  /**
   * Check if user is currently authenticated
   */
  isAuthenticated(): boolean {
    return !!auth.currentUser;
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    try {
      await auth.signOut();
      console.log('User signed out successfully');
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  /**
   * Wait for auth state to be ready
   */
  async waitForAuthReady(): Promise<void> {
    return new Promise((resolve) => {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        unsubscribe();
        resolve();
      });
    });
  }

  /**
   * Test authentication and basic Firestore write
   */
  async testAuthentication(): Promise<void> {
    try {
      console.log('🔍 Testing Firebase Auth...');
      
      // Check if user exists
      let user = auth.currentUser;
      console.log('Current user:', user?.uid);
      
      if (!user) {
        console.log('No user found, signing in anonymously...');
        const result = await signInAnonymously(auth);
        user = result.user;
        console.log('Anonymous sign-in successful:', user.uid);
      }
      
      // Test basic Firestore write with authenticated user
      console.log('Testing Firestore write...');
      const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('./firebase');
      
      await setDoc(doc(db, 'authTest', 'test'), {
        userId: user.uid,
        timestamp: serverTimestamp(),
        test: true
      });
      
      console.log('✅ Auth and Firestore test successful!');
      
    } catch (error) {
      console.error('❌ Auth test failed:', error);
      throw error;
    }
  }
}
