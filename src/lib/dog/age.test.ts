import { describe, it, expect } from 'vitest'
import { getAgeInWeeks } from './age'

describe('getAgeInWeeks', () => {
  it('returns 0 for a dog born today', () => {
    const today = new Date().toISOString().split('T')[0]
    expect(getAgeInWeeks(today)).toBe(0)
  })

  it('returns 8 for a dog born exactly 56 days ago', () => {
    const birthdate = new Date(Date.now() - 56 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0]
    expect(getAgeInWeeks(birthdate)).toBe(8)
  })

  it('returns 12 for a dog born 84 days ago', () => {
    const birthdate = new Date(Date.now() - 84 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0]
    expect(getAgeInWeeks(birthdate)).toBe(12)
  })

  it('floors partial weeks', () => {
    const birthdate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0]
    expect(getAgeInWeeks(birthdate)).toBe(1)
  })
})
