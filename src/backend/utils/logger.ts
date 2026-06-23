/**
 * Centralized logging utility.
 * Dev: logs to console. Production: errors are sent to Sentry.
 */

import * as Sentry from '@sentry/react-native';

const isDev = __DEV__;

function captureProductionError(...args: unknown[]) {
  const error = args.find((arg): arg is Error => arg instanceof Error);
  if (error) {
    const context = args
      .filter((arg) => typeof arg === 'string')
      .join(' ');
    Sentry.captureException(error, context ? { extra: { context } } : undefined);
    return;
  }

  const message = args.map((arg) => {
    if (typeof arg === 'string') return arg;
    try {
      return JSON.stringify(arg);
    } catch {
      return String(arg);
    }
  }).join(' ');

  if (message) {
    Sentry.captureMessage(message, 'error');
  }
}

export const logger = {
  log: (...args: unknown[]) => {
    if (isDev) {
      console.log(...args);
    }
  },

  error: (...args: unknown[]) => {
    if (isDev) {
      console.error(...args);
    } else {
      captureProductionError(...args);
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
  },
};
