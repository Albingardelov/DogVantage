import sv from './locales/sv.json'
import en from './locales/en.json'
import de from './locales/de.json'

// i18next "translation" namespace per locale; nested keys via '.' separator.
export const resources = {
  sv: { translation: sv },
  en: { translation: en },
  de: { translation: de },
} as const
