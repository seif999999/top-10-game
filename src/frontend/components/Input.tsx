import React from 'react';
import { TextInput, StyleSheet, TextInputProps } from 'react-native';
import { COLORS, SPACING } from '../../backend/utils/constants';
import useAppTranslation from '../../hooks/useTranslation';

const Input: React.FC<TextInputProps> = (props) => {
  const { isRTL } = useAppTranslation();
  return (
    <TextInput
      placeholderTextColor={COLORS.muted}
      style={[styles.input, isRTL && styles.rtlText]}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
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
  rtlText: {
    textAlign: 'right',
  }
});

export default Input;


