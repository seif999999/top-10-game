import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AuthContextType, User } from '../types';
import { signInWithEmail, signUpWithEmail, signOutUser, subscribeToAuthChanges } from '../services/auth';
import LoadingSpinner from '../components/LoadingSpinner';
import { View } from 'react-native';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [pendingAction, setPendingAction] = useState<boolean>(false);

  useEffect(() => {
    const unsub = subscribeToAuthChanges((u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const signIn = async (email: string, password: string) => {
    setPendingAction(true);
    try {
      // Test mode - bypass Firebase completely
      if (email === 'test@test.com' && password === 'test123') {
        const testUser: User = {
          id: 'test-user-id',
          email: email,
          displayName: 'Test User',
          createdAt: new Date(),
          stats: {
            gamesPlayed: 0,
            wins: 0,
            totalScore: 0,
            averageScore: 0
          }
        };
        setUser(testUser);
        setLoading(false);
        setPendingAction(false);
        return;
      }
      
      // Try Firebase authentication
      await signInWithEmail(email, password);
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      setPendingAction(false);
    }
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    setPendingAction(true);
    try {
      // Test mode - bypass Firebase completely for any valid registration
      if (email && password && displayName) {
        const testUser: User = {
          id: 'test-user-id-' + Date.now(),
          email: email,
          displayName: displayName,
          createdAt: new Date(),
          stats: {
            gamesPlayed: 0,
            wins: 0,
            totalScore: 0,
            averageScore: 0
          }
        };
        setUser(testUser);
        setLoading(false);
        setPendingAction(false);
        return;
      }
      
      // Try Firebase registration
      await signUpWithEmail(email, password, displayName);
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    } finally {
      setPendingAction(false);
    }
  };

  const signOut = async () => {
    setPendingAction(true);
    try {
      setUser(null);
      await signOutUser();
    } catch (error) {
      console.error('Sign out error:', error);
      // Even if Firebase fails, we still want to sign out locally
      setUser(null);
    } finally {
      setPendingAction(false);
    }
  };

  const value = useMemo<AuthContextType>(
    () => ({ user, loading: loading || pendingAction, signIn, signUp, signOut }),
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


