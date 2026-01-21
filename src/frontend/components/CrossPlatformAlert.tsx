/**
 * Cross-Platform Themed Alert
 * Provides Alert dialogs styled with the app theme
 */

import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../design-system';

interface CrossPlatformAlertProps {
  title: string;
  message?: string;
  buttons?: Array<{
    text: string;
    onPress?: () => void;
    style?: 'default' | 'cancel' | 'destructive';
  }>;
  type?: 'error' | 'warning' | 'info' | 'success' | 'default';
}

// Global state for themed alert
let alertQueue: CrossPlatformAlertProps[] = [];
let setAlertState: ((alert: CrossPlatformAlertProps | null) => void) | null = null;
let setVisibleState: ((visible: boolean) => void) | null = null;

export const showCrossPlatformAlert = ({ title, message, buttons, type = 'default' }: CrossPlatformAlertProps) => {
  // Always use themed modal for consistent theming across platforms
  if (setAlertState && setVisibleState) {
    // If modal is already initialized, show immediately
    setAlertState({ title, message, buttons, type });
    setVisibleState(true);
  } else {
    // Otherwise, queue it
    alertQueue.push({ title, message, buttons, type });
  }
};

// Themed Alert Modal Component (for web and as fallback)
export const ThemedAlertModal: React.FC = () => {
  const [currentAlert, setCurrentAlert] = useState<CrossPlatformAlertProps | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Register state setters globally
    setAlertState = setCurrentAlert;
    setVisibleState = setVisible;

    // Process any queued alerts
    if (alertQueue.length > 0) {
      const nextAlert = alertQueue.shift();
      if (nextAlert) {
        setCurrentAlert(nextAlert);
        setVisible(true);
      }
    }

    return () => {
      setAlertState = null;
      setVisibleState = null;
    };
  }, []);

  const handlePress = (index: number) => {
    setVisible(false);
    if (currentAlert?.buttons?.[index]?.onPress) {
      currentAlert.buttons[index].onPress?.();
    }
    // Show next alert if any
    setTimeout(() => {
      if (alertQueue.length > 0) {
        const nextAlert = alertQueue.shift();
        if (nextAlert) {
          setCurrentAlert(nextAlert);
          setVisible(true);
        } else {
          setCurrentAlert(null);
        }
      } else {
        setCurrentAlert(null);
      }
    }, 300);
  };

  if (!currentAlert) return null;

  const getTypeColors = () => {
    switch (currentAlert.type) {
      case 'error':
        return { primary: COLORS.error, border: COLORS.error };
      case 'warning':
        return { primary: COLORS.warning, border: COLORS.warning };
      case 'success':
        return { primary: COLORS.success, border: COLORS.success };
      case 'info':
        return { primary: COLORS.info, border: COLORS.info };
      default:
        return { primary: COLORS.primary, border: COLORS.primary };
    }
  };

  const typeColors = getTypeColors();
  const alertButtons = currentAlert.buttons || [{ text: 'OK' }];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => handlePress(alertButtons.length - 1)}
    >
      <View style={styles.overlay}>
        <View style={[styles.alertContainer, { backgroundColor: COLORS.surface, borderColor: typeColors.border }]}>
          <Text style={[styles.title, { color: COLORS.text }]}>{currentAlert.title}</Text>
          {currentAlert.message && (
            <Text style={[styles.message, { color: COLORS.textSecondary }]}>{currentAlert.message}</Text>
          )}
          <View style={styles.buttonContainer}>
            {alertButtons.map((button, index) => {
              const isDestructive = button.style === 'destructive';
              const isCancel = button.style === 'cancel';
              
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.button,
                    alertButtons.length > 1 && index < alertButtons.length - 1 && styles.buttonMargin,
                    isDestructive && { backgroundColor: COLORS.error },
                    !isDestructive && !isCancel && { backgroundColor: typeColors.primary },
                    isCancel && { backgroundColor: COLORS.surfaceSecondary, borderWidth: 1, borderColor: COLORS.border },
                  ]}
                  onPress={() => handlePress(index)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      { color: isCancel ? COLORS.text : COLORS.white },
                    ]}
                  >
                    {button.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  alertContainer: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    borderWidth: 2,
    padding: SPACING.xl,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  message: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.regular,
    marginBottom: SPACING.xl,
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.fontSize.base * TYPOGRAPHY.lineHeight.relaxed,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  button: {
    flex: 1,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  buttonMargin: {
    marginRight: SPACING.sm,
  },
  buttonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
});

// Convenience functions with theme
export const showErrorAlert = (title: string, message?: string, buttons?: CrossPlatformAlertProps['buttons']) => {
  showCrossPlatformAlert({ title, message, buttons, type: 'error' });
};

export const showSuccessAlert = (title: string, message?: string, buttons?: CrossPlatformAlertProps['buttons']) => {
  showCrossPlatformAlert({ title, message, buttons, type: 'success' });
};

export const showWarningAlert = (title: string, message?: string, buttons?: CrossPlatformAlertProps['buttons']) => {
  showCrossPlatformAlert({ title, message, buttons, type: 'warning' });
};

export const showInfoAlert = (title: string, message?: string, buttons?: CrossPlatformAlertProps['buttons']) => {
  showCrossPlatformAlert({ title, message, buttons, type: 'info' });
};

export default showCrossPlatformAlert;
