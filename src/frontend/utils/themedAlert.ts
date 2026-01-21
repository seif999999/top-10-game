/**
 * Themed Alert Utility
 * Provides a simple API for showing themed alerts throughout the app
 */

import { showCrossPlatformAlert, showErrorAlert, showSuccessAlert, showWarningAlert, showInfoAlert } from '../components/CrossPlatformAlert';

export const ThemedAlert = {
  /**
   * Show a generic alert
   */
  alert: (title: string, message?: string, buttons?: Array<{ text: string; onPress?: () => void; style?: 'default' | 'cancel' | 'destructive' }>) => {
    showCrossPlatformAlert({ title, message, buttons, type: 'default' });
  },

  /**
   * Show an error alert
   */
  error: (title: string, message?: string, buttons?: Array<{ text: string; onPress?: () => void; style?: 'default' | 'cancel' | 'destructive' }>) => {
    showErrorAlert(title, message, buttons);
  },

  /**
   * Show a success alert
   */
  success: (title: string, message?: string, buttons?: Array<{ text: string; onPress?: () => void; style?: 'default' | 'cancel' | 'destructive' }>) => {
    showSuccessAlert(title, message, buttons);
  },

  /**
   * Show a warning alert
   */
  warning: (title: string, message?: string, buttons?: Array<{ text: string; onPress?: () => void; style?: 'default' | 'cancel' | 'destructive' }>) => {
    showWarningAlert(title, message, buttons);
  },

  /**
   * Show an info alert
   */
  info: (title: string, message?: string, buttons?: Array<{ text: string; onPress?: () => void; style?: 'default' | 'cancel' | 'destructive' }>) => {
    showInfoAlert(title, message, buttons);
  },
};

export default ThemedAlert;
