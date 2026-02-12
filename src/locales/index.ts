// English translations
import enCommon from './en/common.json';
import enScreens from './en/screens.json';
import enGame from './en/game.json';
import enErrors from './en/errors.json';
import enCategories from './en/categories.json';
import enComponents from './en/components.json';

// Arabic translations
import arCommon from './ar/common.json';
import arScreens from './ar/screens.json';
import arGame from './ar/game.json';
import arErrors from './ar/errors.json';
import arCategories from './ar/categories.json';
import arComponents from './ar/components.json';

export const resources = {
  en: {
    common: enCommon,
    screens: enScreens,
    game: enGame,
    errors: enErrors,
    categories: enCategories,
    components: enComponents,
  },
  ar: {
    common: arCommon,
    screens: arScreens,
    game: arGame,
    errors: arErrors,
    categories: arCategories,
    components: arComponents,
  },
} as const;

export const namespaces = ['common', 'screens', 'game', 'errors', 'categories', 'components'] as const;
export type Namespace = (typeof namespaces)[number];

export const defaultNS = 'common';
export const supportedLanguages = ['en', 'ar'] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];
