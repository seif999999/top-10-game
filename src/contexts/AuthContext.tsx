import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AuthContextType, User } from '../types';
import { signInWithEmail, signUpWithEmail, signOutUser, subscribeToAuthChanges, getCurrentUser, verifyAuthPersistence, resetPassword as resetPasswordService, signInWithGoogle, updateUserProfile as updateUserProfileService, forceReAuthentication } from '../services/auth';
import { AuthService } from '../services/authService';
import LocalAvatarStorage from '../services/localAvatarStorage';
import LocalDisplayNameStorage from '../services/localDisplayNameStorage';
import LoadingSpinner from '../components/LoadingSpinner';
import { RateLimitService } from '../services/rateLimitService';
import { View } from 'react-native';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [pendingAction, setPendingAction] = useState<boolean>(false);

  // Sync AuthService with AuthContext user state
  const syncAuthService = (user: User | null) => {
    try {
      const authService = AuthService.getInstance();
      authService.syncWithUser(user);
    } catch (error) {
      console.warn('⚠️ AuthContext: Failed to sync with AuthService:', error);
    }
  };

  useEffect(() => {
    console.log('🔐 AuthContext: Setting up authentication...');
    
    let isInitialized = false;
    
    const initializeAuth = async () => {
      try {
        // Add a small delay to allow Firebase to fully initialize
        console.log('🔍 AuthContext: Waiting for Firebase to initialize...');
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // First, verify authentication persistence is working
        console.log('🔍 AuthContext: Verifying authentication persistence...');
        const persistenceWorking = await verifyAuthPersistence();
        
        if (!persistenceWorking) {
          console.warn('⚠️ AuthContext: Authentication persistence verification failed');
        }
        
        // Then, check if user is already authenticated
        console.log('🔍 AuthContext: Checking for existing authentication...');
        const currentUser = await getCurrentUser();
        
        if (currentUser) {
          console.log('✅ AuthContext: User already authenticated:', currentUser.email);
          
          // Load locally stored avatar and display name if available
          try {
            const localAvatarStorage = LocalAvatarStorage.getInstance();
            const localDisplayNameStorage = LocalDisplayNameStorage.getInstance();
            
            const localAvatar = await localAvatarStorage.getSelectedAvatar();
            const localDisplayName = await localDisplayNameStorage.getDisplayName();
            
            let updatedUser = { ...currentUser };
            let hasLocalUpdates = false;
            
            // Apply local avatar if available
            if (localAvatar && (!currentUser.selectedAvatar || currentUser.selectedAvatar !== localAvatar)) {
              console.log('🖼️ AuthContext: Loading locally stored avatar:', localAvatar);
              updatedUser = { ...updatedUser, selectedAvatar: localAvatar };
              hasLocalUpdates = true;
              
              // Try to sync with server in background
              try {
                await localAvatarStorage.updateUserId(currentUser.id);
                console.log('✅ AuthContext: Local avatar synced with user ID');
              } catch (syncError) {
                console.warn('⚠️ AuthContext: Failed to sync local avatar with user ID:', syncError);
              }
            }
            
            // Apply local display name if available
            if (localDisplayName && (!currentUser.displayName || currentUser.displayName !== localDisplayName)) {
              console.log('📝 AuthContext: Loading locally stored display name:', localDisplayName);
              updatedUser = { ...updatedUser, displayName: localDisplayName };
              hasLocalUpdates = true;
            }
            
            setUser(updatedUser);
            syncAuthService(updatedUser);
            
            if (hasLocalUpdates) {
              console.log('✅ AuthContext: Applied local updates to user profile');
            }
          } catch (localError) {
            console.warn('⚠️ AuthContext: Failed to load local data:', localError);
            setUser(currentUser);
            syncAuthService(currentUser);
          }
          
          setLoading(false);
          isInitialized = true;
        } else {
          console.log('🚪 AuthContext: No existing authentication found');
          setLoading(false);
          isInitialized = true;
        }
      } catch (error) {
        console.error('❌ AuthContext: Error during authentication initialization:', error);
        setLoading(false);
        isInitialized = true;
      }
      
      // Set up the auth state listener for future changes
      console.log('🔐 AuthContext: Setting up authentication listener...');
      const unsub = subscribeToAuthChanges((u) => {
        console.log('🔄 AuthContext: Auth state changed:', u ? `User: ${u.email}` : 'No user');
        
        // Only update if we haven't already initialized with getCurrentUser
        if (!isInitialized) {
          console.log('🔄 AuthContext: Setting loading to false (from listener)');
          setUser(u);
          syncAuthService(u);
          setLoading(false);
          isInitialized = true;
        } else if (u) {
          // If we already initialized but user changed, update
          console.log('🔄 AuthContext: User changed after initialization');
          setUser(u);
          syncAuthService(u);
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
        console.log('⏰ AuthContext: Loading timeout reached, setting loading to false');
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
    console.log('🔍 DEBUG: AuthContext signIn called with:', { email, password: password ? '***' : '' });
    setPendingAction(true);
    console.log('🔍 DEBUG: AuthContext setPendingAction(true)');
    try {
      console.log('🔍 DEBUG: AuthContext calling signInWithEmail...');
      await signInWithEmail(email, password);
      console.log('✅ DEBUG: AuthContext signInWithEmail successful');
    } catch (error) {
      console.error('❌ DEBUG: AuthContext signInWithEmail error:', error);
      throw error;
    } finally {
      console.log('🔍 DEBUG: AuthContext setPendingAction(false)');
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
    console.log('🔍 DEBUG: AuthContext signUp called with:', { email, displayName, password: password ? '***' : '' });
    setPendingAction(true);
    console.log('🔍 DEBUG: AuthContext setPendingAction(true)');
    try {
      console.log('🔍 DEBUG: AuthContext calling signUpWithEmail...');
      await signUpWithEmail(email, password, displayName);
      console.log('✅ DEBUG: AuthContext signUpWithEmail successful');
    } catch (error) {
      console.error('❌ DEBUG: AuthContext signUpWithEmail error:', error);
      throw error;
    } finally {
      console.log('🔍 DEBUG: AuthContext setPendingAction(false)');
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
      console.log('🔐 AuthContext: Starting password reset process for:', email);
      
      // Check rate limiting for password reset requests
      console.log('🔐 AuthContext: Checking rate limits...');
      const rateLimitResult = await RateLimitService.checkRateLimit(
        email, // Use email as identifier for password reset
        'passwordReset',
        { ipAddress: 'unknown', userAgent: 'mobile' }
      );
      
      console.log('🔐 AuthContext: Rate limit result:', rateLimitResult);
      
      if (!rateLimitResult.allowed) {
        console.log('❌ AuthContext: Rate limit exceeded');
        throw new Error(rateLimitResult.error || 'Too many password reset attempts. Please try again later.');
      }
      
      console.log('✅ AuthContext: Rate limit check passed, calling resetPasswordService...');
      await resetPasswordService(email);
      console.log('✅ AuthContext: Password reset service completed successfully');
    } catch (error) {
      console.error('❌ AuthContext: Password reset error:', error);
      throw error;
    } finally {
      setPendingAction(false);
    }
  };

  const signOut = async () => {
    setPendingAction(true);
    try {
      console.log('🚪 AuthContext: Starting sign-out process...');
      
      // Call the auth service to sign out
      await signOutUser();
      
      // Clear local user state
      console.log('🧹 AuthContext: Clearing local user state...');
      setUser(null);
      syncAuthService(null);
      
      console.log('✅ AuthContext: Sign-out completed successfully');
    } catch (error) {
      console.error('💥 AuthContext: Sign-out error:', error);
      
      // Even if there's an error, clear the local user state
      // This ensures the user is redirected to login screen
      console.log('🔄 AuthContext: Clearing user state despite error...');
      setUser(null);
      syncAuthService(null);
      
      // Re-throw the error for the UI to handle
      throw error;
    } finally {
      setPendingAction(false);
    }
  };

  const updateUserProfile = async (updates: { displayName?: string; avatarId?: string }) => {
    setPendingAction(true);
    try {
      console.log('🔄 AuthContext: Updating user profile...', updates);
      console.log('🔍 AuthContext: Current user before update:', user ? `ID: ${user.id}, Email: ${user.email}` : 'None');
      
      // If we don't have a user, try to get the current user first
      if (!user) {
        console.log('🔄 AuthContext: No user in context, attempting to get current user...');
        const currentUser = await getCurrentUser();
        if (currentUser) {
          console.log('✅ AuthContext: Retrieved current user:', currentUser.email);
          setUser(currentUser);
          syncAuthService(currentUser);
        } else {
          console.error('❌ AuthContext: No user available for profile update');
          throw new Error('No user is currently signed in. Please sign in again.');
        }
      }
      
      // Ensure we have a valid user with ID
      if (!user || !user.id) {
        console.error('❌ AuthContext: User missing or invalid ID:', user);
        throw new Error('User session is invalid. Please sign in again.');
      }
      
      // Handle displayName updates with local storage first
      if (updates.displayName !== undefined) {
        console.log('📝 AuthContext: Updating display name locally first...');
        
        // Save display name locally immediately for instant persistence
        const localDisplayNameStorage = LocalDisplayNameStorage.getInstance();
        await localDisplayNameStorage.saveDisplayName(updates.displayName);
        
        // Update local user state immediately
        const updatedUser = user ? { ...user, displayName: updates.displayName } : null;
        if (updatedUser) {
          setUser(updatedUser);
          syncAuthService(updatedUser);
          console.log('✅ AuthContext: Display name updated locally:', updates.displayName);
        }
      }
      
      // Handle avatar updates with local storage first
      if (updates.avatarId !== undefined) {
        console.log('🖼️ AuthContext: Updating avatar locally first...');
        
        // Save avatar locally immediately for instant persistence
        const localAvatarStorage = LocalAvatarStorage.getInstance();
        await localAvatarStorage.saveSelectedAvatar(updates.avatarId);
        
        // Update local user state immediately
        const updatedUser = user ? { ...user, selectedAvatar: updates.avatarId } : null;
        if (updatedUser) {
          setUser(updatedUser);
          syncAuthService(updatedUser);
          console.log('✅ AuthContext: Avatar updated locally:', updates.avatarId);
        }
      }
      
      // Try to update server in background (don't block user experience)
      try {
        console.log('🔄 AuthContext: Attempting server sync...');
        console.log('🔍 AuthContext: Using user ID for server sync:', user.id);
        const updatedUser = await updateUserProfileService(updates);
        
        // Update local user state with server data if successful
        console.log('✅ AuthContext: Server sync successful');
        console.log('🔍 AuthContext: Updated user:', updatedUser ? `ID: ${updatedUser.id}, Email: ${updatedUser.email}, DisplayName: ${updatedUser.displayName}, Avatar: ${updatedUser.selectedAvatar}` : 'None');
        setUser(updatedUser);
        syncAuthService(updatedUser);
      } catch (serverError) {
        console.warn('⚠️ AuthContext: Server sync failed, but local update succeeded:', serverError);
        
        // If the error is about invalid session, force re-authentication
        if (serverError instanceof Error && (serverError.message.includes('User session is invalid') || serverError.message.includes('Please sign in again'))) {
          console.log('🔄 AuthContext: Invalid session detected, forcing re-authentication...');
          try {
            await forceReAuthentication();
            setUser(null);
            syncAuthService(null);
            console.log('✅ AuthContext: Re-authentication completed, user state cleared');
          } catch (reauthError) {
            console.error('❌ AuthContext: Failed to force re-authentication:', reauthError);
            setUser(null);
            syncAuthService(null);
          }
        }
        
        // Don't throw error - local update already succeeded
        // User can continue using the app with local updates
      }
      
    } catch (error) {
      console.error('💥 AuthContext: Profile update error:', error);
      throw error;
    } finally {
      setPendingAction(false);
    }
  };

  const updateUserAvatar = async (selectedAvatar: string | undefined) => {
    setPendingAction(true);
    try {
      console.log('🔄 AuthContext: Updating user avatar...');
      
      // Save avatar locally immediately
      if (selectedAvatar) {
        const localAvatarStorage = LocalAvatarStorage.getInstance();
        await localAvatarStorage.saveSelectedAvatar(selectedAvatar);
        console.log('✅ AuthContext: Avatar saved locally:', selectedAvatar);
      }
      
      // Update local user state immediately
      setUser(prevUser => {
        const updatedUser = prevUser ? { ...prevUser, selectedAvatar } : null;
        syncAuthService(updatedUser);
        return updatedUser;
      });
      
      // Try to sync with server in background
      try {
        await AuthService.updateUserAvatar(selectedAvatar);
        console.log('✅ AuthContext: Avatar synced with server');
      } catch (serverError) {
        console.warn('⚠️ AuthContext: Server sync failed, but local update succeeded:', serverError);
        // Don't throw error - local update already succeeded
      }
      
      console.log('✅ AuthContext: Avatar updated successfully');
    } catch (error) {
      console.error('💥 AuthContext: Avatar update error:', error);
      throw error;
    } finally {
      setPendingAction(false);
    }
  };

  const getUserProfileWithAvatar = async (): Promise<User | null> => {
    try {
      console.log('🔄 AuthContext: Getting user profile with avatar...');
      
      // Call the auth service to get profile with avatar data
      const profile = await AuthService.getUserProfileWithAvatar();
      
      // Update local user state
      if (profile) {
        setUser(profile);
        syncAuthService(profile);
      }
      
      console.log('✅ AuthContext: Profile with avatar retrieved successfully');
      return profile;
    } catch (error) {
      console.error('💥 AuthContext: Get profile with avatar error:', error);
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
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};


