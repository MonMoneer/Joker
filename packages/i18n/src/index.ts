import { en, type TranslationKeys } from './en';
import { ka } from './ka';

export type Language = 'en' | 'ka';
export type { TranslationKeys };

const translations: Record<Language, TranslationKeys> = { en, ka };

export function getTranslations(lang: Language): TranslationKeys {
  return translations[lang] || translations.en;
}

export { en, ka };
