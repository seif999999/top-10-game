import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/Button';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS, SPACING } from '../../../backend/utils/constants';
import { ForgotPasswordScreenProps } from '../../../shared/types/navigation';
import { InputValidator } from '../../../backend/utils/inputValidator';
import { logger } from '../../../backend/utils/logger';
import useAppTranslation from '../../../hooks/useTranslation';

const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ navigation }) => {
  const { resetPassword, loading } = useAuth();
  const { t: tScreens } = useAppTranslation('screens');
  const { t: tErrors } = useAppTranslation('errors');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [emailValidation, setEmailValidation] = useState<{
    isValid: boolean;
    message: string;
    isTouched: boolean;
  }>({
    isValid: false,
    message: '',
    isTouched: false
  });

  useEffect(() => {
    if (email.trim()) {
      const isValid = InputValidator.validateEmail(email.trim());
      setEmailValidation({
        isValid,
        message: isValid ? '' : tErrors('validation.emailInvalid'),
        isTouched: true
      });
    } else {
      setEmailValidation({
        isValid: false,
        message: '',
        isTouched: false
      });
    }
  }, [email, tErrors]);

  const onSubmit = async () => {
    setError(null);
    if (!email.trim()) {
      setError(tErrors('validation.emailRequired'));
      return;
    }
    if (!emailValidation.isValid) {
      setError(emailValidation.message || tErrors('validation.emailInvalid'));
      return;
    }
    const sanitizedEmail = InputValidator.sanitizeText(email.trim(), 254);
    try {
      logger.log('Attempting password reset for:', sanitizedEmail);
      await resetPassword(sanitizedEmail);
      setSent(true);
      setError(null);
      
      setTimeout(() => {
        navigation.navigate('PasswordResetSuccess');
      }, 2000);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to send reset email';
      
      if (errorMessage.includes('Too many password reset attempts')) {
        setError(tScreens('auth.forgotPasswordScreen.rateLimitMessage'));
      } else {
        setError(errorMessage);
      }
      
      setSent(false);
    }
  };

  const isRateLimit = error?.includes(tScreens('auth.forgotPasswordScreen.rateLimitMessage')) || 
                      error?.includes('Too many password reset attempts');

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>{tScreens('auth.forgotPasswordScreen.title')}</Text>
      <Text style={styles.subtitle}>{tScreens('auth.forgotPasswordScreen.subtitle')}</Text>
      
      <View style={styles.infoContainer}>
        <Text style={styles.infoIcon}>📧</Text>
        <Text style={styles.infoText}>
          {tScreens('auth.forgotPasswordScreen.spamNotice')}
        </Text>
      </View>

      <TextInput
        placeholder={tScreens('auth.email')}
        placeholderTextColor={COLORS.muted}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        editable={!loading && !sent}
        style={[
          styles.input, 
          sent && styles.inputDisabled,
          emailValidation.isTouched && !emailValidation.isValid && styles.inputError,
          emailValidation.isTouched && emailValidation.isValid && styles.inputSuccess
        ]}
      />
      {emailValidation.isTouched && !emailValidation.isValid && emailValidation.message ? (
        <Text style={styles.validationError}>{emailValidation.message}</Text>
      ) : null}
      {error ? (
        <View style={[
          styles.errorContainer,
          isRateLimit && styles.rateLimitErrorContainer
        ]}>
          <Text style={[
            styles.error,
            isRateLimit && styles.rateLimitError
          ]}>
            {error}
          </Text>
          {isRateLimit && (
            <Text style={styles.rateLimitSubtext}>
              {tScreens('auth.forgotPasswordScreen.rateLimitSubtext')}
            </Text>
          )}
        </View>
      ) : null}

      <Button 
        title={loading 
          ? tScreens('auth.forgotPasswordScreen.sending') 
          : sent 
            ? tScreens('auth.forgotPasswordScreen.emailSent') 
            : tScreens('auth.forgotPasswordScreen.sendResetEmail')
        } 
        onPress={onSubmit} 
        disabled={loading || sent || (emailValidation.isTouched && !emailValidation.isValid)}
        style={sent ? styles.buttonSuccess : undefined}
      />

      {sent ? (
        <View style={styles.successContainer}>
          <Text style={styles.successIcon}>✓</Text>
          <Text style={styles.success}>{tScreens('auth.forgotPasswordScreen.successTitle')}</Text>
          <Text style={styles.successSubtext}>{tScreens('auth.forgotPasswordScreen.successMessage')}</Text>
        </View>
      ) : null}

      <View style={styles.footer}>
        <TouchableOpacity onPress={() => navigation.navigate('Login')} disabled={loading}>
          <Text style={styles.linkText}>{tScreens('auth.forgotPasswordScreen.backToSignIn')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SPACING.xl,
    gap: SPACING.lg,
    justifyContent: 'center'
  },
  title: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: SPACING.sm
  },
  subtitle: {
    color: COLORS.muted,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: SPACING.md
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    padding: SPACING.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    marginBottom: SPACING.lg
  },
  infoIcon: {
    fontSize: 16,
    marginRight: SPACING.sm,
    marginTop: 2
  },
  infoText: {
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 20,
    flex: 1
  },
  error: {
    color: '#f87171',
    fontSize: 12,
    marginTop: 4
  },
  validationError: {
    color: '#f87171',
    fontSize: 12,
    marginTop: 4
  },
  errorContainer: {
    marginTop: 8
  },
  rateLimitErrorContainer: {
    backgroundColor: 'rgba(248, 113, 113, 0.1)',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.3)'
  },
  rateLimitError: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center'
  },
  rateLimitSubtext: {
    color: '#f87171',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    opacity: 0.8
  },
  successContainer: {
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)'
  },
  successIcon: {
    fontSize: 24,
    color: '#34d399',
    marginBottom: 8
  },
  success: {
    color: '#34d399',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4
  },
  successSubtext: {
    color: '#34d399',
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.8
  },
  footer: {
    alignItems: 'center',
    marginTop: SPACING.xl
  },
  linkText: {
    color: COLORS.primary,
    fontWeight: '600'
  },
  input: {
    backgroundColor: COLORS.card,
    color: COLORS.text,
    fontSize: 16,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    minHeight: 50
  },
  inputDisabled: {
    backgroundColor: COLORS.muted,
    opacity: 0.6
  },
  inputError: {
    borderColor: '#f87171',
    borderWidth: 2
  },
  inputSuccess: {
    borderColor: '#34d399',
    borderWidth: 2
  },
  buttonSuccess: {
    backgroundColor: '#34d399',
    borderColor: '#34d399'
  }
});

export default ForgotPasswordScreen;
