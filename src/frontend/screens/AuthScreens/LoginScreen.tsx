import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../components/Button';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS, SPACING } from '../../../backend/utils/constants';
import { LoginScreenProps } from '../../../shared/types/navigation';
import { InputValidator } from '../../../backend/utils/inputValidator';
import { logger } from '../../../backend/utils/logger';
import { toAppError } from '../../../shared/errors';

type Props = LoginScreenProps;

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const { signIn, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localLoading, setLocalLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [firebaseError, setFirebaseError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const passwordInputRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const passwordContainerRef = useRef<View>(null);

  const validate = () => {
    const next: { email?: string; password?: string } = {};
    
    // Validate email using InputValidator
    if (!email.trim()) {
      next.email = 'Email is required';
    } else if (!InputValidator.validateEmail(email.trim())) {
      next.email = 'Enter a valid email address';
    }
    
    // Validate password using InputValidator
    if (!password.trim()) {
      next.password = 'Password is required';
    } else {
      const passwordValidation = InputValidator.validatePassword(password);
      if (!passwordValidation.valid) {
        next.password = passwordValidation.errors[0]; // Show first error
      }
    }
    
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSignIn = async () => {
    logger.log('🔍 DEBUG: handleSignIn called');
    logger.log('🔍 DEBUG: Form data:', { email, password: password ? '***' : '' });
    
    // Clear previous Firebase errors
    setFirebaseError(null);
    
    const isValid = validate();
    logger.log('🔍 DEBUG: Validation result:', isValid);
    logger.log('🔍 DEBUG: Errors:', errors);
    
    if (!isValid) {
      logger.log('❌ DEBUG: Validation failed, not proceeding');
      return;
    }
    
    logger.log('✅ DEBUG: Validation passed, proceeding with signin');
    
    // Sanitize inputs
    logger.log('🔍 DEBUG: Starting input sanitization...');
    let sanitizedEmail, sanitizedPassword;
    
    try {
      sanitizedEmail = InputValidator.sanitizeText(email.trim(), 254);
      logger.log('🔍 DEBUG: Email sanitized');
      sanitizedPassword = InputValidator.sanitizeText(password, 128);
      logger.log('🔍 DEBUG: Password sanitized');
    } catch (error) {
      logger.error('❌ DEBUG: Sanitization error:', error);
      // Fallback to basic sanitization
      sanitizedEmail = email.trim();
      sanitizedPassword = password;
      logger.log('🔍 DEBUG: Using fallback sanitization');
    }
    
    logger.log('🔍 DEBUG: Sanitized inputs:', { 
      sanitizedEmail, 
      sanitizedPassword: sanitizedPassword ? '***' : ''
    });
    
    setLocalLoading(true);
    try {
      logger.log('🔍 DEBUG: Calling signIn...');
      await signIn(sanitizedEmail, sanitizedPassword);
      logger.log('✅ DEBUG: SignIn successful');
    } catch (error) {
      const appError = toAppError(error, {
        code: 'AUTH_LOGIN_FAILED',
        message: 'Login failed',
        userMessage: 'Login failed. Please try again.'
      });
      setFirebaseError(appError.userMessage ?? appError.message);
      logger.error('❌ DEBUG: Login error:', appError);
    } finally {
      setLocalLoading(false);
    }
  };

  const isLoading = loading || localLoading;

  return (
    <SafeAreaView style={styles.container}>
      {/* Dark Purple Gradient Background */}
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f0f1e']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logoSubtleGlow} />
            <View style={styles.logoTextWrapper}>
              <Text style={styles.logoTop}>TOP</Text>
              <Text style={styles.logoNumber}>10</Text>
            </View>
          </View>
          
          <Text style={styles.subtitle}>Sign in to start playing</Text>
          
          <TextInput 
            placeholder="Email" 
            placeholderTextColor={COLORS.muted}
            autoCapitalize="none" 
            keyboardType="email-address"
            value={email} 
            onChangeText={setEmail}
            editable={!isLoading}
            style={styles.input}
            returnKeyType="next"
            onSubmitEditing={() => passwordInputRef.current?.focus()}
          />
          {errors.email ? <Text style={styles.error}>{errors.email}</Text> : null}
          <View ref={passwordContainerRef} style={styles.passwordContainer}>
            <TextInput 
              ref={passwordInputRef}
              placeholder="Password" 
              placeholderTextColor={COLORS.muted}
              secureTextEntry={!showPassword}
              value={password} 
              onChangeText={setPassword}
              editable={!isLoading}
              style={styles.passwordInput}
              returnKeyType="done"
              onSubmitEditing={handleSignIn}
              onFocus={() => {
                // Scroll just enough to show the password field with some padding above it
                // This prevents showing "Forgot password" and other content below
                setTimeout(() => {
                  // Scroll to position that shows password field but not content below
                  scrollViewRef.current?.scrollTo({ y: 180, animated: true });
                }, 200);
              }}
            />
            <TouchableOpacity 
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
              disabled={isLoading}
            >
              <Ionicons 
                name={showPassword ? 'eye' : 'eye-off'} 
                size={20} 
                color={COLORS.muted}
                style={styles.eyeIcon}
              />
            </TouchableOpacity>
          </View>
          {errors.password ? <Text style={styles.error}>{errors.password}</Text> : null}
          
          {firebaseError ? <Text style={styles.firebaseError}>{firebaseError}</Text> : null}
          
          <Button 
            title={isLoading ? 'Signing in…' : 'Sign In'} 
            onPress={handleSignIn}
            disabled={isLoading}
          />

          <TouchableOpacity style={styles.linkCenter} onPress={() => navigation.navigate('ForgotPassword')} disabled={isLoading}>
            <Text style={styles.linkText}>Forgot password?</Text>
          </TouchableOpacity>
          
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')} disabled={isLoading}>
              <Text style={[styles.linkText, isLoading && styles.disabledText]}>Sign up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: SPACING.xl,
    gap: SPACING.lg,
    justifyContent: 'center',
    paddingBottom: SPACING.lg, // Reduced padding to prevent excessive scrolling
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
  firebaseError: {
    color: '#f87171',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 16
  },
  linkCenter: {
    alignItems: 'center',
    marginTop: SPACING.sm
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
    opacity: 0.8,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
    position: 'relative',
    height: 120,
    width: '100%',
  },
  logoSubtleGlow: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    transform: [{ translateX: -70 }, { translateY: -70 }],
    opacity: 0.5,
  },
  logoTextWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    position: 'relative',
  },
  logoTop: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 4,
    textAlign: 'center',
    marginBottom: 2,
  },
  logoNumber: {
    fontSize: 60,
    fontWeight: '900',
    textAlign: 'center',
    color: '#FFFFFF',
    textShadowColor: '#8B5CF6',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    includeFontPadding: false,
  },
});

export default LoginScreen;


