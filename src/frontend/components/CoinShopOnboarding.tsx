import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SPACING } from '../../backend/utils/constants';
import useAppTranslation from '../../hooks/useTranslation';

const STORAGE_KEY = 'coin_shop_onboarding_shown';

export async function hasSeenCoinShopOnboarding(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEY);
    return value === 'true';
  } catch {
    return false;
  }
}

export async function setCoinShopOnboardingSeen(): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, 'true');
  } catch {
    // non-fatal
  }
}

export interface CoinShopOnboardingProps {
  visible: boolean;
  onDismiss: () => void;
}

const CoinShopOnboarding: React.FC<CoinShopOnboardingProps> = ({ visible, onDismiss }) => {
  const { t: tComp } = useAppTranslation('components');

  const handleGotIt = () => {
    setCoinShopOnboardingSeen();
    onDismiss();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleGotIt}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={handleGotIt}
      >
        <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
          <View style={styles.card}>
            <Text style={styles.title}>{tComp('coinShopOnboarding.title')}</Text>
            <View style={styles.bullets}>
              <Text style={styles.bullet}>• {tComp('coinShopOnboarding.bullet1')}</Text>
              <Text style={styles.bullet}>• {tComp('coinShopOnboarding.bullet2')}</Text>
              <Text style={styles.bullet}>• {tComp('coinShopOnboarding.bullet3')}</Text>
            </View>
            <TouchableOpacity style={styles.button} onPress={handleGotIt} activeOpacity={0.8}>
              <Text style={styles.buttonText}>{tComp('coinShopOnboarding.gotIt')}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: SPACING.xl,
    width: '100%',
    maxWidth: 360,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  title: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  bullets: {
    marginBottom: SPACING.xl,
  },
  bullet: {
    color: COLORS.muted,
    fontSize: 15,
    lineHeight: 24,
    marginBottom: SPACING.sm,
  },
  button: {
    backgroundColor: COLORS.secondary,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
});

export default CoinShopOnboarding;
