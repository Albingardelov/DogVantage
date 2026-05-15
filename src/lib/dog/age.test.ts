import { describe, it, expect } from 'vitest'
import { getAgeInWeeks, getLifeStage, isPuppy } from './age'

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

describe('getLifeStage', () => {
  it('defaults to adult for undefined age', () => {
    expect(getLifeStage(undefined)).toBe('adult')
  })

  it('returns puppy below 16 weeks', () => {
    expect(getLifeStage(15)).toBe('puppy')
  })

  it('returns junior from week 16', () => {
    expect(getLifeStage(16)).toBe('junior')
  })

  it('returns adolescent from week 26', () => {
    expect(getLifeStage(26)).toBe('adolescent')
  })

  it('returns adult from week 52', () => {
    expect(getLifeStage(52)).toBe('adult')
  })
})

describe('isPuppy', () => {
  it('is true for puppy stage and false otherwise', () => {
    expect(isPuppy(10)).toBe(true)
    expect(isPuppy(16)).toBe(false)
  })
})
