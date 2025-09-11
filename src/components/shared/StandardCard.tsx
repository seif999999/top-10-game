/**
 * 🎯 STANDARD CARD COMPONENT
 * 
 * A reusable card component with consistent styling and accessibility.
 */

import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, COMPONENT_STYLES } from '../../design-system';
import { RESPONSIVE } from '../../utils/responsive';

export interface StandardCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'selected';
  size?: 'small' | 'medium' | 'large';
  onPress?: () => void;
  style?: ViewStyle;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
}

const StandardCard: React.FC<StandardCardProps> = ({
  children,
  variant = 'default',
  size = 'medium',
  onPress,
  style,
  accessibilityLabel,
  accessibilityHint,
  testID,
}) => {
  const getCardStyle = (): ViewStyle => {
    const baseStyle = COMPONENT_RESPONSIVE.card[size];
    const variantStyle = COMPONENT_STYLES.card[variant];
    
    return {
      ...baseStyle,
      ...variantStyle,
      ...style,
    };
  };

  const CardComponent = onPress ? TouchableOpacity : View;

  return (
    <CardComponent
      style={getCardStyle()}
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityHint={accessibilityHint}
      testID={testID}
    >
      {children}
    </CardComponent>
  );
};

export default StandardCard;
