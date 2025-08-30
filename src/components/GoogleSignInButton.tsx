import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert, ActivityIndicator, View } from 'react-native';
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
        <ActivityIndicator color="#5F6368" size="small" />
      ) : (
        <>
          <View style={styles.googleIcon}>
            <Text style={styles.googleIconText}>G</Text>
          </View>
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
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    marginVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: '#DADCE0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  googleIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4285F4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  googleIconText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  text: {
    color: '#5F6368',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default GoogleSignInButton;
