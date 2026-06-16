import type { Locale } from './config'

const DIRECTIVES: Record<Locale, string> = {
  sv: 'Svara på svenska.',
  en: 'Always answer in English.',
  de: 'Antworte immer auf Deutsch.',
}

export function languageDirective(locale: Locale): string {
  return DIRECTIVES[locale]
}
