import React from 'react';
import { TouchableOpacity, Text, StyleSheet, GestureResponderEvent, ViewStyle, TextStyle } from 'react-native';
import { COLORS, SPACING } from '../utils/constants';

type ButtonProps = {
  title: string;
  onPress?: (event: GestureResponderEvent) => void;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
};

const Button: React.FC<ButtonProps> = ({ title, onPress, disabled, style, textStyle }) => {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={[styles.button, disabled && styles.disabled, style]}
    >
      <Text style={[styles.text, textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  disabled: {
    opacity: 0.6
  },
  text: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600'
  }
});

export default Button;


