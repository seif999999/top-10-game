import React from 'react';
import { TextInput, StyleSheet, TextInputProps } from 'react-native';
import { COLORS, SPACING } from '../utils/constants';

const Input: React.FC<TextInputProps> = (props) => {
  return <TextInput placeholderTextColor={COLORS.muted} style={styles.input} {...props} />;
};

const styles = StyleSheet.create({
  input: {
    backgroundColor: COLORS.card,
    color: COLORS.text,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155'
  }
});

export default Input;


