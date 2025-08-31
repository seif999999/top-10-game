import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AuthContextType, User } from '../types';
import { signInWithEmail, signUpWithEmail, signOutUser, subscribeToAuthChanges, resetPassword as resetPasswordService, signInWithGoogle, updateUserProfile as updateUserProfileService } from '../services/auth';
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
    setPendingAction(true);
    try {
      await signInWithEmail(email, password);
    } finally {
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
    setPendingAction(true);
    try {
      await signUpWithEmail(email, password, displayName);
    } finally {
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

  const updateUserProfile = async (displayName: string) => {
    setPendingAction(true);
    try {
      console.log('🔄 AuthContext: Updating user profile...');
      
      // Call the auth service to update the profile
      const updatedUser = await updateUserProfileService(displayName);
      
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

  const value = useMemo<AuthContextType>(
    () => ({ user, loading: loading || pendingAction, signIn, signUp, signOut, resetPassword, signInWithGoogle: signInWithGoogleAuth, updateUserProfile }),
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


