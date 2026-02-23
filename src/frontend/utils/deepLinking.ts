import { Linking } from 'react-native';
import { NavigationContainerRef } from '@react-navigation/native';
import { logger } from '../../backend/utils/logger';
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
    
    // Security: Validate URL origin - only allow Firebase auth URLs
    const allowedOrigins = [
      'firebaseapp.com',
      'firebase.googleapis.com',
      'accounts.google.com'
    ];
    const urlHost = urlObj.hostname.toLowerCase();
    const isAllowedOrigin = allowedOrigins.some(origin => urlHost.includes(origin));
    
    if (!isAllowedOrigin) {
      logger.warn('⚠️ Deep link from untrusted origin:', urlHost);
      return false;
    }
    
    const oobCode = urlObj.searchParams.get('oobCode');
    const mode = urlObj.searchParams.get('mode');
    
    // Validate oobCode format (Firebase oobCodes are typically base64-like strings)
    if (oobCode && (!/^[A-Za-z0-9_-]+$/.test(oobCode) || oobCode.length < 20 || oobCode.length > 200)) {
      logger.warn('⚠️ Invalid oobCode format detected');
      return false;
    }
    
    // Check if this is a password reset link
    if (mode === 'resetPassword' && oobCode) {
      logger.log('🔗 Password reset link detected:', { mode });
      
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
  }).catch((e) => logger.warn('Deep linking: getInitialURL failed', e));

  // Handle URL changes (when app is already running)
  const linkingListener = Linking.addEventListener('url', (event) => {
    handlePasswordResetLink(event.url, navigation);
  });

  return linkingListener;
};
