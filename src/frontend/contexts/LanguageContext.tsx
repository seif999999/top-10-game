import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { logger } from '../../backend/utils/logger';

type Language = 'en' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = 'app_language';

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');
  const [isRTL, setIsRTL] = useState(false);

  // Load saved language preference on mount
  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      let savedLanguage: string | null = null;
      
      if (Platform.OS === 'web') {
        savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      } else {
        savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      }

      if (savedLanguage === 'en' || savedLanguage === 'ar') {
        setLanguageState(savedLanguage);
        setIsRTL(savedLanguage === 'ar');
      } else {
        // Default to English
        setLanguageState('en');
        setIsRTL(false);
      }
    } catch (error) {
      logger.error('Error loading language:', error);
      setLanguageState('en');
      setIsRTL(false);
    }
  };

  const setLanguage = async (lang: Language) => {
    try {
      setLanguageState(lang);
      setIsRTL(lang === 'ar');

      // Save to storage
      if (Platform.OS === 'web') {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
      } else {
        await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
      }

      logger.log('📚 Language changed to:', lang);
    } catch (error) {
      logger.error('Error saving language:', error);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, isRTL }}>
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
