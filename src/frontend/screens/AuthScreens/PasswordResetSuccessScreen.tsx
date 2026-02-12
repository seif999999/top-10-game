import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/Button';
import { COLORS, SPACING } from '../../../backend/utils/constants';
import { PasswordResetSuccessScreenProps } from '../../../shared/types/navigation';
import useAppTranslation from '../../../hooks/useTranslation';

const PasswordResetSuccessScreen: React.FC<PasswordResetSuccessScreenProps> = ({ navigation }) => {
  const { t: tScreens } = useAppTranslation('screens');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{tScreens('auth.passwordResetSuccess.title')}</Text>
        <Text style={styles.subtitle}>
          {tScreens('auth.passwordResetSuccess.subtitle')}
        </Text>

        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>{tScreens('auth.passwordResetSuccess.requirementsTitle')}</Text>
          <View style={styles.requirementsList}>
            <Text style={styles.requirement}>• {tScreens('auth.passwordResetSuccess.requirements.length')}</Text>
            <Text style={styles.requirement}>• {tScreens('auth.passwordResetSuccess.requirements.uppercase')}</Text>
            <Text style={styles.requirement}>• {tScreens('auth.passwordResetSuccess.requirements.lowercase')}</Text>
            <Text style={styles.requirement}>• {tScreens('auth.passwordResetSuccess.requirements.number')}</Text>
            <Text style={styles.requirement}>• {tScreens('auth.passwordResetSuccess.requirements.special')}</Text>
          </View>
        </View>

        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>💡 {tScreens('auth.passwordResetSuccess.tipsTitle')}</Text>
          <Text style={styles.tip}>• {tScreens('auth.passwordResetSuccess.tips.spam')}</Text>
          <Text style={styles.tip}>• {tScreens('auth.passwordResetSuccess.tips.expiry')}</Text>
          <Text style={styles.tip}>• {tScreens('auth.passwordResetSuccess.tips.strong')}</Text>
          <Text style={styles.tip}>• {tScreens('auth.passwordResetSuccess.tips.realtime')}</Text>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title={tScreens('auth.passwordResetSuccess.backToSignIn')}
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
