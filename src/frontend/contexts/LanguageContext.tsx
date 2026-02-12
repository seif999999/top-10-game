import React, { createContext, useContext, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { useTranslation, TFunction } from 'react-i18next';
import { changeAppLanguage, isRTLLanguage, isRTLRestartRequired } from '../../config/i18n';
import { logger } from '../../backend/utils/logger';
import type { SupportedLanguage } from '../../locales';

type Language = SupportedLanguage;

interface LanguageContextType {
  /** i18next translation function — use this for all translated strings */
  t: TFunction;

  /** Current language code (e.g. 'en', 'ar') */
  currentLanguage: Language;

  /** Change the app language — updates i18next, RTL, and persists to storage */
  changeLanguage: (lang: Language) => Promise<void>;

  /** Whether the current language is RTL */
  isRTL: boolean;

  /** Whether user changed to/from RTL on native; app restart needed for layout to apply */
  isRTLRestartRequired: boolean;

  // ── Backward-compatible aliases (existing screens use these) ──

  /** @deprecated Use `currentLanguage` instead */
  language: Language;

  /** @deprecated Use `changeLanguage` instead */
  setLanguage: (lang: Language) => Promise<void>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = 'app_language';

/** Normalize i18next language (e.g. 'en-US', 'ar-EG') to SupportedLanguage ('en' | 'ar'). */
function toSupportedLanguage(lang: string | undefined): Language {
  const base = (lang || '').split('-')[0];
  return base === 'ar' ? 'ar' : 'en';
}

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { t, i18n } = useTranslation();

  // Derive state from i18next, normalized to 'en' | 'ar' so UI and comparisons are consistent
  const currentLanguage = toSupportedLanguage(i18n.language);
  const isRTL = isRTLLanguage(currentLanguage);

  // Load saved language preference on mount
  useEffect(() => {
    loadSavedLanguage();
  }, []);

  const loadSavedLanguage = useCallback(async () => {
    try {
      let savedLanguage: string | null = null;

      if (Platform.OS === 'web') {
        savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      } else {
        savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      }

      if (savedLanguage === 'en' || savedLanguage === 'ar') {
        const current = (i18n.language || '').split('-')[0];
        if (current !== savedLanguage) {
          await changeAppLanguage(savedLanguage);
        }
      }
    } catch (error) {
      logger.error('Error loading language:', error);
    }
  }, []);

  const changeLanguage = useCallback(async (lang: Language) => {
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

  const value: LanguageContextType = {
    // New API
    t,
    currentLanguage,
    changeLanguage,
    isRTL,
    isRTLRestartRequired: isRTLRestartRequired(),

    // Backward-compatible aliases
    language: currentLanguage,
    setLanguage: changeLanguage,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
