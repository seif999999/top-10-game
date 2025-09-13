import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/Button';
import { COLORS, SPACING } from '../../utils/constants';
import { PasswordResetSuccessScreenProps } from '../../types/navigation';

/**
 * PasswordResetSuccessScreen Component
 * 
 * Displays success message after password reset email is sent
 * Provides clear instructions about password requirements
 * 
 * @param navigation - React Navigation object for screen transitions
 */
const PasswordResetSuccessScreen: React.FC<PasswordResetSuccessScreenProps> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Check Your Email</Text>
        <Text style={styles.subtitle}>
          We've sent you a password reset link. Please check your email and follow the instructions.
        </Text>

        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>Password Requirements:</Text>
          <View style={styles.requirementsList}>
            <Text style={styles.requirement}>• At least 8 characters long</Text>
            <Text style={styles.requirement}>• At least one uppercase letter (A-Z)</Text>
            <Text style={styles.requirement}>• At least one lowercase letter (a-z)</Text>
            <Text style={styles.requirement}>• At least one number (0-9)</Text>
            <Text style={styles.requirement}>• At least one special character (!@#$%^&*)</Text>
          </View>
        </View>

        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>💡 Tips:</Text>
          <Text style={styles.tip}>• Check your spam folder if you don't see the email</Text>
          <Text style={styles.tip}>• The reset link expires in 1 hour</Text>
          <Text style={styles.tip}>• Use a strong, unique password</Text>
          <Text style={styles.tip}>• The reset page will validate your password in real-time</Text>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title="Back to Sign In"
            onPress={() => navigation.navigate('Login')}
            style={styles.button}
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
  instructionsContainer: {
    backgroundColor: COLORS.cardBackground,
    padding: SPACING.lg,
    borderRadius: 12,
    marginBottom: SPACING.lg,
  },
  instructionsTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: SPACING.md,
  },
  requirementsList: {
    gap: SPACING.sm,
  },
  requirement: {
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 20,
  },
  tipsContainer: {
    backgroundColor: COLORS.primary + '10',
    padding: SPACING.lg,
    borderRadius: 12,
    marginBottom: SPACING.xl,
  },
  tipsTitle: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  tip: {
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: SPACING.xs,
  },
  buttonContainer: {
    gap: SPACING.md,
  },
  button: {
    marginTop: SPACING.md,
  },
});

export default PasswordResetSuccessScreen;
