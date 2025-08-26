import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS, SPACING } from '../../utils/constants';
import { ForgotPasswordScreenProps } from '../../types/navigation';

const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ navigation }) => {
  const { resetPassword, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const onSubmit = async () => {
    setError(null);
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    const emailRegex = /[^@\s]+@[^@\s]+\.[^@\s]+/;
    if (!emailRegex.test(email.trim())) {
      setError('Enter a valid email');
      return;
    }
    try {
      await resetPassword(email.trim());
      setSent(true);
      Alert.alert('Email sent', 'Check your inbox for reset instructions.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send reset email');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reset Password</Text>
      <Text style={styles.subtitle}>Enter your email to receive reset instructions.</Text>

      <Input
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        editable={!loading}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button title={loading ? 'Sending…' : 'Send reset email'} onPress={onSubmit} disabled={loading} />

      {sent ? <Text style={styles.success}>If the email exists, a reset link was sent.</Text> : null}

      <View style={styles.footer}>
        <TouchableOpacity onPress={() => navigation.navigate('Login')} disabled={loading}>
          <Text style={styles.linkText}>Back to Sign in</Text>
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
    fontSize: 14,
    textAlign: 'center'
  },
  error: {
    color: '#f87171'
  },
  success: {
    color: '#34d399'
  },
  footer: {
    alignItems: 'center',
    marginTop: SPACING.xl
  },
  linkText: {
    color: COLORS.primary,
    fontWeight: '600'
  }
});

export default ForgotPasswordScreen;
