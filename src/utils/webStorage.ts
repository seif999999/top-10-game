import { Platform } from 'react-native';
import { logger } from './logger';

// Web-specific storage utilities
export const isWebPlatform = Platform.OS === 'web';

// Web-specific localStorage wrapper
export const webStorage = {
  getItem: (key: string): string | null => {
    if (isWebPlatform && typeof window !== 'undefined') {
      try {
        return localStorage.getItem(key);
      } catch (error) {
        logger.warn('Error accessing localStorage:', error);
        return null;
      }
    }
    return null;
  },
  
  setItem: (key: string, value: string): void => {
    if (isWebPlatform && typeof window !== 'undefined') {
      try {
        localStorage.setItem(key, value);
      } catch (error) {
        logger.warn('Error setting localStorage:', error);
      }
    }
  },
  
  removeItem: (key: string): void => {
    if (isWebPlatform && typeof window !== 'undefined') {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        logger.warn('Error removing from localStorage:', error);
      }
    }
  },
  
  clear: (): void => {
    if (isWebPlatform && typeof window !== 'undefined') {
      try {
        localStorage.clear();
      } catch (error) {
        logger.warn('Error clearing localStorage:', error);
      }
    }
  }
};

// Web-specific session storage wrapper
export const webSessionStorage = {
  getItem: (key: string): string | null => {
    if (isWebPlatform && typeof window !== 'undefined') {
      try {
        return sessionStorage.getItem(key);
      } catch (error) {
        logger.warn('Error accessing sessionStorage:', error);
        return null;
      }
    }
    return null;
  },
  
  setItem: (key: string, value: string): void => {
    if (isWebPlatform && typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(key, value);
      } catch (error) {
        logger.warn('Error setting sessionStorage:', error);
      }
    }
  },
  
  removeItem: (key: string): void => {
    if (isWebPlatform && typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem(key);
      } catch (error) {
        logger.warn('Error removing from sessionStorage:', error);
      }
    }
  },
  
  clear: (): void => {
    if (isWebPlatform && typeof window !== 'undefined') {
      try {
        sessionStorage.clear();
      } catch (error) {
        logger.warn('Error clearing sessionStorage:', error);
      }
    }
  }
};
