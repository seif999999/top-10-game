import type { resources } from '../locales';
import type { TranslationKey } from './generated-i18n-keys';

/** Augment i18next with our app's resource types for type-safe translations. */
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: (typeof resources)['en'];
    returnNull: false;
  }
}

export type { TranslationKey };
