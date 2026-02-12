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
import useAppTranslation from '../../../hooks/useTranslation';

const ResetPasswordScreen: React.FC<ResetPasswordScreenProps> = ({ navigation, route }) => {
  const { t: tScreens } = useAppTranslation('screens');
  const { t: tErrors } = useAppTranslation('errors');
  const { t: tCommon } = useAppTranslation('common');
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

  const { oobCode } = route?.params || {};

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

  useEffect(() => {
    if (confirmPassword.trim() && password.trim()) {
      if (confirmPassword !== password) {
        setConfirmPasswordError(tErrors('validation.passwordsDoNotMatch'));
      } else {
        setConfirmPasswordError('');
      }
    } else {
      setConfirmPasswordError('');
    }
  }, [confirmPassword, password, tErrors]);

  const handleResetPassword = async () => {
    setConfirmPasswordError('');

    if (!password.trim()) {
      ThemedAlert.error(tErrors('general'), tErrors('validation.passwordRequired'));
      return;
    }

    if (!passwordValidation.isValid) {
      ThemedAlert.error(tErrors('general'), passwordValidation.errors[0] || tErrors('validation.passwordDoesNotMeetRequirements'));
      return;
    }

    if (!confirmPassword.trim()) {
      ThemedAlert.error(tErrors('general'), tErrors('validation.pleaseConfirmPassword'));
      return;
    }

    if (confirmPassword !== password) {
      setConfirmPasswordError(tErrors('validation.passwordsDoNotMatch'));
      ThemedAlert.error(tErrors('general'), tErrors('validation.passwordsDoNotMatch'));
      return;
    }

    if (!oobCode) {
      ThemedAlert.error(tErrors('general'), tScreens('auth.resetPasswordScreen.invalidResetLink'));
      navigation.navigate('ForgotPassword');
      return;
    }

    setLoading(true);

    try {
      await verifyPasswordResetCode(auth, oobCode);
      await confirmPasswordReset(auth, oobCode, password);
      
      ThemedAlert.success(
        tScreens('auth.resetPasswordScreen.successTitle'), 
        tScreens('auth.resetPasswordScreen.successMessage'),
        [
          {
            text: tScreens('auth.signIn'),
            onPress: () => navigation.navigate('Login')
          }
        ]
      );
    } catch (error: unknown) {
      logger.error('Password reset error:', error);

      const firebaseError = error as FirebaseError | null;
      let errorMessage = tScreens('auth.resetPasswordScreen.resetFailed');
      const errorCode = firebaseError?.code;

      if (errorCode === 'auth/invalid-action-code') {
        errorMessage = tScreens('auth.resetPasswordScreen.expiredResetLink');
      } else if (errorCode === 'auth/expired-action-code') {
        errorMessage = tScreens('auth.resetPasswordScreen.expiredCode');
      } else if (errorCode === 'auth/weak-password') {
        errorMessage = tScreens('auth.resetPasswordScreen.weakPassword');
      }
      
      ThemedAlert.error(tErrors('general'), errorMessage);
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
        <Text style={styles.title}>{tScreens('auth.resetPasswordScreen.title')}</Text>
        <Text style={styles.subtitle}>
          {tScreens('auth.resetPasswordScreen.subtitle')}
        </Text>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>{tScreens('auth.resetPasswordScreen.newPassword')}</Text>
            <TextInput
              style={[
                styles.input,
                passwordValidation.isTouched && !passwordValidation.isValid && styles.inputError,
                passwordValidation.isTouched && passwordValidation.isValid && styles.inputSuccess
              ]}
              placeholder={tScreens('auth.resetPasswordScreen.enterNewPassword')}
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
            <Text style={styles.label}>{tScreens('auth.confirmPassword')}</Text>
            <TextInput
              style={[
                styles.input,
                confirmPasswordError && styles.inputError,
                confirmPassword.trim() === password.trim() && confirmPassword.trim() !== '' && styles.inputSuccess
              ]}
              placeholder={tScreens('auth.resetPasswordScreen.confirmNewPassword')}
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
            <Text style={styles.requirementsTitle}>{tScreens('auth.passwordResetSuccess.requirementsTitle')}</Text>
            <View style={styles.requirementsList}>
              <Text style={[
                styles.requirement,
                password.length >= 8 && styles.requirementMet
              ]}>
                • {tScreens('auth.passwordResetSuccess.requirements.length')}
              </Text>
              <Text style={[
                styles.requirement,
                /[A-Z]/.test(password) && styles.requirementMet
              ]}>
                • {tScreens('auth.passwordResetSuccess.requirements.uppercase')}
              </Text>
              <Text style={[
                styles.requirement,
                /[a-z]/.test(password) && styles.requirementMet
              ]}>
                • {tScreens('auth.passwordResetSuccess.requirements.lowercase')}
              </Text>
              <Text style={[
                styles.requirement,
                /\d/.test(password) && styles.requirementMet
              ]}>
                • {tScreens('auth.passwordResetSuccess.requirements.number')}
              </Text>
              <Text style={[
                styles.requirement,
                /[!@#$%^&*(),.?":{}|<>]/.test(password) && styles.requirementMet
              ]}>
                • {tScreens('auth.passwordResetSuccess.requirements.special')}
              </Text>
            </View>
          </View>

          <Button
            title={loading ? tScreens('auth.resetPasswordScreen.resettingPassword') : tScreens('auth.resetPassword')}
            onPress={handleResetPassword}
            disabled={!isFormValid || loading}
            style={[
              styles.button,
              !isFormValid && styles.buttonDisabled
            ]}
          />

          <Button
            title={tScreens('auth.resetPasswordScreen.backToSignIn')}
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
