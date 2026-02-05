/**
 * Environment Configuration
 * Supports dev, staging, and production environments
 */

import { logger } from '../utils/logger';

export type Environment = 'development' | 'staging' | 'production';

export interface EnvironmentConfig {
  name: Environment;
  isDevelopment: boolean;
  isStaging: boolean;
  isProduction: boolean;
  
  // Firebase
  firebase: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    measurementId?: string;
  };
  
  // Feature flags
  features: {
    enableAnalytics: boolean;
    enableCrashReporting: boolean;
    enablePerformanceMonitoring: boolean;
    enableDebugMode: boolean;
    enableMockData: boolean;
  };
  
  // API settings
  api: {
    timeout: number;
    retryAttempts: number;
    baseUrl?: string;
  };
  
  // Rate limiting
  rateLimits: {
    maxRoomCreationsPerHour: number;
    maxAnswerSubmissionsPerMinute: number;
    maxLoginAttemptsPerHour: number;
  };
  
  // Logging
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    enableConsole: boolean;
    enableRemote: boolean;
  };
}

/**
 * Get current environment from env var
 */
function getCurrentEnvironment(): Environment {
  const env = process.env.EXPO_PUBLIC_ENVIRONMENT || process.env.NODE_ENV || 'development';
  
  switch (env.toLowerCase()) {
    case 'production':
    case 'prod':
      return 'production';
    case 'staging':
    case 'stage':
      return 'staging';
    default:
      return 'development';
  }
}

/**
 * Get environment-specific Firebase config
 * Uses prefixed env vars for different environments
 */
function getFirebaseConfig(env: Environment): EnvironmentConfig['firebase'] {
  // Try environment-specific vars first, then fall back to default
  const prefix = env === 'production' ? 'EXPO_PUBLIC_FIREBASE_PROD_' 
    : env === 'staging' ? 'EXPO_PUBLIC_FIREBASE_STAGING_'
    : 'EXPO_PUBLIC_FIREBASE_';
  
  const fallbackPrefix = 'EXPO_PUBLIC_FIREBASE_';
  
  const getEnvVar = (key: string): string => {
    return process.env[`${prefix}${key}`] || process.env[`${fallbackPrefix}${key}`] || '';
  };
  
  return {
    apiKey: getEnvVar('API_KEY'),
    authDomain: getEnvVar('AUTH_DOMAIN'),
    projectId: getEnvVar('PROJECT_ID'),
    storageBucket: getEnvVar('STORAGE_BUCKET'),
    messagingSenderId: getEnvVar('MESSAGING_SENDER_ID'),
    appId: getEnvVar('APP_ID'),
    measurementId: getEnvVar('MEASUREMENT_ID') || undefined,
  };
}

/**
 * Build environment configuration
 */
function buildConfig(env: Environment): EnvironmentConfig {
  const isDev = env === 'development';
  const isStaging = env === 'staging';
  const isProd = env === 'production';
  
  return {
    name: env,
    isDevelopment: isDev,
    isStaging: isStaging,
    isProduction: isProd,
    
    firebase: getFirebaseConfig(env),
    
    features: {
      enableAnalytics: isProd || isStaging,
      enableCrashReporting: isProd || isStaging,
      enablePerformanceMonitoring: isProd,
      enableDebugMode: isDev,
      enableMockData: isDev && (process.env.EXPO_PUBLIC_USE_MOCK_DATA === 'true'),
    },
    
    api: {
      timeout: isDev ? 30000 : 15000,
      retryAttempts: isDev ? 1 : 3,
      baseUrl: process.env.EXPO_PUBLIC_API_BASE_URL,
    },
    
    rateLimits: {
      maxRoomCreationsPerHour: isDev ? 100 : isProd ? 10 : 20,
      maxAnswerSubmissionsPerMinute: isDev ? 100 : 30,
      maxLoginAttemptsPerHour: isDev ? 100 : 10,
    },
    
    logging: {
      level: isDev ? 'debug' : isProd ? 'error' : 'warn',
      enableConsole: isDev || isStaging,
      enableRemote: isProd || isStaging,
    },
  };
}

// Current environment
const currentEnv = getCurrentEnvironment();
const config = buildConfig(currentEnv);

// Log environment on startup
logger.log(`🌍 Environment: ${config.name.toUpperCase()}`);
logger.log(`   Debug Mode: ${config.features.enableDebugMode}`);
logger.log(`   Analytics: ${config.features.enableAnalytics}`);
logger.log(`   Firebase Project: ${config.firebase.projectId}`);

/**
 * Export environment configuration
 */
export const ENV = config;
export const ENVIRONMENT = config.name;
export const IS_DEV = config.isDevelopment;
export const IS_STAGING = config.isStaging;
export const IS_PROD = config.isProduction;

/**
 * Helper to check if a feature is enabled
 */
export function isFeatureEnabled(feature: keyof EnvironmentConfig['features']): boolean {
  return config.features[feature];
}

/**
 * Get rate limit for a specific action
 */
export function getRateLimit(action: keyof EnvironmentConfig['rateLimits']): number {
  return config.rateLimits[action];
}

/**
 * Validate environment configuration
 */
export function validateConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  const requiredFirebaseKeys = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
  
  for (const key of requiredFirebaseKeys) {
    if (!config.firebase[key as keyof typeof config.firebase]) {
      errors.push(`Missing Firebase config: ${key}`);
    }
  }
  
  if (errors.length > 0) {
    logger.error('❌ Environment configuration errors:', errors);
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

export default config;
