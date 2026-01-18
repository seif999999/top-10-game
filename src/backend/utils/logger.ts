/**
 * Centralized logging utility that respects environment
 * Only logs in development mode, silent in production
 */

const isDev = __DEV__;

export const logger = {
  log: (...args: unknown[]) => {
    if (isDev) {
      console.log(...args);
    }
  },
  
  error: (...args: unknown[]) => {
    if (isDev) {
      console.error(...args);
    }
  },
  
  warn: (...args: unknown[]) => {
    if (isDev) {
      console.warn(...args);
    }
  },
  
  info: (...args: unknown[]) => {
    if (isDev) {
      console.info(...args);
    }
  },
  
  debug: (...args: unknown[]) => {
    if (isDev) {
      console.debug(...args);
    }
  }
};

