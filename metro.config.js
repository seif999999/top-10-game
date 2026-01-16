// @ts-nocheck
/* eslint-env node */
/* global require, __dirname, module */
/**
 * Metro bundler configuration for Expo/React Native
 * 
 * Note: Path aliases are handled by babel-plugin-module-resolver in babel.config.js
 * Metro will use the transformed imports from Babel, so no additional resolver
 * configuration is needed here for path aliases.
 */

const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Enhanced configuration for web compatibility and better module resolution
config.resolver = {
  ...config.resolver,
  platforms: ['ios', 'android', 'native', 'web'],
  sourceExts: [...(config.resolver.sourceExts || []), 'cjs', 'mjs'],
  unstable_enablePackageExports: false,
};

module.exports = config;
