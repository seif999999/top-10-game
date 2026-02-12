import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import { I18nManager, Platform } from 'react-native';
import { resources, defaultNS, namespaces, supportedLanguages, SupportedLanguage } from '../locales';

/**
 * Detects the device locale and returns a supported language code.
 * Falls back to 'en' if the device locale is not supported.
 */
function getDeviceLanguage(): SupportedLanguage {
  try {
    const locales = getLocales();
    if (locales && locales.length > 0) {
      const deviceLang = locales[0].languageCode;
      if (deviceLang && supportedLanguages.includes(deviceLang as SupportedLanguage)) {
        return deviceLang as SupportedLanguage;
      }
    }
  } catch {
    // Fallback silently if expo-localization fails (e.g., in tests)
  }
  return 'en';
}

/** RTL languages supported by the app */
const RTL_LANGUAGES: ReadonlySet<string> = new Set(['ar']);

/**
 * Returns whether the given language code is RTL.
 */
export function isRTLLanguage(lang: string): boolean {
  return RTL_LANGUAGES.has(lang);
}

/** Set when language was changed on native; app restart needed for layout direction to apply. */
let rtlRestartRequired = false;

/**
 * Applies layout direction. We keep LTR always so that changing language only changes
 * the text, not the layout (no flip from left-to-right to right-to-left).
 * - Web: always set document.documentElement.dir to 'ltr'.
 * - Native: force LTR so layout never flips on language change.
 */
export function applyRTL(_lang: string): void {
  if (Platform.OS === 'web') {
    if (typeof document !== 'undefined') {
      document.documentElement.dir = 'ltr';
      document.documentElement.lang = _lang;
    }
    rtlRestartRequired = false;
    return;
  }

  // Native: keep LTR so language change does not flip layout
  I18nManager.allowRTL(false);
  if (I18nManager.isRTL) {
    I18nManager.forceRTL(false);
    rtlRestartRequired = true;
  }
}

/**
 * Returns true if the user changed language on a native platform and the app should be restarted
 * for layout direction (RTL/LTR) to take effect. Use this to show a "Restart app" message or trigger reload.
 */
export function isRTLRestartRequired(): boolean {
  return rtlRestartRequired;
}

/** Call after the app has been restarted (e.g. from persistence) so we clear the restart flag. */
export function clearRTLRestartRequired(): void {
  rtlRestartRequired = false;
}

/**
 * Changes the i18next language and applies RTL layout.
 * This is the primary way to change language — call this instead of i18n.changeLanguage directly.
 * On native, if the layout direction actually changed, isRTLRestartRequired() will be true afterward.
 */
export async function changeAppLanguage(lang: SupportedLanguage): Promise<void> {
  applyRTL(lang);
  await i18n.changeLanguage(lang);
}

// Detect device language for initial setup
const detectedLanguage = getDeviceLanguage();

/**
 * Performance note: All namespaces are loaded up front via `resources` from locales.
 * Components using useTranslation re-render when language changes (by design).
 * If bundle size becomes an issue, consider lazy-loading namespaces (e.g. i18next backend
 * or loadNamespaces per screen) and document in TRANSLATION_WORKFLOW.md.
 */

// Initialize i18next
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: detectedLanguage,
    fallbackLng: 'en',
    defaultNS,
    ns: [...namespaces],

    interpolation: {
      // React already handles escaping
      escapeValue: false,
    },

    // React-i18next options
    react: {
      useSuspense: false, // Disable suspense to avoid issues with React Native
    },

    // Compatibility / migration
    compatibilityJSON: 'v4',
  });

// Apply initial RTL setting (so next launch uses correct direction)
applyRTL(detectedLanguage);
clearRTLRestartRequired();

export default i18n;
