import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AuthContextType, User } from '../types';
import { signInWithEmail, signUpWithEmail, signOutUser, subscribeToAuthChanges, resetPassword as resetPasswordService, signInWithGoogle, updateUserProfile as updateUserProfileService } from '../services/auth';
import AuthService from '../services/authService';
import LoadingSpinner from '../components/LoadingSpinner';
import { View } from 'react-native';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [pendingAction, setPendingAction] = useState<boolean>(false);

  useEffect(() => {
    const unsub = subscribeToAuthChanges((u) => {
      console.log('🔄 Auth state changed:', u ? `User: ${u.email}` : 'No user');
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
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
      
      // Call the auth service to update the profile
      const updatedUser = await updateUserProfileService(updates);
      
      // Update local user state with the new data
      console.log('✅ AuthContext: Profile updated successfully');
      setUser(updatedUser);
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
      
      // Call the auth service to update the avatar
      await AuthService.updateUserAvatar(selectedAvatar);
      
      // Update local user state
      setUser(prevUser => prevUser ? { ...prevUser, selectedAvatar } : null);
      
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


