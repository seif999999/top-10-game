import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput } from 'react-native';
import Button from '../../components/Button';
import GoogleSignInButton from '../../components/GoogleSignInButton';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS, SPACING } from '../../utils/constants';
import { LoginScreenProps } from '../../types/navigation';

type Props = LoginScreenProps;

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const { signIn, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localLoading, setLocalLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [firebaseError, setFirebaseError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const validate = () => {
    const next: { email?: string; password?: string } = {};
    if (!email.trim()) next.email = 'Email is required';
    else if (!/[^@\s]+@[^@\s]+\.[^@\s]+/.test(email.trim())) next.email = 'Enter a valid email';
    if (!password.trim()) next.password = 'Password is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSignIn = async () => {
    // Clear previous Firebase errors
    setFirebaseError(null);
    
    if (!validate()) return;
    setLocalLoading(true);
    try {
      await signIn(email.trim(), password);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setFirebaseError(errorMessage);
      console.error('Login error:', errorMessage);
    } finally {
      setLocalLoading(false);
    }
  };

  const isLoading = loading || localLoading;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome back</Text>
      <Text style={styles.subtitle}>Sign in to continue playing</Text>
      
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
      
      {firebaseError ? <Text style={styles.firebaseError}>{firebaseError}</Text> : null}
      
      <Button 
        title={isLoading ? 'Signing in…' : 'Sign In'} 
        onPress={handleSignIn}
        disabled={isLoading}
      />

      {/* Divider */}
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>OR</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Google Sign-In Button */}
      <GoogleSignInButton
        onSuccess={() => {
          // Navigation will be handled automatically by AuthContext
          console.log('Google sign-in successful');
        }}
        onError={(error) => {
          console.error('Google sign-in error:', error);
          Alert.alert('Sign-In Error', error);
        }}
        style={styles.googleButton}
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
    </View>
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
    fontSize: 18,
    opacity: 0.8,
    color: COLORS.muted
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.lg
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.muted,
    opacity: 0.3
  },
  dividerText: {
    color: COLORS.muted,
    fontSize: 14,
    marginHorizontal: SPACING.md,
    fontWeight: '500'
  },
  googleButton: {
    marginBottom: SPACING.sm
  }
});

export default LoginScreen;


