import React from 'react';
import { Platform, Alert } from 'react-native';

interface CrossPlatformAlertProps {
  title: string;
  message: string;
  buttons?: Array<{
    text: string;
    onPress?: () => void;
    style?: 'default' | 'cancel' | 'destructive';
  }>;
}

export const showCrossPlatformAlert = ({ title, message, buttons }: CrossPlatformAlertProps) => {
  if (Platform.OS === 'web') {
    // For web, use browser's native confirm/alert
    if (buttons && buttons.length === 1) {
      // Simple alert for single button
      alert(`${title}\n\n${message}`);
      if (buttons[0].onPress) {
        buttons[0].onPress();
      }
    } else if (buttons && buttons.length === 2) {
      // Confirm dialog for two buttons
      const result = confirm(`${title}\n\n${message}`);
      if (result && buttons[0].onPress) {
        buttons[0].onPress();
      } else if (!result && buttons[1].onPress) {
        buttons[1].onPress();
      }
    } else {
      // Default alert
      alert(`${title}\n\n${message}`);
    }
  } else {
    // For mobile, use React Native Alert
    Alert.alert(title, message, buttons);
  }
};

export default showCrossPlatformAlert;
