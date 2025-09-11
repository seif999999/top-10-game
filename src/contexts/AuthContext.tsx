import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AuthContextType, User } from '../types';
import { signInWithEmail, signUpWithEmail, signOutUser, subscribeToAuthChanges, getCurrentUser, verifyAuthPersistence, resetPassword as resetPasswordService, signInWithGoogle, updateUserProfile as updateUserProfileService } from '../services/auth';
import AuthService from '../services/authService';
import LocalAvatarStorage from '../services/localAvatarStorage';
import LoadingSpinner from '../components/LoadingSpinner';
import { View } from 'react-native';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [pendingAction, setPendingAction] = useState<boolean>(false);

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
          
          // Load locally stored avatar if available
          try {
            const localAvatarStorage = LocalAvatarStorage.getInstance();
            const localAvatar = await localAvatarStorage.getSelectedAvatar();
            
            if (localAvatar && (!currentUser.selectedAvatar || currentUser.selectedAvatar !== localAvatar)) {
              console.log('🖼️ AuthContext: Loading locally stored avatar:', localAvatar);
              const userWithLocalAvatar = { ...currentUser, selectedAvatar: localAvatar };
              setUser(userWithLocalAvatar);
              
              // Try to sync with server in background
              try {
                await localAvatarStorage.updateUserId(currentUser.uid);
                console.log('✅ AuthContext: Local avatar synced with user ID');
              } catch (syncError) {
                console.warn('⚠️ AuthContext: Failed to sync local avatar with user ID:', syncError);
              }
            } else {
              setUser(currentUser);
            }
          } catch (localError) {
            console.warn('⚠️ AuthContext: Failed to load local avatar:', localError);
            setUser(currentUser);
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
          setLoading(false);
          isInitialized = true;
        } else if (u) {
          // If we already initialized but user changed, update
          console.log('🔄 AuthContext: User changed after initialization');
          setUser(u);
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

  const resetPassword = async (email: string) => {
    setPendingAction(true);
    try {
      await resetPasswordService(email);
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
      
      console.log('✅ AuthContext: Sign-out completed successfully');
    } catch (error) {
      console.error('💥 AuthContext: Sign-out error:', error);
      
      // Even if there's an error, clear the local user state
      // This ensures the user is redirected to login screen
      console.log('🔄 AuthContext: Clearing user state despite error...');
      setUser(null);
      
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
      console.log('🔍 AuthContext: Current user before update:', user ? `ID: ${user.uid}, Email: ${user.email}` : 'None');
      
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
          console.log('✅ AuthContext: Avatar updated locally:', updates.avatarId);
        }
      }
      
      // Try to update server in background (don't block user experience)
      try {
        console.log('🔄 AuthContext: Attempting server sync...');
        const updatedUser = await updateUserProfileService(updates);
        
        // Update local user state with server data if successful
        console.log('✅ AuthContext: Server sync successful');
        console.log('🔍 AuthContext: Updated user:', updatedUser ? `ID: ${updatedUser.uid}, Email: ${updatedUser.email}, Avatar: ${updatedUser.selectedAvatar}` : 'None');
        setUser(updatedUser);
      } catch (serverError) {
        console.warn('⚠️ AuthContext: Server sync failed, but local update succeeded:', serverError);
        // Don't throw error - local update already succeeded
        // User can continue using the app with local avatar
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
      setUser(prevUser => prevUser ? { ...prevUser, selectedAvatar } : null);
      
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


