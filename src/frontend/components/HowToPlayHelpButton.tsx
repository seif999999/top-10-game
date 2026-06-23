import React, { useState, useCallback } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import HowToPlayModal, { HowToPlayMode } from './HowToPlayModal';
import useAppTranslation from '../../hooks/useTranslation';

interface HowToPlayHelpButtonProps {
  mode: HowToPlayMode;
  onPress?: () => void;
}

const HowToPlayHelpButton: React.FC<HowToPlayHelpButtonProps> = ({ mode, onPress }) => {
  const [visible, setVisible] = useState(false);
  const { t } = useAppTranslation('screens');

  const handlePress = useCallback(() => {
    onPress?.();
    setVisible(true);
  }, [onPress]);

  return (
    <>
      <TouchableOpacity
        onPress={handlePress}
        style={styles.button}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={t('profile.howToPlay')}
      >
        <Text style={styles.icon}>❓</Text>
      </TouchableOpacity>
      <HowToPlayModal
        visible={visible}
        onClose={() => setVisible(false)}
        mode={mode}
      />
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#000000',
    borderWidth: 0.5,
    borderColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  icon: {
    fontSize: 20,
  },
});

export default HowToPlayHelpButton;
