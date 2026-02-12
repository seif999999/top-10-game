// @ts-nocheck
/* eslint-env node */
/* global require, __dirname, module */
/**
 * Metro bundler configuration for Expo/React Native
 *
 * Note: Path aliases are handled by babel-plugin-module-resolver in babel.config.js
 * Metro will use the transformed imports from Babel, so no additional resolver
 * configuration is needed here for path aliases.
 *
 * For web: prefer .web.ts so native-only modules (e.g. react-native-google-mobile-ads)
 * are never loaded. AdService.web.ts is used instead of AdService.ts on web.
 */

const fs = require('fs');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver = {
  ...config.resolver,
  platforms: ['ios', 'android', 'native', 'web'],
  sourceExts: [...(config.resolver.sourceExts || []), 'cjs', 'mjs'],
  unstable_enablePackageExports: false,
  resolveRequest(context, moduleName, platform) {
    const defaultResolve = context.resolveRequest;
    const result = defaultResolve(context, moduleName, platform);
    // On web, use .web variants so native-only modules are never loaded
    if (platform === 'web' && result && result.type === 'sourceFile' && result.filePath) {
      const p = result.filePath;
      const webReplacements = [
        [/AdConsentService\.ts$/, 'AdConsentService.web.ts'],
        [/AdService\.ts$/, 'AdService.web.ts'],
        [/BannerAd\.tsx$/, 'BannerAd.web.tsx'],
      ];
      for (const [re, replacement] of webReplacements) {
        if (re.test(p) && !p.includes('.web.')) {
          const webPath = p.replace(re, replacement);
          try {
            fs.accessSync(webPath);
            return { filePath: webPath, type: 'sourceFile' };
          } catch {
            // Web variant file not found; fall through to default resolve
          }
          break;
        }
      }
    }
    return result;
  },
};

module.exports = config;
