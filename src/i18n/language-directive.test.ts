import { describe, it, expect } from 'vitest'
import { languageDirective } from './language-directive'

describe('languageDirective', () => {
  it('returns a Swedish directive for sv', () => {
    expect(languageDirective('sv')).toBe('Svara på svenska.')
  })
  it('returns an English directive for en', () => {
    expect(languageDirective('en')).toBe('Always answer in English.')
  })
  it('returns a German directive for de', () => {
    expect(languageDirective('de')).toBe('Antworte immer auf Deutsch.')
  })
})
