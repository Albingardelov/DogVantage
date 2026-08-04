import i18next, { type i18n } from 'i18next'
import { initReactI18next } from 'react-i18next'
import { resources } from './messages'
import { FALLBACK_LOCALE, type Locale } from './config'

export function createI18nInstance(locale: Locale): i18n {
  const instance = i18next.createInstance()
  instance.use(initReactI18next).init({
    resources,
    lng: locale,
    fallbackLng: FALLBACK_LOCALE,
    interpolation: { escapeValue: false },
    returnNull: false,
    // i18next v26 renamed initImmediate -> initAsync (inverted): sync resource
    // loading so t() works right after init without awaiting the callback.
    initAsync: false,
  })
  return instance
}
