import { Platform } from 'react-native';

// Web-specific navigation utilities
export const isWebPlatform = Platform.OS === 'web';

// Web-specific URL handling
export const getWebUrl = (path: string): string => {
  if (isWebPlatform && typeof window !== 'undefined') {
    const baseUrl = window.location.origin;
    return `${baseUrl}${path}`;
  }
  return path;
};

// Web-specific deep linking
export const handleWebDeepLink = (url: string): void => {
  if (isWebPlatform && typeof window !== 'undefined') {
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname;
      
      // Handle different routes
      switch (path) {
        case '/multiplayer':
          // Navigate to multiplayer menu
          break;
        case '/create-room':
          // Navigate to create room
          break;
        case '/join-room':
          // Navigate to join room
          break;
        default:
          // Handle other routes
          break;
      }
    } catch (error) {
      console.warn('Error handling web deep link:', error);
    }
  }
};

// Web-specific browser history
export const updateWebHistory = (path: string): void => {
  if (isWebPlatform && typeof window !== 'undefined') {
    try {
      window.history.pushState({}, '', path);
    } catch (error) {
      console.warn('Error updating web history:', error);
    }
  }
};
