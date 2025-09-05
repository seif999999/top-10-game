import { 
  getCurrentUser, 
  signInWithEmail, 
  signUpWithEmail, 
  signOutUser,
  subscribeToAuthChanges
} from './auth';
import { User } from '../types';
import { auth } from './firebase';

/**
 * Singleton AuthService class that provides authentication functionality
 * This wraps the existing auth functions in a class-based interface
 */
export class AuthService {
  private static instance: AuthService | null = null;
  private currentUser: User | null = null;
  private authUnsubscribe: (() => void) | null = null;

  private constructor() {
    // Subscribe to auth state changes
    this.authUnsubscribe = subscribeToAuthChanges((user) => {
      this.currentUser = user;
    });
  }

  /**
   * Get the singleton instance of AuthService
   */
  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Ensure the user is authenticated, signs them in anonymously if not
   */
  public async ensureAuthenticated(): Promise<string> {
    try {
      // Check if user is already authenticated
      if (this.currentUser) {
        return this.currentUser.id;
      }

      // Check Firebase auth state
      const firebaseUser = auth.currentUser;
      if (firebaseUser) {
        this.currentUser = {
          id: firebaseUser.uid,
          email: firebaseUser.email ?? '',
          displayName: firebaseUser.displayName ?? undefined,
          createdAt: firebaseUser.metadata?.creationTime ? new Date(firebaseUser.metadata.creationTime) : undefined,
          stats: undefined
        };
        return this.currentUser.id;
      }

      // If no user is authenticated, we need to handle this
      // For now, throw an error - in a real app you might want to redirect to login
      throw new Error('User not authenticated. Please sign in to continue.');
    } catch (error) {
      console.error('Error ensuring authentication:', error);
      throw error;
    }
  }

  /**
   * Get the current user ID
   */
  public getCurrentUserId(): string | null {
    return this.currentUser?.id || null;
  }

  /**
   * Get the current user object
   */
  public getCurrentUser(): User | null {
    return this.currentUser;
  }

  /**
   * Test authentication by checking if user is signed in
   */
  public async testAuthentication(): Promise<boolean> {
    try {
      const userId = await this.ensureAuthenticated();
      return !!userId;
    } catch (error) {
      console.error('Authentication test failed:', error);
      return false;
    }
  }

  /**
   * Sign in with email and password
   */
  public async signInWithEmail(email: string, password: string): Promise<User> {
    try {
      const user = await signInWithEmail(email, password);
      this.currentUser = user;
      return user;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }

  /**
   * Sign up with email and password
   */
  public async signUpWithEmail(email: string, password: string, displayName?: string): Promise<User> {
    try {
      const user = await signUpWithEmail(email, password, displayName);
      this.currentUser = user;
      return user;
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  }

  /**
   * Sign out the current user
   */
  public async signOut(): Promise<void> {
    try {
      await signOutUser();
      this.currentUser = null;
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  /**
   * Check if user is currently authenticated
   */
  public isAuthenticated(): boolean {
    return !!this.currentUser;
  }

  /**
   * Clean up resources
   */
  public cleanup(): void {
    if (this.authUnsubscribe) {
      this.authUnsubscribe();
      this.authUnsubscribe = null;
    }
  }
}

// Export the singleton instance
export default AuthService.getInstance();
