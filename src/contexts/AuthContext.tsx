import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AuthContextType, User } from '../types';
import { signInWithEmail, signUpWithEmail, signOutUser, subscribeToAuthChanges, resetPassword as resetPasswordService } from '../services/auth';
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
      await signInWithEmail(email, password);
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
      await signOutUser();
      setUser(null);
    } finally {
      setPendingAction(false);
    }
  };

  const value = useMemo<AuthContextType>(
    () => ({ user, loading: loading || pendingAction, signIn, signUp, signOut, resetPassword }),
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


