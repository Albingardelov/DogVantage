import { isSupportedLocale, FALLBACK_LOCALE, type Locale } from './config'

export interface LocaleInputs {
  /** user_settings.locale (DB source of truth) */
  stored?: string | null
  /** device cache: localStorage on web, AsyncStorage on RN */
  cached?: string | null
  /** navigator.language on web, expo-localization on RN */
  deviceLanguage?: string | null
}

export function resolveLocale(inputs: LocaleInputs): Locale {
  if (isSupportedLocale(inputs.stored)) return inputs.stored
  if (isSupportedLocale(inputs.cached)) return inputs.cached
  const device = inputs.deviceLanguage?.slice(0, 2).toLowerCase()
  if (isSupportedLocale(device)) return device
  return FALLBACK_LOCALE
}
