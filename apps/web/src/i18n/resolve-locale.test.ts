import { describe, it, expect } from 'vitest'
import { resolveLocale } from './resolve-locale'

describe('resolveLocale', () => {
  it('1. prefers stored DB locale when supported', () => {
    expect(resolveLocale({ stored: 'de', cached: 'en', deviceLanguage: 'sv' })).toBe('de')
  })

  it('2. falls back to device cache when stored missing/invalid', () => {
    expect(resolveLocale({ stored: null, cached: 'en', deviceLanguage: 'sv-SE' })).toBe('en')
    expect(resolveLocale({ stored: 'fr', cached: 'en' })).toBe('en')
  })

  it('3. uses device language (region-stripped) when supported', () => {
    expect(resolveLocale({ deviceLanguage: 'de-DE' })).toBe('de')
    expect(resolveLocale({ deviceLanguage: 'sv' })).toBe('sv')
  })

  it('4. falls back to en when nothing matches', () => {
    expect(resolveLocale({ deviceLanguage: 'fr-FR' })).toBe('en')
    expect(resolveLocale({})).toBe('en')
  })
})
