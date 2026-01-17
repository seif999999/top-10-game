import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/Button';
import PrivacyPolicyModal from '../../components/PrivacyPolicyModal';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS, SPACING } from '../../../backend/utils/constants';
import { RegisterScreenProps } from '../../../shared/types/navigation';
import { InputValidator } from '../../../backend/utils/inputValidator';
import PrivacyPolicyService from '../../../backend/services/privacyPolicyService';
import { logger } from '../../../backend/utils/logger';

type Props = RegisterScreenProps;

const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const { signUp, loading } = useAuth();
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
    
    // Validate display name using InputValidator
    if (!displayName.trim()) {
      next.displayName = 'Display name is required';
    } else {
      const nameValidation = InputValidator.validateDisplayName(displayName.trim());
      if (!nameValidation.valid) {
        next.displayName = nameValidation.errors[0]; // Show first error
      }
    }
    
    // Validate email using InputValidator
    if (!email.trim()) {
      next.email = 'Email is required';
    } else if (!InputValidator.validateEmail(email.trim())) {
      next.email = 'Enter a valid email address';
    }
    
    // Validate password using InputValidator
    if (!password) {
      next.password = 'Password is required';
    } else {
      const passwordValidation = InputValidator.validatePassword(password);
      if (!passwordValidation.valid) {
        next.password = passwordValidation.errors[0]; // Show first error
      }
    }
    
    if (!confirmPassword) {
      next.confirmPassword = 'Confirm your password';
    } else if (password !== confirmPassword) {
      next.confirmPassword = 'Passwords do not match';
    }
    
    if (!privacyPolicyAccepted) {
      Alert.alert('Privacy Policy Required', 'You must accept the privacy policy to create an account.');
      return false;
    }
    
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handlePrivacyPolicyAccept = async () => {
    try {
      setPrivacyPolicyAccepted(true);
      setShowPrivacyPolicy(false);
      
      // Record privacy policy acceptance for the user being created
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
      // Still allow the user to proceed
    }
  };

  const handlePrivacyPolicyDecline = () => {
    Alert.alert(
      'Privacy Policy Required',
      'You must accept the privacy policy to create an account.',
      [{ text: 'OK' }]
    );
  };

  const handleSignUp = async () => {
    logger.log('🔍 DEBUG: handleSignUp called');
    logger.log('🔍 DEBUG: Form data:', { displayName, email, password: password ? '***' : '', confirmPassword: confirmPassword ? '***' : '' });
    
    // Check if privacy policy is accepted first
    if (!privacyPolicyAccepted) {
      setShowPrivacyPolicy(true);
      return;
    }
    
    const isValid = validate();
    logger.log('🔍 DEBUG: Validation result:', isValid);
    logger.log('🔍 DEBUG: Errors:', errors);
    
    if (!isValid) {
      logger.log('❌ DEBUG: Validation failed, not proceeding');
      return;
    }
    
    logger.log('✅ DEBUG: Validation passed, proceeding with signup');
    
    // Sanitize inputs
    logger.log('🔍 DEBUG: Starting input sanitization...');
    let sanitizedEmail, sanitizedPassword, sanitizedDisplayName;
    
    try {
      sanitizedEmail = InputValidator.sanitizeText(email.trim(), 254);
      logger.log('🔍 DEBUG: Email sanitized');
      sanitizedPassword = InputValidator.sanitizeText(password, 128);
      logger.log('🔍 DEBUG: Password sanitized');
      sanitizedDisplayName = InputValidator.sanitizeText(displayName.trim(), 30);
      logger.log('🔍 DEBUG: Display name sanitized');
    } catch (error) {
      logger.error('❌ DEBUG: Sanitization error:', error);
      // Fallback to basic sanitization
      sanitizedEmail = email.trim();
      sanitizedPassword = password;
      sanitizedDisplayName = displayName.trim();
      logger.log('🔍 DEBUG: Using fallback sanitization');
    }
    
    logger.log('🔍 DEBUG: Sanitized inputs:', { 
      sanitizedEmail, 
      sanitizedPassword: sanitizedPassword ? '***' : '', 
      sanitizedDisplayName 
    });
    
    logger.log('🔍 DEBUG: Setting local loading to true...');
    setLocalLoading(true);
    logger.log('🔍 DEBUG: Local loading set to true');
    
    try {
      logger.log('🔍 DEBUG: About to call signUp function...');
      logger.log('🔍 DEBUG: signUp function exists:', typeof signUp);
      await signUp(sanitizedEmail, sanitizedPassword, sanitizedDisplayName);
      logger.log('✅ DEBUG: SignUp successful');
    } catch (error) {
      logger.error('❌ DEBUG: SignUp error:', error);
      Alert.alert('Registration Failed', error instanceof Error ? error.message : 'An error occurred');
    } finally {
      logger.log('🔍 DEBUG: Setting local loading to false...');
      setLocalLoading(false);
      logger.log('🔍 DEBUG: Local loading set to false');
    }
  };


  const isLoading = loading || localLoading;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Create account</Text>
      <Text style={styles.subtitle}>Join the Top 10 game community</Text>
      
      <TextInput 
        placeholder="Display Name" 
        placeholderTextColor={COLORS.muted}
        value={displayName} 
        onChangeText={setDisplayName}
        editable={!isLoading}
        style={styles.input}
      />
      {errors.displayName ? <Text style={styles.error}>{errors.displayName}</Text> : null}
      <TextInput 
        placeholder="Email" 
        placeholderTextColor={COLORS.muted}
        autoCapitalize="none" 
        keyboardType="email-address"
        value={email} 
        onChangeText={setEmail}
        editable={!isLoading}
        style={styles.input}
      />
      {errors.email ? <Text style={styles.error}>{errors.email}</Text> : null}
      <View style={styles.passwordContainer}>
        <TextInput 
          placeholder="Password" 
          placeholderTextColor={COLORS.muted}
          secureTextEntry={!showPassword}
          value={password} 
          onChangeText={setPassword}
          editable={!isLoading}
          style={styles.passwordInput}
        />
        <TouchableOpacity 
          style={styles.eyeButton}
          onPress={() => setShowPassword(!showPassword)}
          disabled={isLoading}
        >
          <Text style={styles.eyeIcon}>
            {showPassword ? '👁️' : '👁️‍🗨️'}
          </Text>
        </TouchableOpacity>
      </View>
      {errors.password ? <Text style={styles.error}>{errors.password}</Text> : null}
      <View style={styles.passwordContainer}>
        <TextInput 
          placeholder="Confirm Password" 
          placeholderTextColor={COLORS.muted}
          secureTextEntry={!showConfirmPassword}
          value={confirmPassword} 
          onChangeText={setConfirmPassword}
          editable={!isLoading}
          style={styles.passwordInput}
        />
        <TouchableOpacity 
          style={styles.eyeButton}
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
          style={styles.checkboxContainer}
          onPress={() => setPrivacyPolicyAccepted(!privacyPolicyAccepted)}
        >
          <View style={[styles.checkbox, privacyPolicyAccepted && styles.checkboxChecked]}>
            {privacyPolicyAccepted && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.checkboxLabel}>
            I accept the{' '}
            <Text 
              style={styles.privacyPolicyLink}
              onPress={() => setShowPrivacyPolicy(true)}
            >
              Privacy Policy
            </Text>
          </Text>
        </TouchableOpacity>
      </View>
      
      <Button 
        title={isLoading ? 'Creating account…' : 'Create Account'} 
        onPress={handleSignUp}
        disabled={isLoading}
      />
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>Already have an account? </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Login')} disabled={isLoading}>
          <Text style={[styles.linkText, isLoading && styles.disabledText]}>Sign in</Text>
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
});

export default RegisterScreen;


