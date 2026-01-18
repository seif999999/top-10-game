import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert, ActivityIndicator, View } from 'react-native';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { signInWithGoogle as googleAuth } from '../../backend/services/googleAuth';
import { COLORS, SPACING } from '../../backend/utils/constants';
import { logger } from '../../backend/utils/logger';
import { AppError, toAppError } from '../../shared/errors';

interface GoogleSignInButtonProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
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
      logger.log('🔐 GoogleSignInButton: Starting Google OAuth flow...');
      
      // Start Google OAuth flow
      const result = await googleAuth();
      
      logger.log('🔐 GoogleSignInButton: OAuth result:', result ? 'Success' : 'Failed');
      
      if (result && result.idToken) {
        logger.log('🔐 GoogleSignInButton: Signing in to Firebase with ID token...');
        // Sign in to Firebase with the Google ID token
        await signInWithGoogle(result.idToken);
        
        logger.log('✅ GoogleSignInButton: Firebase sign-in successful');
        
        // Call success callback
        if (onSuccess) {
          onSuccess();
        }
      } else {
        throw new AppError({
          code: 'GOOGLE_SIGNIN_NO_TOKEN',
          message: 'Google authentication failed - no ID token received',
          userMessage: 'Google sign-in failed. Please try again.'
        });
      }
    } catch (error) {
      const appError = toAppError(error, {
        code: 'GOOGLE_SIGNIN_FAILED',
        message: 'Google sign-in failed',
        userMessage: 'Google sign-in failed. Please try again.'
      });
      logger.error('❌ GoogleSignInButton: Error:', appError);
      const errorMessage = appError.userMessage ?? appError.message;
      
      // Call error callback
      if (onError) {
        onError(errorMessage);
      } else {
        // Show default error alert
        Alert.alert('Sign-In Error', errorMessage);
      }
    } finally {
      logger.log('🔐 GoogleSignInButton: Setting loading to false');
      setIsLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={handleGoogleSignIn}
      disabled={isLoading}
      activeOpacity={0.7}
    >
      {isLoading ? (
        <ActivityIndicator color={COLORS.text} size="small" />
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
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    marginVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  googleIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4285F4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
    shadowColor: '#4285F4',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  googleIconText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  text: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default GoogleSignInButton;
