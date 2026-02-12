/**
 * 🎯 STANDARD INPUT COMPONENT
 * 
 * A reusable input component with consistent styling and accessibility.
 */

import React, { useState } from 'react';
import { TextInput, View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, COMPONENT_STYLES } from '../../design-system';
import { RESPONSIVE, COMPONENT_RESPONSIVE } from '../../utils/responsive';
import useAppTranslation from '../../../hooks/useTranslation';

export interface StandardInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  success?: string;
  variant?: 'default' | 'focused' | 'error' | 'success';
  size?: 'small' | 'medium' | 'large';
  multiline?: boolean;
  numberOfLines?: number;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  editable?: boolean;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
}

const StandardInput: React.FC<StandardInputProps> = ({
  value,
  onChangeText,
  placeholder,
  label,
  error,
  success,
  variant = 'default',
  size = 'medium',
  multiline = false,
  numberOfLines = 1,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  autoCorrect = true,
  editable = true,
  style,
  inputStyle,
  accessibilityLabel,
  accessibilityHint,
  testID,
}) => {
  const { isRTL } = useAppTranslation();
  const [isFocused, setIsFocused] = useState(false);

  const getInputVariant = (): 'default' | 'focused' | 'error' | 'success' => {
    if (error) return 'error';
    if (success) return 'success';
    if (isFocused) return 'focused';
    return 'default';
  };

  const getContainerStyle = (): ViewStyle => {
    return {
      marginBottom: SPACING.md,
      ...style,
    };
  };

  const getInputStyle = (): ViewStyle => {
    const baseStyle = COMPONENT_RESPONSIVE.input[size];
    const variantStyle = COMPONENT_STYLES.input[getInputVariant()];
    
    return {
      ...baseStyle,
      ...variantStyle,
      ...(multiline && { 
        textAlignVertical: 'top' as const,
        minHeight: numberOfLines * 20 + 32, // Approximate height for multiline
      }),
      ...(isRTL && { textAlign: 'right' as const }),
      ...inputStyle,
    };
  };

  const getTextStyle = (): TextStyle => {
    return {
      fontSize: RESPONSIVE.fontSize.responsive.base,
      color: COLORS.text,
      ...(multiline && { textAlignVertical: 'top' as const }),
    };
  };

  const getLabelStyle = (): TextStyle => {
    return {
      fontSize: RESPONSIVE.fontSize.responsive.sm,
      fontWeight: TYPOGRAPHY.fontWeight.medium,
      color: COLORS.text,
      marginBottom: SPACING.xs,
      ...(isRTL && { textAlign: 'right' as const }),
    };
  };

  const getErrorStyle = (): TextStyle => {
    return {
      fontSize: RESPONSIVE.fontSize.responsive.xs,
      color: COLORS.error,
      marginTop: SPACING.xs,
    };
  };

  const getSuccessStyle = (): TextStyle => {
    return {
      fontSize: RESPONSIVE.fontSize.responsive.xs,
      color: COLORS.success,
      marginTop: SPACING.xs,
    };
  };

  return (
    <View style={getContainerStyle()}>
      {label && <Text style={getLabelStyle()}>{label}</Text>}
      
      <TextInput
        style={getInputStyle()}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        multiline={multiline}
        numberOfLines={numberOfLines}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        editable={editable}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        accessibilityLabel={accessibilityLabel || label || placeholder}
        accessibilityHint={accessibilityHint}
        testID={testID}
      />
      
      {error && <Text style={getErrorStyle()}>{error}</Text>}
      {success && <Text style={getSuccessStyle()}>{success}</Text>}
    </View>
  );
};

export default StandardInput;
