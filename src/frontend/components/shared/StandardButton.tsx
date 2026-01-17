/**
 * 🎯 STANDARD BUTTON COMPONENT
 * 
 * A reusable button component with consistent styling and accessibility.
 */

import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, COMPONENT_STYLES } from '../../design-system';
import { RESPONSIVE } from '../../utils/responsive';

export interface StandardButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'error' | 'disabled';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
}

const StandardButton: React.FC<StandardButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  textStyle,
  accessibilityLabel,
  accessibilityHint,
  testID,
}) => {
  const isDisabled = disabled || loading;

  const getButtonStyle = (): ViewStyle => {
    const baseStyle = COMPONENT_RESPONSIVE.button[size];
    const variantStyle = COMPONENT_STYLES.button[variant === 'disabled' ? 'disabled' : variant];
    
    return {
      ...baseStyle,
      ...variantStyle,
      ...(fullWidth && { width: '100%' }),
      ...(isDisabled && COMPONENT_STYLES.button.disabled),
      ...style,
    };
  };

  const getTextStyle = (): TextStyle => {
    const baseTextStyle = {
      fontSize: RESPONSIVE.fontSize.responsive.base,
      fontWeight: TYPOGRAPHY.fontWeight.semibold,
      textAlign: 'center' as const,
    };

    return {
      ...baseTextStyle,
      ...(isDisabled && { color: COLORS.textDisabled }),
      ...textStyle,
    };
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={isDisabled}
      accessibilityLabel={accessibilityLabel || title}
      accessibilityRole="button"
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled }}
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator 
          color={isDisabled ? COLORS.textDisabled : COLORS.white} 
          size="small" 
        />
      ) : (
        <Text style={getTextStyle()}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

export default StandardButton;
