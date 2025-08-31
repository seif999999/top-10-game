import { Platform } from 'react-native';

// Server configuration for different environments
export const SERVER_CONFIG = {
  // Development server URLs
  development: {
    localhost: 'http://localhost:3001',
    lan: 'http://192.168.1.12:3001', // Your computer's actual LAN IP
    tunnel: 'https://your-ngrok-url.ngrok.io' // If using ngrok
  },
  // Production server URL
  production: 'https://your-production-server.com'
};

// Get the appropriate server URL based on platform and environment
export const getServerUrl = (): string => {
  if (__DEV__) {
    // In development, use different URLs based on platform
    if (Platform.OS === 'web') {
      return SERVER_CONFIG.development.localhost;
    } else {
      // For mobile, prefer LAN IP over localhost
      return SERVER_CONFIG.development.lan;
    }
  }
  
  // In production, use production URL
  return SERVER_CONFIG.production;
};

// Get Socket.io transport configuration
export const getSocketConfig = () => {
  if (Platform.OS === 'web') {
    return {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    };
  } else {
    // For mobile, force WebSocket only for better compatibility
    return {
      transports: ['websocket'],
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      forceNew: true,
      autoConnect: true
    };
  }
};
