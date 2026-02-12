import { useCallback, useMemo } from 'react';
import { useTranslation as useI18nextTranslation } from 'react-i18next';
import i18n from '../config/i18n';
import { changeAppLanguage, isRTLRestartRequired } from '../config/i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import type { Namespace, SupportedLanguage } from '../locales';
import type { TranslationKey } from '../types/generated-i18n-keys';
import { logger } from '../backend/utils/logger';

// Re-export types for convenience
export type { Namespace, SupportedLanguage } from '../locales';
export type { TranslationKey } from '../types/generated-i18n-keys';

// ─── Storage key (same as LanguageContext for consistency) ───────────────────

const LANGUAGE_STORAGE_KEY = 'app_language';

// ─── Main hook ──────────────────────────────────────────────────────────────

/**
 * Primary hook for accessing translations throughout the app.
 *
 * @param ns - Optional namespace or array of namespaces.
 *             Defaults to 'common' if omitted.
 *
 * @example
 * ```tsx
 * // Default namespace (common)
 * const { t, isRTL } = useAppTranslation();
 * <Text>{t('save')}</Text>
 *
 * // Specific namespace
 * const { t } = useAppTranslation('game');
 * <Text>{t('timer.label')}</Text>
 *
 * // Multiple namespaces
 * const { t } = useAppTranslation(['screens', 'errors']);
 * <Text>{t('screens:auth.signIn')}</Text>
 * <Text>{t('errors:network')}</Text>
 * ```
 */
/** Type-safe translation function: first argument is restricted to valid keys for autocomplete. */
export type TypedT = (key: TranslationKey, options?: Record<string, unknown>) => string;

export function useAppTranslation(ns?: Namespace | Namespace[]) {
  const { t, i18n: i18nInstance } = useI18nextTranslation(ns);

  const currentLanguage = (i18nInstance.language as SupportedLanguage) || 'en';
  // Always LTR so that changing language only changes text, not layout direction
  const isRTL = false;

  /** t() with type-safe key for autocomplete; use for known keys. For dynamic keys use (t as (k: string) => string)(key). */
  const typedT = t as TypedT;

  const changeLanguage = useCallback(async (lang: SupportedLanguage) => {
    try {
      await changeAppLanguage(lang);

      if (Platform.OS === 'web') {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
      } else {
        await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
      }

      logger.log('Language changed to:', lang);
    } catch (error) {
      logger.error('Error changing language:', error);
    }
  }, []);

  return { t: typedT, currentLanguage, changeLanguage, isRTL, isRTLRestartRequired: isRTLRestartRequired() };
}

export { isRTLRestartRequired };

// ─── Helper functions (usable outside React components) ─────────────────────

/**
 * Translates a game category key.
 * Works both inside and outside React components.
 *
 * @example
 * ```ts
 * translateCategory('sports')  // "Sports" or "رياضة"
 * translateCategory('movies')  // "Movies" or "أفلام"
 * ```
 */
export function translateCategory(categoryKey: string): string {
  return i18n.t(categoryKey, { ns: 'categories' });
}

/**
 * Translates an error key. Supports both flat and nested keys.
 * Works both inside and outside React components.
 *
 * @example
 * ```ts
 * translateError('network')            // "Network error. Please check your connection."
 * translateError('auth.weakPassword')  // "Password is too weak"
 * translateError('room.notFound')      // "Room not found"
 * ```
 */
export function translateError(errorKey: string): string {
  return i18n.t(errorKey, { ns: 'errors' });
}

/**
 * Formats a number respecting the current locale.
 * Arabic locale uses Eastern Arabic numerals (٠١٢٣٤٥٦٧٨٩).
 *
 * @example
 * ```ts
 * // When language is 'en':
 * formatScore(1500)  // "1,500"
 *
 * // When language is 'ar':
 * formatScore(1500)  // "١٬٥٠٠"
 * ```
 */
export function formatScore(score: number): string {
  const lang = i18n.language || 'en';
  try {
    return new Intl.NumberFormat(lang).format(score);
  } catch {
    // Fallback if Intl is not available (some older RN environments)
    return String(score);
  }
}

/**
 * React hook that returns memoized helper functions bound to the current language.
 * Use this when you need helpers that re-render on language change.
 *
 * @example
 * ```tsx
 * const { translateCategory, translateError, formatScore } = useTranslationHelpers();
 * <Text>{translateCategory('sports')}</Text>
 * <Text>{formatScore(2500)}</Text>
 * ```
 */
export function useTranslationHelpers() {
  const { currentLanguage } = useAppTranslation();

  return useMemo(
    () => ({
      translateCategory,
      translateError,
      formatScore,
    }),
    // Re-create when language changes so components re-render with fresh translations
    [currentLanguage]
  );
}

export default useAppTranslation;
