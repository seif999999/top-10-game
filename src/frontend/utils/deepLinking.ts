import { Linking } from 'react-native';
import { NavigationContainerRef } from '@react-navigation/native';
import { logger } from './logger';
import type { RootStackParamList } from '../../shared/types/navigation';

/**
 * Deep linking utility for handling Firebase password reset links
 * This ensures users are directed to our custom password reset screen
 * instead of Firebase's default page
 */

export const handlePasswordResetLink = (url: string, navigation: NavigationContainerRef<RootStackParamList>) => {
  try {
    // Parse the URL to extract the reset code
    const urlObj = new URL(url);
    const oobCode = urlObj.searchParams.get('oobCode');
    const mode = urlObj.searchParams.get('mode');
    
    // Check if this is a password reset link
    if (mode === 'resetPassword' && oobCode) {
      logger.log('🔗 Password reset link detected:', { oobCode, mode });
      
      // Navigate to our custom password reset screen
      navigation.navigate('ResetPassword', { oobCode });
      return true;
    }
    
    return false;
  } catch (error) {
    logger.error('Error parsing password reset link:', error);
    return false;
  }
};

export const setupDeepLinking = (navigation: NavigationContainerRef<RootStackParamList>) => {
  // Handle initial URL (when app is opened via deep link)
  Linking.getInitialURL().then((url) => {
    if (url) {
      handlePasswordResetLink(url, navigation);
    }
  });

  // Handle URL changes (when app is already running)
  const linkingListener = Linking.addEventListener('url', (event) => {
    handlePasswordResetLink(event.url, navigation);
  });

  return linkingListener;
};
