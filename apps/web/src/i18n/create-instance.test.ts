import { describe, it, expect } from 'vitest'
import { createI18nInstance } from './create-instance'

describe('createI18nInstance', () => {
  it('translates a known key in the requested locale', () => {
    const i = createI18nInstance('en')
    expect(i.t('nav.dashboard')).toBe('Home')
  })

  it('interpolates variables', () => {
    const i = createI18nInstance('sv')
    expect(i.t('dashboard.programWeek', { week: 5 })).toBe('Programvecka 5')
  })

  it('applies plural forms (_one/_other)', () => {
    const i = createI18nInstance('sv')
    expect(i.t('billing.trialDaysLeft', { count: 1 })).toBe('1 dag kvar av Pro-trial')
    expect(i.t('billing.trialDaysLeft', { count: 3 })).toBe('3 dagar kvar av Pro-trial')
  })

  it('creates isolated instances (no shared global language)', () => {
    const a = createI18nInstance('sv')
    const b = createI18nInstance('de')
    expect(a.language).toBe('sv')
    expect(b.language).toBe('de')
  })
})
