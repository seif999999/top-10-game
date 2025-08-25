import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS, SPACING } from '../../utils/constants';
import { LoginScreenProps } from '../../types/navigation';

type Props = LoginScreenProps;

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const { signIn, loading, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localLoading, setLocalLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLocalLoading(true);
    try {
      console.log('Attempting to sign in...');
      await signIn(email.trim(), password);
      console.log('Sign in completed, user state:', user);
      Alert.alert('Success', 'Login successful! You should be redirected.');
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Login Failed', error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLocalLoading(false);
    }
  };

  const testNavigation = () => {
    Alert.alert('Test', 'Testing direct navigation...');
    // This will be handled by the test mode in AuthContext
    signIn('test@test.com', 'test123');
  };

  const isLoading = loading || localLoading;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome back</Text>
      <Text style={styles.subtitle}>Sign in to continue playing</Text>
      
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
      
      <Button 
        title={isLoading ? 'Signing in…' : 'Sign In'} 
        onPress={handleSignIn}
        disabled={isLoading}
      />
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>Don't have an account? </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Register')} disabled={isLoading}>
          <Text style={[styles.linkText, isLoading && styles.disabledText]}>Sign up</Text>
        </TouchableOpacity>
      </View>

      {/* Test credentials note */}
      <View style={styles.testNote}>
        <Text style={styles.testText}>Test: test@test.com / test123</Text>
        <Text style={styles.testText}>Current user: {user ? user.email : 'None'}</Text>
        <TouchableOpacity style={styles.testButton} onPress={testNavigation}>
          <Text style={styles.testButtonText}>Test Navigation</Text>
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
  testNote: {
    marginTop: SPACING.xl,
    padding: SPACING.md,
    backgroundColor: COLORS.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.muted
  },
  testText: {
    color: COLORS.muted,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: SPACING.xs
  },
  testButton: {
    backgroundColor: COLORS.primary,
    padding: SPACING.sm,
    borderRadius: 6,
    marginTop: SPACING.sm
  },
  testButtonText: {
    color: COLORS.text,
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600'
  }
});

export default LoginScreen;


