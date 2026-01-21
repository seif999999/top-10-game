/**
 * Themed Alert Component
 * Provides Alert dialogs styled with the app theme
 */

import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../design-system';

export interface ThemedAlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

export interface ThemedAlertOptions {
  title: string;
  message?: string;
  buttons?: ThemedAlertButton[];
  type?: 'error' | 'warning' | 'info' | 'success' | 'default';
}

let currentAlert: {
  resolve: (value: number) => void;
  options: ThemedAlertOptions;
} | null = null;

const ThemedAlertComponent: React.FC = () => {
  const [visible, setVisible] = React.useState(false);
  const [options, setOptions] = React.useState<ThemedAlertOptions | null>(null);

  React.useEffect(() => {
    if (currentAlert) {
      setOptions(currentAlert.options);
      setVisible(true);
    }
  }, []);

  const handlePress = (index: number) => {
    setVisible(false);
    if (currentAlert) {
      currentAlert.resolve(index);
      currentAlert = null;
    }
    if (options?.buttons?.[index]?.onPress) {
      options.buttons[index].onPress?.();
    }
  };

  if (!options) return null;

  const getTypeColors = () => {
    switch (options.type) {
      case 'error':
        return {
          primary: COLORS.error,
          primaryDark: COLORS.errorDark,
          bg: COLORS.errorBg,
          border: COLORS.error,
        };
      case 'warning':
        return {
          primary: COLORS.warning,
          primaryDark: COLORS.warningDark,
          bg: COLORS.warning + '20',
          border: COLORS.warning,
        };
      case 'success':
        return {
          primary: COLORS.success,
          primaryDark: COLORS.successDark,
          bg: COLORS.successBg,
          border: COLORS.success,
        };
      case 'info':
        return {
          primary: COLORS.info,
          primaryDark: COLORS.infoDark,
          bg: COLORS.info + '20',
          border: COLORS.info,
        };
      default:
        return {
          primary: COLORS.primary,
          primaryDark: COLORS.primaryDark,
          bg: COLORS.primaryMuted,
          border: COLORS.primary,
        };
    }
  };

  const typeColors = getTypeColors();
  const buttons = options.buttons || [{ text: 'OK' }];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => handlePress(buttons.length - 1)}
    >
      <View style={styles.overlay}>
        <View style={[styles.alertContainer, { backgroundColor: COLORS.surface, borderColor: typeColors.border }]}>
          <Text style={[styles.title, { color: COLORS.text }]}>{options.title}</Text>
          {options.message && (
            <Text style={[styles.message, { color: COLORS.textSecondary }]}>{options.message}</Text>
          )}
          <View style={styles.buttonContainer}>
            {buttons.map((button, index) => {
              const isDestructive = button.style === 'destructive';
              const isCancel = button.style === 'cancel';
              const isLast = index === buttons.length - 1;
              
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.button,
                    isLast && buttons.length > 1 && styles.buttonLast,
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
  buttonLast: {
    marginLeft: SPACING.md,
  },
  buttonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
});

// Global alert instance
let alertInstance: React.ComponentType | null = null;

export const showThemedAlert = (options: ThemedAlertOptions): Promise<number> => {
  return new Promise((resolve) => {
    currentAlert = { resolve, options };
    // Trigger re-render of ThemedAlertComponent
    if (alertInstance) {
      // Force update by setting state
      const event = new Event('themed-alert-update');
      window.dispatchEvent(event);
    }
  });
};

// Convenience functions
export const showErrorAlert = (title: string, message?: string, buttons?: ThemedAlertButton[]): Promise<number> => {
  return showThemedAlert({ title, message, type: 'error', buttons });
};

export const showSuccessAlert = (title: string, message?: string, buttons?: ThemedAlertButton[]): Promise<number> => {
  return showThemedAlert({ title, message, type: 'success', buttons });
};

export const showWarningAlert = (title: string, message?: string, buttons?: ThemedAlertButton[]): Promise<number> => {
  return showThemedAlert({ title, message, type: 'warning', buttons });
};

export const showInfoAlert = (title: string, message?: string, buttons?: ThemedAlertButton[]): Promise<number> => {
  return showThemedAlert({ title, message, type: 'info', buttons });
};

export default ThemedAlertComponent;
