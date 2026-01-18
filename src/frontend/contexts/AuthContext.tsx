import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AuthContextType, User } from '../../shared/types';
import { signInWithEmail, signUpWithEmail, signOutUser, subscribeToAuthChanges, getCurrentUser, verifyAuthPersistence, resetPassword as resetPasswordService, signInWithGoogle, updateUserProfile as updateUserProfileService, forceReAuthentication } from '../../backend/services/auth';
import { AuthService } from '../../backend/services/authService';
import LocalAvatarStorage from '../../backend/services/localAvatarStorage';
import LocalDisplayNameStorage from '../../backend/services/localDisplayNameStorage';
import LoadingSpinner from '../components/LoadingSpinner';
import { RateLimitService } from '../../backend/services/rateLimitService';
import { View } from 'react-native';
import { logger } from '../../backend/utils/logger';
import { AppError, toAppError } from '../../shared/errors';
import type { AppErrorOptions } from '../../shared/errors';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [pendingAction, setPendingAction] = useState<boolean>(false);

  const buildAuthError = (error: unknown, fallback: AppErrorOptions): AppError => {
    const appError = toAppError(error, fallback);
    logger.error(`❌ AuthContext:${appError.code}`, appError);
    return appError;
  };

  // Sync AuthService with AuthContext user state
  const syncAuthService = (user: User | null) => {
    try {
      const authService = AuthService.getInstance();
      authService.syncWithUser(user);
    } catch (error) {
      logger.warn('⚠️ AuthContext: Failed to sync with AuthService:', error);
    }
  };

  useEffect(() => {
    logger.log('🔐 AuthContext: Setting up authentication...');
    
    let isInitialized = false;
    
    const initializeAuth = async () => {
      try {
        // Add a small delay to allow Firebase to fully initialize
        logger.log('🔍 AuthContext: Waiting for Firebase to initialize...');
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // First, verify authentication persistence is working
        logger.log('🔍 AuthContext: Verifying authentication persistence...');
        const persistenceWorking = await verifyAuthPersistence();
        
        if (!persistenceWorking) {
          logger.warn('⚠️ AuthContext: Authentication persistence verification failed');
        }
        
        // Then, check if user is already authenticated
        logger.log('🔍 AuthContext: Checking for existing authentication...');
        const currentUser = await getCurrentUser();
        
        if (currentUser) {
          logger.log('✅ AuthContext: User already authenticated:', currentUser.email);
          
          // Load locally stored avatar and display name if available, but only if it matches current user
          // First, fetch fresh data from Firestore to ensure we have the latest
          try {
            logger.log('🔄 AuthContext: Fetching fresh user profile from Firestore...');
            const freshUser = await getUserProfileWithAvatar();
            if (freshUser && freshUser.id === currentUser.id) {
              logger.log('✅ AuthContext: Fresh user data loaded, using Firestore data as source of truth');
              setUser(freshUser);
              syncAuthService(freshUser);
            } else {
              // Fallback to current user if fresh fetch fails
              logger.log('⚠️ AuthContext: Fresh fetch failed or user mismatch, using current user');
              setUser(currentUser);
              syncAuthService(currentUser);
            }
          } catch (freshError) {
            logger.warn('⚠️ AuthContext: Failed to fetch fresh profile, using current user:', freshError);
            setUser(currentUser);
            syncAuthService(currentUser);
          }
          
          setLoading(false);
          isInitialized = true;
        } else {
          logger.log('🚪 AuthContext: No existing authentication found');
          setLoading(false);
          isInitialized = true;
        }
      } catch (error) {
        buildAuthError(error, {
          code: 'AUTH_INIT_FAILED',
          message: 'Authentication initialization failed',
          userMessage: 'Unable to initialize authentication. Please try again.'
        });
        setLoading(false);
        isInitialized = true;
      }
      
      // Set up the auth state listener for future changes
      logger.log('🔐 AuthContext: Setting up authentication listener...');
      const unsub = subscribeToAuthChanges(async (u) => {
        logger.log('🔄 AuthContext: Auth state changed:', u ? `User: ${u.email}` : 'No user');
        
        // Only update if we haven't already initialized with getCurrentUser
        if (!isInitialized) {
          logger.log('🔄 AuthContext: Setting loading to false (from listener)');
          setUser(u);
          syncAuthService(u);
          setLoading(false);
          isInitialized = true;
        } else if (u) {
          // If we already initialized but user changed, update and clear old local storage
          logger.log('🔄 AuthContext: User changed after initialization');
          
          // If user ID changed, clear local storage to prevent cross-user data contamination
          if (user && user.id !== u.id) {
            logger.log('🔄 AuthContext: User ID changed, clearing local storage...');
            try {
              const localAvatarStorage = LocalAvatarStorage.getInstance();
              const localDisplayNameStorage = LocalDisplayNameStorage.getInstance();
              await localAvatarStorage.clearSelectedAvatar();
              await localDisplayNameStorage.clearDisplayName();
              logger.log('✅ AuthContext: Local storage cleared for new user');
            } catch (clearError) {
              logger.warn('⚠️ AuthContext: Failed to clear local storage:', clearError);
            }
          }
          
          setUser(u);
          syncAuthService(u);
        } else {
          // User signed out
          logger.log('🔄 AuthContext: User signed out');
          setUser(null);
          syncAuthService(null);
        }
      });
      
      return unsub;
    };
    
    let unsub: (() => void) | undefined;
    
    initializeAuth().then((unsubscribe) => {
      unsub = unsubscribe;
    });
    
    // Add a timeout to ensure loading state doesn't get stuck
    const loadingTimeout = setTimeout(() => {
      if (!isInitialized) {
        logger.log('⏰ AuthContext: Loading timeout reached, setting loading to false');
        setLoading(false);
        isInitialized = true;
      }
    }, 10000); // 10 second timeout
    
    return () => {
      clearTimeout(loadingTimeout);
      if (unsub) {
        unsub();
      }
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    logger.log('🔍 DEBUG: AuthContext signIn called with:', { email, password: password ? '***' : '' });
    setPendingAction(true);
    logger.log('🔍 DEBUG: AuthContext setPendingAction(true)');
    try {
      logger.log('🔍 DEBUG: AuthContext calling signInWithEmail...');
      await signInWithEmail(email, password);
      logger.log('✅ DEBUG: AuthContext signInWithEmail successful');
      
      // After successful sign in, explicitly fetch fresh user data from Firestore
      // This ensures we get the latest avatar and display name, not stale local storage data
      logger.log('🔄 AuthContext: Fetching fresh user profile after sign in...');
      try {
        const freshUser = await getUserProfileWithAvatar();
        if (freshUser) {
          logger.log('✅ AuthContext: Fresh user data loaded:', freshUser.email);
          setUser(freshUser);
          syncAuthService(freshUser);
        }
      } catch (profileError) {
        logger.warn('⚠️ AuthContext: Failed to fetch fresh profile, will rely on auth state listener:', profileError);
        // The auth state listener will update the user data, so this is not critical
      }
    } catch (error) {
      throw buildAuthError(error, {
        code: 'AUTH_SIGNIN_FAILED',
        message: 'Sign in failed',
        userMessage: 'Sign in failed. Please try again.',
        context: { email }
      });
    } finally {
      logger.log('🔍 DEBUG: AuthContext setPendingAction(false)');
      setPendingAction(false);
    }
  };

  const signInWithGoogleAuth = async (idToken: string) => {
    setPendingAction(true);
    try {
      await signInWithGoogle(idToken);
    } finally {
      setPendingAction(false);
    }
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    logger.log('🔍 DEBUG: AuthContext signUp called with:', { email, displayName, password: password ? '***' : '' });
    setPendingAction(true);
    logger.log('🔍 DEBUG: AuthContext setPendingAction(true)');
    try {
      logger.log('🔍 DEBUG: AuthContext calling signUpWithEmail...');
      await signUpWithEmail(email, password, displayName);
      logger.log('✅ DEBUG: AuthContext signUpWithEmail successful');
    } catch (error) {
      throw buildAuthError(error, {
        code: 'AUTH_SIGNUP_FAILED',
        message: 'Sign up failed',
        userMessage: 'Sign up failed. Please try again.',
        context: { email, displayName }
      });
    } finally {
      logger.log('🔍 DEBUG: AuthContext setPendingAction(false)');
      setPendingAction(false);
    }
  };

  /**
   * Initiates password reset process with rate limiting protection
   * 
   * This function provides secure password reset functionality with:
   * - Rate limiting: 3 attempts per email per hour
   * - Input validation through the calling component
   * - User-friendly error messages
   * - Proper loading state management
   * 
   * Security features:
   * - Prevents spam and abuse with rate limiting
   * - Uses email as identifier for rate limiting
   * - Tracks attempts in Firestore for persistence
   * - Provides clear error messages for rate limiting
   * 
   * @param email - The email address to send reset instructions to
   * @throws Error if rate limited or if password reset fails
   */
  const resetPassword = async (email: string) => {
    setPendingAction(true);
    try {
      logger.log('🔐 AuthContext: Starting password reset process for:', email);
      
      // Check rate limiting for password reset requests
      logger.log('🔐 AuthContext: Checking rate limits...');
      const rateLimitResult = await RateLimitService.checkRateLimit(
        email, // Use email as identifier for password reset
        'passwordReset',
        { ipAddress: 'unknown', userAgent: 'mobile' }
      );
      
      logger.log('🔐 AuthContext: Rate limit result:', rateLimitResult);
      
      if (!rateLimitResult.allowed) {
        logger.log('❌ AuthContext: Rate limit exceeded');
        throw new AppError({
          code: 'AUTH_RATE_LIMITED',
          message: rateLimitResult.error || 'Too many password reset attempts.',
          userMessage: rateLimitResult.error || 'Too many password reset attempts. Please try again later.',
          context: { email }
        });
      }
      
      logger.log('✅ AuthContext: Rate limit check passed, calling resetPasswordService...');
      await resetPasswordService(email);
      logger.log('✅ AuthContext: Password reset service completed successfully');
    } catch (error) {
      throw buildAuthError(error, {
        code: 'AUTH_RESET_FAILED',
        message: 'Password reset failed',
        userMessage: 'Failed to send password reset email. Please try again.',
        context: { email }
      });
    } finally {
      setPendingAction(false);
    }
  };

  const signOut = async () => {
    setPendingAction(true);
    try {
      logger.log('🚪 AuthContext: Starting sign-out process...');
      
      // Call the auth service to sign out
      await signOutUser();
      
      // Clear local storage to prevent old data from being used for next user
      logger.log('🧹 AuthContext: Clearing local storage...');
      try {
        const localAvatarStorage = LocalAvatarStorage.getInstance();
        const localDisplayNameStorage = LocalDisplayNameStorage.getInstance();
        await localAvatarStorage.clearSelectedAvatar();
        await localDisplayNameStorage.clearDisplayName();
        logger.log('✅ AuthContext: Local storage cleared');
      } catch (clearError) {
        logger.warn('⚠️ AuthContext: Failed to clear local storage:', clearError);
      }
      
      // Clear local user state
      logger.log('🧹 AuthContext: Clearing local user state...');
      setUser(null);
      syncAuthService(null);
      
      logger.log('✅ AuthContext: Sign-out completed successfully');
    } catch (error) {
      const appError = buildAuthError(error, {
        code: 'AUTH_SIGNOUT_FAILED',
        message: 'Sign out failed',
        userMessage: 'Sign out failed. Please try again.'
      });
      
      // Even if there's an error, clear the local user state and storage
      // This ensures the user is redirected to login screen
      logger.log('🔄 AuthContext: Clearing user state despite error...');
      try {
        const localAvatarStorage = LocalAvatarStorage.getInstance();
        const localDisplayNameStorage = LocalDisplayNameStorage.getInstance();
        await localAvatarStorage.clearSelectedAvatar();
        await localDisplayNameStorage.clearDisplayName();
      } catch (clearError) {
        logger.warn('⚠️ AuthContext: Failed to clear local storage on error:', clearError);
      }
      setUser(null);
      syncAuthService(null);
      
      // Re-throw the error for the UI to handle
      throw appError;
    } finally {
      setPendingAction(false);
    }
  };

  const updateUserProfile = async (updates: { displayName?: string; avatarId?: string }) => {
    setPendingAction(true);
    try {
      logger.log('🔄 AuthContext: Updating user profile...', updates);
      logger.log('🔍 AuthContext: Current user before update:', user ? `ID: ${user.id}, Email: ${user.email}` : 'None');
      
      // If we don't have a user, try to get the current user first
      if (!user) {
        logger.log('🔄 AuthContext: No user in context, attempting to get current user...');
        const currentUser = await getCurrentUser();
        if (currentUser) {
          logger.log('✅ AuthContext: Retrieved current user:', currentUser.email);
          setUser(currentUser);
          syncAuthService(currentUser);
        } else {
          logger.error('❌ AuthContext: No user available for profile update');
          throw new AppError({
            code: 'AUTH_NO_USER',
            message: 'No user is currently signed in',
            userMessage: 'Please sign in again.'
          });
        }
      }
      
      // Ensure we have a valid user with ID
      if (!user || !user.id) {
        logger.error('❌ AuthContext: User missing or invalid ID:', user);
        throw new AppError({
          code: 'AUTH_SESSION_INVALID',
          message: 'User session is invalid',
          userMessage: 'Please sign in again.'
        });
      }
      
      // Handle displayName updates with local storage first
      if (updates.displayName !== undefined) {
        logger.log('📝 AuthContext: Updating display name locally first...');
        
        // Save display name locally immediately for instant persistence
        const localDisplayNameStorage = LocalDisplayNameStorage.getInstance();
        await localDisplayNameStorage.saveDisplayName(updates.displayName);
        
        // Update local user state immediately
        const updatedUser = user ? { ...user, displayName: updates.displayName } : null;
        if (updatedUser) {
          setUser(updatedUser);
          syncAuthService(updatedUser);
          logger.log('✅ AuthContext: Display name updated locally:', updates.displayName);
        }
      }
      
      // Handle avatar updates with local storage first
      if (updates.avatarId !== undefined) {
        logger.log('🖼️ AuthContext: Updating avatar locally first...');
        
        // Save avatar locally immediately for instant persistence
        const localAvatarStorage = LocalAvatarStorage.getInstance();
        await localAvatarStorage.saveSelectedAvatar(updates.avatarId);
        
        // Update local user state immediately
        const updatedUser = user ? { ...user, selectedAvatar: updates.avatarId } : null;
        if (updatedUser) {
          setUser(updatedUser);
          syncAuthService(updatedUser);
          logger.log('✅ AuthContext: Avatar updated locally:', updates.avatarId);
        }
      }
      
      // Try to update server in background (don't block user experience)
      try {
        logger.log('🔄 AuthContext: Attempting server sync...');
        logger.log('🔍 AuthContext: Using user ID for server sync:', user.id);
        const updatedUser = await updateUserProfileService(updates);
        
        // Update local user state with server data if successful
        logger.log('✅ AuthContext: Server sync successful');
        logger.log('🔍 AuthContext: Updated user:', updatedUser ? `ID: ${updatedUser.id}, Email: ${updatedUser.email}, DisplayName: ${updatedUser.displayName}, Avatar: ${updatedUser.selectedAvatar}` : 'None');
        setUser(updatedUser);
        syncAuthService(updatedUser);
      } catch (serverError) {
        logger.warn('⚠️ AuthContext: Server sync failed, but local update succeeded:', serverError);
        
        // If the error is about invalid session, force re-authentication
        if (serverError instanceof Error && (serverError.message.includes('User session is invalid') || serverError.message.includes('Please sign in again'))) {
          logger.log('🔄 AuthContext: Invalid session detected, forcing re-authentication...');
          try {
            await forceReAuthentication();
            setUser(null);
            syncAuthService(null);
            logger.log('✅ AuthContext: Re-authentication completed, user state cleared');
          } catch (reauthError) {
            logger.error('❌ AuthContext: Failed to force re-authentication:', reauthError);
            setUser(null);
            syncAuthService(null);
          }
        }
        
        // Don't throw error - local update already succeeded
        // User can continue using the app with local updates
      }
      
    } catch (error) {
      throw buildAuthError(error, {
        code: 'AUTH_PROFILE_UPDATE_FAILED',
        message: 'Profile update failed',
        userMessage: 'Failed to update profile. Please try again.',
        context: { updates }
      });
    } finally {
      setPendingAction(false);
    }
  };

  const updateUserAvatar = async (selectedAvatar: string | undefined) => {
    setPendingAction(true);
    try {
      logger.log('🔄 AuthContext: Updating user avatar...');
      
      // Save avatar locally immediately
      if (selectedAvatar) {
        const localAvatarStorage = LocalAvatarStorage.getInstance();
        await localAvatarStorage.saveSelectedAvatar(selectedAvatar);
        logger.log('✅ AuthContext: Avatar saved locally:', selectedAvatar);
      }
      
      // Update local user state immediately
      setUser(prevUser => {
        const updatedUser = prevUser ? { ...prevUser, selectedAvatar } : null;
        syncAuthService(updatedUser);
        return updatedUser;
      });
      
      // Try to sync with server in background
      try {
        const authService = AuthService.getInstance();
        await authService.updateUserAvatar(selectedAvatar);
        logger.log('✅ AuthContext: Avatar synced with server');
      } catch (serverError) {
        logger.warn('⚠️ AuthContext: Server sync failed, but local update succeeded:', serverError);
        // Don't throw error - local update already succeeded
      }
      
      logger.log('✅ AuthContext: Avatar updated successfully');
    } catch (error) {
      throw buildAuthError(error, {
        code: 'AUTH_AVATAR_UPDATE_FAILED',
        message: 'Avatar update failed',
        userMessage: 'Failed to update avatar. Please try again.'
      });
    } finally {
      setPendingAction(false);
    }
  };

  const getUserProfileWithAvatar = async (): Promise<User | null> => {
    try {
      logger.log('🔄 AuthContext: Getting user profile with avatar...');
      
      // Call the auth service to get profile with avatar data
      const authService = AuthService.getInstance();
      const profile = await authService.getUserProfileWithAvatar();
      
      // Update local user state
      if (profile) {
        setUser(profile);
        syncAuthService(profile);
      }
      
      logger.log('✅ AuthContext: Profile with avatar retrieved successfully');
      return profile;
    } catch (error) {
      buildAuthError(error, {
        code: 'AUTH_PROFILE_FETCH_FAILED',
        message: 'Profile fetch failed',
        userMessage: 'Failed to load profile. Please try again.'
      });
      return user; // Return current user state if error
    }
  };

  const value = useMemo<AuthContextType>(
    () => ({ user, loading: loading, pendingAction, signIn, signUp, signOut, resetPassword, signInWithGoogle: signInWithGoogleAuth, updateUserProfile, updateUserAvatar, getUserProfileWithAvatar }),
    [user, loading, pendingAction]
  );

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <LoadingSpinner />
      </View>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new AppError({
      code: 'AUTH_CONTEXT_MISSING',
      message: 'useAuth must be used within AuthProvider',
      userMessage: 'Authentication is not available.'
    });
  }
  return ctx;
};


