// @ts-nocheck
/* eslint-env node */
/* global require, __dirname, module */
/**
 * Metro bundler configuration for Expo/React Native
 *
 * Note: Path aliases are handled by babel-plugin-module-resolver in babel.config.js
 *
 * For web: prefer .web.ts so native-only modules (e.g. react-native-google-mobile-ads)
 * are never loaded. AdService.web.ts is used instead of AdService.ts on web.
 *
 * Sentry source maps for EAS builds are handled by the @sentry/react-native/expo
 * config plugin in app.config.js.
 */

const fs = require('fs');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

const originalResolveRequest = config.resolver?.resolveRequest;

config.resolver = {
  ...config.resolver,
  platforms: ['ios', 'android', 'native', 'web'],
  sourceExts: [...(config.resolver.sourceExts || []), 'cjs', 'mjs'],
  unstable_conditionNames: ['require', 'import', 'react-native', 'browser', 'default'],
  resolveRequest(context, moduleName, platform) {
    const resolve =
      originalResolveRequest ??
      ((ctx, name, plt) => ctx.resolveRequest(ctx, name, plt));
    const result = resolve(context, moduleName, platform);
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
            // fall through
          }
          break;
        }
      }
    }
    return result;
  },
};

module.exports = config;
