import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS, SPACING } from '../../utils/constants';
import { RegisterScreenProps } from '../../types/navigation';

type Props = RegisterScreenProps;

const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const { signUp, loading, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [localLoading, setLocalLoading] = useState(false);

  const handleSignUp = async () => {
    // Validation
    if (!email.trim() || !password || !confirmPassword || !displayName.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    setLocalLoading(true);
    try {
      console.log('Attempting to sign up...');
      await signUp(email.trim(), password, displayName.trim());
      console.log('Sign up completed, user state:', user);
      Alert.alert('Success', 'Registration successful! You should be redirected.');
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Registration Failed', error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLocalLoading(false);
    }
  };

  const isLoading = loading || localLoading;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create account</Text>
      <Text style={styles.subtitle}>Join the Top 10 game community</Text>
      
      <Input 
        placeholder="Display Name" 
        value={displayName} 
        onChangeText={setDisplayName}
        editable={!isLoading}
      />
      <Input 
        placeholder="Email" 
        autoCapitalize="none" 
        keyboardType="email-address"
        value={email} 
        onChangeText={setEmail}
        editable={!isLoading}
      />
      <Input 
        placeholder="Password" 
        secureTextEntry 
        value={password} 
        onChangeText={setPassword}
        editable={!isLoading}
      />
      <Input 
        placeholder="Confirm Password" 
        secureTextEntry 
        value={confirmPassword} 
        onChangeText={setConfirmPassword}
        editable={!isLoading}
      />
      
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

      {/* Debug info */}
      <View style={styles.debugNote}>
        <Text style={styles.debugText}>Current user: {user ? user.email : 'None'}</Text>
        <Text style={styles.debugText}>Loading: {isLoading ? 'Yes' : 'No'}</Text>
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
  debugNote: {
    marginTop: SPACING.xl,
    padding: SPACING.md,
    backgroundColor: COLORS.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.muted
  },
  debugText: {
    color: COLORS.muted,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: SPACING.xs
  }
});

export default RegisterScreen;


