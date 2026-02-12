import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import ThemedAlert from '../../utils/themedAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/Button';
import PrivacyPolicyModal from '../../components/PrivacyPolicyModal';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS, SPACING } from '../../../backend/utils/constants';
import { RegisterScreenProps } from '../../../shared/types/navigation';
import { InputValidator } from '../../../backend/utils/inputValidator';
import PrivacyPolicyService from '../../../backend/services/privacyPolicyService';
import { logger } from '../../../backend/utils/logger';
import { toAppError } from '../../../shared/errors';
import useAppTranslation from '../../../hooks/useTranslation';

type Props = RegisterScreenProps;

const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const { signUp, loading } = useAuth();
  const { t: tScreens } = useAppTranslation('screens');
  const { t: tErrors } = useAppTranslation('errors');
  const { isRTL } = useAppTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [localLoading, setLocalLoading] = useState(false);
  const [errors, setErrors] = useState<{ displayName?: string; email?: string; password?: string; confirmPassword?: string }>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [privacyPolicyAccepted, setPrivacyPolicyAccepted] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validate = () => {
    const next: { displayName?: string; email?: string; password?: string; confirmPassword?: string } = {};
    
    if (!displayName.trim()) {
      next.displayName = tErrors('validation.displayNameRequired');
    } else {
      const nameValidation = InputValidator.validateDisplayName(displayName.trim());
      if (!nameValidation.valid) {
        next.displayName = nameValidation.errors[0];
      }
    }
    
    if (!email.trim()) {
      next.email = tErrors('validation.emailRequired');
    } else if (!InputValidator.validateEmail(email.trim())) {
      next.email = tErrors('validation.emailInvalid');
    }
    
    if (!password) {
      next.password = tErrors('validation.passwordRequired');
    } else {
      const passwordValidation = InputValidator.validatePassword(password);
      if (!passwordValidation.valid) {
        next.password = passwordValidation.errors[0];
      }
    }
    
    if (!confirmPassword) {
      next.confirmPassword = tErrors('validation.confirmPasswordRequired');
    } else if (password !== confirmPassword) {
      next.confirmPassword = tErrors('validation.passwordsDoNotMatch');
    }
    
    if (!privacyPolicyAccepted) {
      ThemedAlert.warning(
        tScreens('auth.register.privacyPolicyRequired'),
        tScreens('auth.register.privacyPolicyMessage')
      );
      return false;
    }
    
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handlePrivacyPolicyAccept = async () => {
    try {
      setPrivacyPolicyAccepted(true);
      setShowPrivacyPolicy(false);
      
      await PrivacyPolicyService.recordAnonymousAcceptance({
        ipAddress: 'unknown',
        userAgent: 'mobile',
        deviceInfo: {
          platform: 'mobile',
          version: '1.0.0',
        },
      });
      
      logger.log('Privacy policy accepted');
    } catch (error) {
      logger.error('Error recording privacy policy acceptance:', error);
    }
  };

  const handlePrivacyPolicyDecline = () => {
    ThemedAlert.warning(
      tScreens('auth.register.privacyPolicyRequired'),
      tScreens('auth.register.privacyPolicyMessage'),
      [{ text: tErrors('general') === 'Error' ? 'OK' : 'OK' }]
    );
  };

  const handleSignUp = async () => {
    if (!privacyPolicyAccepted) {
      setShowPrivacyPolicy(true);
      return;
    }
    
    const isValid = validate();
    if (!isValid) return;
    
    let sanitizedEmail, sanitizedPassword, sanitizedDisplayName;
    
    try {
      sanitizedEmail = InputValidator.sanitizeText(email.trim(), 254);
      sanitizedPassword = InputValidator.sanitizeText(password, 128);
      sanitizedDisplayName = InputValidator.sanitizeText(displayName.trim(), 30);
    } catch (error) {
      logger.error('Sanitization error:', error);
      sanitizedEmail = email.trim();
      sanitizedPassword = password;
      sanitizedDisplayName = displayName.trim();
    }
    
    setLocalLoading(true);
    try {
      await signUp(sanitizedEmail, sanitizedPassword, sanitizedDisplayName);
    } catch (error) {
      const appError = toAppError(error, {
        code: 'AUTH_REGISTER_FAILED',
        message: 'Registration failed',
        userMessage: tErrors('auth.registrationFailed')
      });
      logger.error('SignUp error:', appError);
      ThemedAlert.error(tErrors('auth.registrationFailedTitle'), appError.userMessage ?? appError.message);
    } finally {
      setLocalLoading(false);
    }
  };

  const isLoading = loading || localLoading;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>{tScreens('auth.register.title')}</Text>
      <Text style={styles.subtitle}>{tScreens('auth.register.subtitle')}</Text>
      
      <TextInput 
        placeholder={tScreens('auth.displayName')}
        placeholderTextColor={COLORS.muted}
        value={displayName} 
        onChangeText={setDisplayName}
        editable={!isLoading}
        style={[styles.input, isRTL && styles.rtlText]}
      />
      {errors.displayName ? <Text style={styles.error}>{errors.displayName}</Text> : null}
      <TextInput 
        placeholder={tScreens('auth.email')}
        placeholderTextColor={COLORS.muted}
        autoCapitalize="none" 
        keyboardType="email-address"
        value={email} 
        onChangeText={setEmail}
        editable={!isLoading}
        style={[styles.input, isRTL && styles.rtlText]}
      />
      {errors.email ? <Text style={styles.error}>{errors.email}</Text> : null}
      <View style={[styles.passwordContainer, isRTL && styles.rtlRow]}>
        <TextInput 
          placeholder={tScreens('auth.password')}
          placeholderTextColor={COLORS.muted}
          secureTextEntry={!showPassword}
          value={password} 
          onChangeText={setPassword}
          editable={!isLoading}
          style={[styles.passwordInput, isRTL && styles.rtlPasswordInput]}
        />
        <TouchableOpacity 
          style={[styles.eyeButton, isRTL && styles.rtlEyeButton]}
          onPress={() => setShowPassword(!showPassword)}
          disabled={isLoading}
        >
          <Text style={styles.eyeIcon}>
            {showPassword ? '👁️' : '👁️‍🗨️'}
          </Text>
        </TouchableOpacity>
      </View>
      {errors.password ? <Text style={styles.error}>{errors.password}</Text> : null}
      <View style={[styles.passwordContainer, isRTL && styles.rtlRow]}>
        <TextInput 
          placeholder={tScreens('auth.confirmPassword')}
          placeholderTextColor={COLORS.muted}
          secureTextEntry={!showConfirmPassword}
          value={confirmPassword} 
          onChangeText={setConfirmPassword}
          editable={!isLoading}
          style={[styles.passwordInput, isRTL && styles.rtlPasswordInput]}
        />
        <TouchableOpacity 
          style={[styles.eyeButton, isRTL && styles.rtlEyeButton]}
          onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          disabled={isLoading}
        >
          <Text style={styles.eyeIcon}>
            {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
          </Text>
        </TouchableOpacity>
      </View>
      {errors.confirmPassword ? <Text style={styles.error}>{errors.confirmPassword}</Text> : null}
      
      <View style={styles.privacyPolicyContainer}>
        <TouchableOpacity 
          style={[styles.checkboxContainer, isRTL && styles.rtlRow]}
          onPress={() => setPrivacyPolicyAccepted(!privacyPolicyAccepted)}
        >
          <View style={[styles.checkbox, privacyPolicyAccepted && styles.checkboxChecked, isRTL && styles.rtlCheckbox]}>
            {privacyPolicyAccepted && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.checkboxLabel}>
            {tScreens('auth.register.acceptPrivacy')}{' '}
            <Text 
              style={styles.privacyPolicyLink}
              onPress={() => setShowPrivacyPolicy(true)}
            >
              {tScreens('auth.register.privacyPolicy')}
            </Text>
          </Text>
        </TouchableOpacity>
      </View>
      
      <Button 
        title={isLoading ? tScreens('auth.register.creatingAccount') : tScreens('auth.createAccount')} 
        onPress={handleSignUp}
        disabled={isLoading}
      />
      
      <View style={[styles.footer, isRTL && styles.rtlRow]}>
        <Text style={styles.footerText}>{tScreens('auth.alreadyHaveAccount')} </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Login')} disabled={isLoading}>
          <Text style={[styles.linkText, isLoading && styles.disabledText]}>{tScreens('auth.signIn')}</Text>
        </TouchableOpacity>
      </View>

      <PrivacyPolicyModal
        visible={showPrivacyPolicy}
        onAccept={handlePrivacyPolicyAccept}
        onDecline={handlePrivacyPolicyDecline}
        onClose={() => setShowPrivacyPolicy(false)}
      />
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
    marginBottom: SPACING.xl
  },
  error: {
    color: '#f87171',
    fontSize: 12,
    marginTop: 4
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.xl
  },
  footerText: {
    color: COLORS.muted,
    fontSize: 14
  },
  linkText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600'
  },
  disabledText: {
    opacity: 0.5
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
  passwordContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center'
  },
  passwordInput: {
    backgroundColor: COLORS.card,
    color: COLORS.text,
    fontSize: 16,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingRight: 50,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    minHeight: 50,
    flex: 1
  },
  eyeButton: {
    position: 'absolute',
    right: SPACING.md,
    padding: SPACING.sm,
    justifyContent: 'center',
    alignItems: 'center'
  },
  eyeIcon: {
    fontSize: 18,
    opacity: 0.8,
    color: COLORS.muted
  },
  privacyPolicyContainer: {
    marginVertical: SPACING.md,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: COLORS.muted,
    borderRadius: 4,
    marginRight: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkmark: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
  },
  privacyPolicyLink: {
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },
  // RTL styles
  rtlText: {
    textAlign: 'right',
  },
  rtlRow: {
    flexDirection: 'row-reverse',
  },
  rtlPasswordInput: {
    paddingRight: SPACING.lg,
    paddingLeft: 50,
    textAlign: 'right',
  },
  rtlEyeButton: {
    right: undefined,
    left: SPACING.md,
  },
  rtlCheckbox: {
    marginRight: 0,
    marginLeft: SPACING.sm,
  },
});

export default RegisterScreen;
