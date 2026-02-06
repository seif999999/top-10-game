import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import ThemedAlert from '../../utils/themedAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/Button';
import { COLORS, SPACING } from '../../../backend/utils/constants';
import { InputValidator } from '../../../backend/utils/inputValidator';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import type { FirebaseError } from 'firebase/app';
import { auth } from '../../../backend/services/firebase';
import { logger } from '../../../backend/utils/logger';
import type { ResetPasswordScreenProps } from '../../../shared/types/navigation';

/**
 * ResetPasswordScreen Component
 * 
 * Custom password reset screen that enforces app password validation rules
 * This ensures consistency between signup and password reset flows
 * 
 * @param navigation - React Navigation object for screen transitions
 * @param route - Route parameters containing the reset code
 */
const ResetPasswordScreen: React.FC<ResetPasswordScreenProps> = ({ navigation, route }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState<{
    isValid: boolean;
    errors: string[];
    strength: 'weak' | 'medium' | 'strong';
    isTouched: boolean;
  }>({
    isValid: false,
    errors: [],
    strength: 'weak',
    isTouched: false
  });
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  // Get the reset code from route params or URL
  const { oobCode } = route?.params || {};

  // Real-time password validation
  useEffect(() => {
    if (password.trim()) {
      const validation = InputValidator.validatePassword(password.trim());
      setPasswordValidation({
        isValid: validation.valid,
        errors: validation.errors,
        strength: validation.strength,
        isTouched: true
      });
    } else {
      setPasswordValidation({
        isValid: false,
        errors: [],
        strength: 'weak',
        isTouched: false
      });
    }
  }, [password]);

  // Validate password confirmation
  useEffect(() => {
    if (confirmPassword.trim() && password.trim()) {
      if (confirmPassword !== password) {
        setConfirmPasswordError('Passwords do not match');
      } else {
        setConfirmPasswordError('');
      }
    } else {
      setConfirmPasswordError('');
    }
  }, [confirmPassword, password]);

  const handleResetPassword = async () => {
    // Clear previous errors
    setConfirmPasswordError('');

    // Validate password
    if (!password.trim()) {
      ThemedAlert.error('Error', 'Password is required');
      return;
    }

    if (!passwordValidation.isValid) {
      ThemedAlert.error('Error', passwordValidation.errors[0] || 'Password does not meet requirements');
      return;
    }

    // Validate password confirmation
    if (!confirmPassword.trim()) {
      ThemedAlert.error('Error', 'Please confirm your password');
      return;
    }

    if (confirmPassword !== password) {
      setConfirmPasswordError('Passwords do not match');
      ThemedAlert.error('Error', 'Passwords do not match');
      return;
    }

    if (!oobCode) {
      ThemedAlert.error('Error', 'Invalid reset link. Please request a new password reset.');
      navigation.navigate('ForgotPassword');
      return;
    }

    setLoading(true);

    try {
      // Verify the reset code first
      await verifyPasswordResetCode(auth, oobCode);
      
      // Reset the password
      await confirmPasswordReset(auth, oobCode, password);
      
      ThemedAlert.success(
        'Success!', 
        'Your password has been reset successfully. You can now sign in with your new password.',
        [
          {
            text: 'Sign In',
            onPress: () => navigation.navigate('Login')
          }
        ]
      );
    } catch (error: unknown) {
      logger.error('Password reset error:', error);

      const firebaseError = error as FirebaseError | null;
      let errorMessage = 'Failed to reset password. Please try again.';
      const errorCode = firebaseError?.code;

      if (errorCode === 'auth/invalid-action-code') {
        errorMessage = 'This reset link has expired or is invalid. Please request a new password reset.';
      } else if (errorCode === 'auth/expired-action-code') {
        errorMessage = 'This reset link has expired. Please request a new password reset.';
      } else if (errorCode === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please choose a stronger password.';
      }
      
      ThemedAlert.error('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = passwordValidation.isValid && 
                     confirmPassword.trim() === password.trim() && 
                     confirmPassword.trim() !== '';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Reset Your Password</Text>
        <Text style={styles.subtitle}>
          Enter your new password below. Make sure it meets all the requirements.
        </Text>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>New Password</Text>
            <TextInput
              style={[
                styles.input,
                passwordValidation.isTouched && !passwordValidation.isValid && styles.inputError,
                passwordValidation.isTouched && passwordValidation.isValid && styles.inputSuccess
              ]}
              placeholder="Enter new password"
              placeholderTextColor={COLORS.muted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!loading}
            />
            {passwordValidation.errors.length > 0 && (
              <Text style={styles.errorText}>{passwordValidation.errors[0]}</Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              style={[
                styles.input,
                confirmPasswordError && styles.inputError,
                confirmPassword.trim() === password.trim() && confirmPassword.trim() !== '' && styles.inputSuccess
              ]}
              placeholder="Confirm new password"
              placeholderTextColor={COLORS.muted}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              editable={!loading}
            />
            {confirmPasswordError && (
              <Text style={styles.errorText}>{confirmPasswordError}</Text>
            )}
          </View>

          <View style={styles.requirementsContainer}>
            <Text style={styles.requirementsTitle}>Password Requirements:</Text>
            <View style={styles.requirementsList}>
              <Text style={[
                styles.requirement,
                password.length >= 8 && styles.requirementMet
              ]}>
                • At least 8 characters long
              </Text>
              <Text style={[
                styles.requirement,
                /[A-Z]/.test(password) && styles.requirementMet
              ]}>
                • At least one uppercase letter (A-Z)
              </Text>
              <Text style={[
                styles.requirement,
                /[a-z]/.test(password) && styles.requirementMet
              ]}>
                • At least one lowercase letter (a-z)
              </Text>
              <Text style={[
                styles.requirement,
                /\d/.test(password) && styles.requirementMet
              ]}>
                • At least one number (0-9)
              </Text>
              <Text style={[
                styles.requirement,
                /[!@#$%^&*(),.?":{}|<>]/.test(password) && styles.requirementMet
              ]}>
                • At least one special character (!@#$%^&*)
              </Text>
            </View>
          </View>

          <Button
            title={loading ? 'Resetting Password...' : 'Reset Password'}
            onPress={handleResetPassword}
            disabled={!isFormValid || loading}
            style={[
              styles.button,
              !isFormValid && styles.buttonDisabled
            ]}
          />

          <Button
            title="Back to Sign In"
            onPress={() => navigation.navigate('Login')}
            style={styles.secondaryButton}
            disabled={loading}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: SPACING.xl,
    justifyContent: 'center',
  },
  title: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  subtitle: {
    color: COLORS.muted,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: 24,
  },
  form: {
    gap: SPACING.lg,
  },
  inputContainer: {
    gap: SPACING.sm,
  },
  label: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: SPACING.md,
    fontSize: 16,
    color: COLORS.text,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  inputSuccess: {
    borderColor: COLORS.success,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 4,
  },
  requirementsContainer: {
    backgroundColor: COLORS.cardBackground,
    padding: SPACING.lg,
    borderRadius: 12,
    marginVertical: SPACING.md,
  },
  requirementsTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  requirementsList: {
    gap: SPACING.xs,
  },
  requirement: {
    color: COLORS.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  requirementMet: {
    color: COLORS.success,
  },
  button: {
    marginTop: SPACING.md,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
});

export default ResetPasswordScreen;
