import { 
  getCurrentUser, 
  signInWithEmail, 
  signUpWithEmail, 
  signOutUser,
  subscribeToAuthChanges
} from './auth';
import { User } from '../../shared/types';
import { auth } from './firebase';
import UserProfileService from './userProfileService';
import { logger } from '../utils/logger';

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
      logger.log('🔍 AuthService.ensureAuthenticated: Starting authentication check...');
      
      // Reject cached user if it no longer matches Firebase (e.g. account switch race)
      const firebaseUserEarly = auth.currentUser;
      if (this.currentUser && firebaseUserEarly && this.currentUser.id !== firebaseUserEarly.uid) {
        logger.warn('⚠️ AuthService.ensureAuthenticated: Cached user id ≠ Firebase uid, clearing cache');
        this.currentUser = null;
      }

      if (this.currentUser && firebaseUserEarly && this.currentUser.id === firebaseUserEarly.uid) {
        logger.log('✅ AuthService.ensureAuthenticated: User already authenticated in AuthService:', this.currentUser.email);
        return this.currentUser.id;
      }

      // Check Firebase auth state directly
      const firebaseUser = auth.currentUser;
      logger.log('🔍 AuthService.ensureAuthenticated: Firebase user:', firebaseUser ? `ID: ${firebaseUser.uid}, Email: ${firebaseUser.email}` : 'None');
      
      if (firebaseUser) {
        logger.log('🔄 AuthService.ensureAuthenticated: Firebase user found, loading profile...');
        
        // Load user profile with avatar data from Firestore
        try {
          const userProfile = await UserProfileService.getUserProfile(firebaseUser.uid);
          
          if (userProfile) {
            logger.log('✅ AuthService.ensureAuthenticated: User profile loaded from Firestore');
            this.currentUser = {
              ...userProfile,
              email: firebaseUser.email || userProfile.email || '',
              displayName: userProfile.displayName || firebaseUser.displayName || undefined
            };
          } else {
            logger.log('⚠️ AuthService.ensureAuthenticated: No user profile found, using Firebase user data');
            this.currentUser = {
              id: firebaseUser.uid,
              email: firebaseUser.email ?? '',
              displayName: firebaseUser.displayName ?? undefined,
              createdAt: firebaseUser.metadata?.creationTime ? new Date(firebaseUser.metadata.creationTime) : undefined,
              stats: undefined
            };
          }
          
          logger.log('✅ AuthService.ensureAuthenticated: User authenticated successfully:', this.currentUser.email);
          return this.currentUser.id;
        } catch (profileError) {
          logger.error('❌ AuthService.ensureAuthenticated: Error loading user profile:', profileError);
          logger.log('🔄 AuthService.ensureAuthenticated: Falling back to basic Firebase user data');
          
          this.currentUser = {
            id: firebaseUser.uid,
            email: firebaseUser.email ?? '',
            displayName: firebaseUser.displayName ?? undefined,
            createdAt: firebaseUser.metadata?.creationTime ? new Date(firebaseUser.metadata.creationTime) : undefined,
            stats: undefined
          };
          
          logger.log('✅ AuthService.ensureAuthenticated: User authenticated with fallback data:', this.currentUser.email);
          return this.currentUser.id;
        }
      }

      // If no user is authenticated, try to get current user from auth service
      logger.log('🔄 AuthService.ensureAuthenticated: No Firebase user, trying getCurrentUser...');
      try {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          logger.log('✅ AuthService.ensureAuthenticated: User retrieved from getCurrentUser:', currentUser.email);
          this.currentUser = currentUser;
          return this.currentUser.id;
        }
      } catch (getCurrentUserError) {
        logger.error('❌ AuthService.ensureAuthenticated: getCurrentUser failed:', getCurrentUserError);
      }

      // If no user is authenticated, we need to handle this
      logger.error('❌ AuthService.ensureAuthenticated: No user found in any authentication method');
      throw new Error('User not authenticated. Please sign in to continue.');
    } catch (error) {
      logger.error('❌ AuthService.ensureAuthenticated: Error ensuring authentication:', error);
      throw error;
    }
  }

  /**
   * Get the current user ID
   */
  public getCurrentUserId(): string | null {
    return auth.currentUser?.uid ?? this.currentUser?.id ?? null;
  }

  /**
   * Get the current user object
   */
  public getCurrentUser(): User | null {
    return this.currentUser;
  }

  /**
   * Sync with external user state (e.g., from AuthContext)
   * Firebase Auth uid is source of truth — never adopt a React user whose id ≠ auth.currentUser.uid.
   */
  public syncWithUser(user: User | null): void {
    const fu = auth.currentUser;

    if (fu && this.currentUser && this.currentUser.id !== fu.uid) {
      logger.warn('⚠️ AuthService: Clearing stale currentUser (id mismatch vs Firebase)', {
        staleId: this.currentUser.id,
        firebaseUid: fu.uid,
      });
      this.currentUser = null;
    }

    if (user == null) {
      if (!fu) {
        this.currentUser = null;
      }
      return;
    }

    if (fu && user.id !== fu.uid) {
      logger.warn('⚠️ AuthService: Skipping sync — AuthContext user id does not match Firebase', {
        contextUserId: user.id,
        firebaseUid: fu.uid,
      });
      return;
    }

    if (!this.currentUser || this.currentUser.id !== user.id) {
      logger.log('🔄 AuthService: Syncing with external user state:', user.email);
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
      logger.error('Authentication test failed:', error);
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
      logger.error('Sign in error:', error);
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
      logger.error('Sign up error:', error);
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
      logger.error('Sign out error:', error);
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
      const fu = auth.currentUser;
      if (!fu) {
        throw new Error('No user is currently signed in');
      }

      await UserProfileService.updateUserAvatar(fu.uid, selectedAvatar);

      if (!this.currentUser || this.currentUser.id !== fu.uid) {
        this.currentUser = {
          id: fu.uid,
          email: fu.email ?? '',
          displayName: fu.displayName ?? undefined,
          createdAt: fu.metadata?.creationTime ? new Date(fu.metadata.creationTime) : undefined,
          stats: undefined,
        };
      }
      this.currentUser.selectedAvatar = selectedAvatar;
      if (!selectedAvatar) {
        this.currentUser.avatarUrl = undefined;
      }

      logger.log(`Avatar updated for user ${fu.uid}: ${selectedAvatar || 'none'}`);
    } catch (error) {
      logger.error('Error updating user avatar:', error);
      throw error;
    }
  }

  /**
   * Get user profile with avatar data from Firestore
   */
  public async getUserProfileWithAvatar(): Promise<User | null> {
    const fu = auth.currentUser;
    if (!fu) {
      return null;
    }

    if (this.currentUser && this.currentUser.id !== fu.uid) {
      this.currentUser = null;
    }

    try {
      const profile = await UserProfileService.getUserProfile(fu.uid);

      if (profile) {
        this.currentUser = {
          ...profile,
          email: fu.email || profile.email || '',
          displayName: profile.displayName || fu.displayName || undefined,
        };
        return this.currentUser;
      }

      this.currentUser = {
        id: fu.uid,
        email: fu.email ?? '',
        displayName: fu.displayName ?? undefined,
        createdAt: fu.metadata?.creationTime ? new Date(fu.metadata.creationTime) : undefined,
        stats: undefined,
      };
      return this.currentUser;
    } catch (error) {
      logger.error('Error getting user profile with avatar:', error);
      this.currentUser = {
        id: fu.uid,
        email: fu.email ?? '',
        displayName: fu.displayName ?? undefined,
        createdAt: fu.metadata?.creationTime ? new Date(fu.metadata.creationTime) : undefined,
        stats: undefined,
      };
      return this.currentUser;
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
