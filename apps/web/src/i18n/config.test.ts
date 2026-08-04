import { describe, it, expect } from 'vitest'
import { SUPPORTED_LOCALES, DEFAULT_LOCALE, FALLBACK_LOCALE, isSupportedLocale } from './config'

describe('i18n config', () => {
  it('supports exactly sv, en, de', () => {
    expect([...SUPPORTED_LOCALES]).toEqual(['sv', 'en', 'de'])
  })

  it('default is sv, fallback is en', () => {
    expect(DEFAULT_LOCALE).toBe('sv')
    expect(FALLBACK_LOCALE).toBe('en')
  })

  it('isSupportedLocale narrows valid strings and rejects others', () => {
    expect(isSupportedLocale('de')).toBe(true)
    expect(isSupportedLocale('fr')).toBe(false)
    expect(isSupportedLocale(null)).toBe(false)
    expect(isSupportedLocale(42)).toBe(false)
  })
})
