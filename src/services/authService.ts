import { 
  getCurrentUser, 
  signInWithEmail, 
  signUpWithEmail, 
  signOutUser,
  subscribeToAuthChanges
} from './auth';
import { User } from '../types';
import { auth } from './firebase';
import UserProfileService from './userProfileService';

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
      console.log('🔍 AuthService.ensureAuthenticated: Starting authentication check...');
      
      // Check if user is already authenticated in AuthService
      if (this.currentUser) {
        console.log('✅ AuthService.ensureAuthenticated: User already authenticated in AuthService:', this.currentUser.email);
        return this.currentUser.id;
      }

      // Check Firebase auth state directly
      const firebaseUser = auth.currentUser;
      console.log('🔍 AuthService.ensureAuthenticated: Firebase user:', firebaseUser ? `ID: ${firebaseUser.uid}, Email: ${firebaseUser.email}` : 'None');
      
      if (firebaseUser) {
        console.log('🔄 AuthService.ensureAuthenticated: Firebase user found, loading profile...');
        
        // Load user profile with avatar data from Firestore
        try {
          const userProfile = await UserProfileService.getUserProfile(firebaseUser.uid);
          
          if (userProfile) {
            console.log('✅ AuthService.ensureAuthenticated: User profile loaded from Firestore');
            this.currentUser = {
              ...userProfile,
              email: firebaseUser.email || userProfile.email || '',
              displayName: userProfile.displayName || firebaseUser.displayName || undefined
            };
          } else {
            console.log('⚠️ AuthService.ensureAuthenticated: No user profile found, using Firebase user data');
            this.currentUser = {
              id: firebaseUser.uid,
              email: firebaseUser.email ?? '',
              displayName: firebaseUser.displayName ?? undefined,
              createdAt: firebaseUser.metadata?.creationTime ? new Date(firebaseUser.metadata.creationTime) : undefined,
              stats: undefined
            };
          }
          
          console.log('✅ AuthService.ensureAuthenticated: User authenticated successfully:', this.currentUser.email);
          return this.currentUser.id;
        } catch (profileError) {
          console.error('❌ AuthService.ensureAuthenticated: Error loading user profile:', profileError);
          console.log('🔄 AuthService.ensureAuthenticated: Falling back to basic Firebase user data');
          
          this.currentUser = {
            id: firebaseUser.uid,
            email: firebaseUser.email ?? '',
            displayName: firebaseUser.displayName ?? undefined,
            createdAt: firebaseUser.metadata?.creationTime ? new Date(firebaseUser.metadata.creationTime) : undefined,
            stats: undefined
          };
          
          console.log('✅ AuthService.ensureAuthenticated: User authenticated with fallback data:', this.currentUser.email);
          return this.currentUser.id;
        }
      }

      // If no user is authenticated, try to get current user from auth service
      console.log('🔄 AuthService.ensureAuthenticated: No Firebase user, trying getCurrentUser...');
      try {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          console.log('✅ AuthService.ensureAuthenticated: User retrieved from getCurrentUser:', currentUser.email);
          this.currentUser = currentUser;
          return this.currentUser.id;
        }
      } catch (getCurrentUserError) {
        console.error('❌ AuthService.ensureAuthenticated: getCurrentUser failed:', getCurrentUserError);
      }

      // If no user is authenticated, we need to handle this
      console.error('❌ AuthService.ensureAuthenticated: No user found in any authentication method');
      throw new Error('User not authenticated. Please sign in to continue.');
    } catch (error) {
      console.error('❌ AuthService.ensureAuthenticated: Error ensuring authentication:', error);
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
   * Sync with external user state (e.g., from AuthContext)
   * This helps resolve race conditions between AuthService and AuthContext
   */
  public syncWithUser(user: User | null): void {
    if (user && (!this.currentUser || this.currentUser.id !== user.id)) {
      console.log('🔄 AuthService: Syncing with external user state:', user.email);
      this.currentUser = user;
    }
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
   * Update user avatar selection
   */
  public async updateUserAvatar(selectedAvatar: string | undefined): Promise<void> {
    try {
      if (!this.currentUser) {
        throw new Error('No user is currently signed in');
      }

      // Update Firestore profile
      await UserProfileService.updateUserAvatar(this.currentUser.id, selectedAvatar);
      
      // Update local user state
      this.currentUser.selectedAvatar = selectedAvatar;
      if (!selectedAvatar) {
        this.currentUser.avatarUrl = undefined;
      }
      
      console.log(`Avatar updated for user ${this.currentUser.id}: ${selectedAvatar || 'none'}`);
    } catch (error) {
      console.error('Error updating user avatar:', error);
      throw error;
    }
  }

  /**
   * Get user profile with avatar data from Firestore
   */
  public async getUserProfileWithAvatar(): Promise<User | null> {
    try {
      if (!this.currentUser) {
        return null;
      }

      // Get profile from Firestore (includes avatar data)
      const profile = await UserProfileService.getUserProfile(this.currentUser.id);
      
      if (profile) {
        // Update local user state with Firestore data
        this.currentUser = profile;
      }
      
      return this.currentUser;
    } catch (error) {
      console.error('Error getting user profile with avatar:', error);
      return this.currentUser; // Return local state if Firestore fails
    }
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
