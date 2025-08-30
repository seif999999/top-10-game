import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { signInWithGoogle as googleAuth } from '../services/googleAuth';
import { COLORS, SPACING } from '../utils/constants';

interface GoogleSignInButtonProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  style?: any;
  textStyle?: any;
}

const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onSuccess,
  onError,
  style,
  textStyle
}) => {
  const { signInWithGoogle } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      // Start Google OAuth flow
      const result = await googleAuth();
      
      if (result && result.idToken) {
        // Sign in to Firebase with the Google ID token
        await signInWithGoogle(result.idToken);
        
        // Call success callback
        if (onSuccess) {
          onSuccess();
        }
      } else {
        throw new Error('Google authentication failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Google sign-in failed';
      
      // Call error callback
      if (onError) {
        onError(errorMessage);
      } else {
        // Show default error alert
        Alert.alert('Sign-In Error', errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={handleGoogleSignIn}
      disabled={isLoading}
      activeOpacity={0.8}
    >
      {isLoading ? (
        <ActivityIndicator color={COLORS.background} size="small" />
      ) : (
        <>
          <Text style={[styles.icon, textStyle]}>🔍</Text>
          <Text style={[styles.text, textStyle]}>
            Sign in with Google
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4285F4', // Google Blue
    borderRadius: 8,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    marginVertical: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  icon: {
    fontSize: 20,
    marginRight: SPACING.sm,
  },
  text: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default GoogleSignInButton;
