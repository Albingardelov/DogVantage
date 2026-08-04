import { describe, it, expect } from 'vitest'
import { getAgeInWeeks, getLifeStage, isPuppy, isPuppyMode, autoAdvancedTrainingWeek } from './age'

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
}

describe('autoAdvancedTrainingWeek', () => {
  it('returns null without a homecome date', () => {
    expect(autoAdvancedTrainingWeek(1, undefined)).toBeNull()
  })

  it('returns null when stored week already matches the computed week', () => {
    expect(autoAdvancedTrainingWeek(1, daysAgo(3))).toBeNull()
  })

  it('advances to the computed week when time has passed', () => {
    expect(autoAdvancedTrainingWeek(1, daysAgo(26))).toBe(4)
  })

  it('returns null when stored week is ahead of the computed week (manual jump)', () => {
    expect(autoAdvancedTrainingWeek(10, daysAgo(26))).toBeNull()
  })

  it('treats missing stored week as week 1', () => {
    expect(autoAdvancedTrainingWeek(undefined, daysAgo(7))).toBe(2)
  })

  it('returns null before homecoming', () => {
    const future = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    expect(autoAdvancedTrainingWeek(1, future)).toBeNull()
  })
})

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

describe('isPuppyMode', () => {
  it('is true for puppies and juniors (< 26 weeks)', () => {
    expect(isPuppyMode(8)).toBe(true)
    expect(isPuppyMode(15)).toBe(true)
    expect(isPuppyMode(25)).toBe(true)
  })
  it('is false at 26 weeks and above', () => {
    expect(isPuppyMode(26)).toBe(false)
    expect(isPuppyMode(52)).toBe(false)
  })
  it('is false for 0 or undefined', () => {
    expect(isPuppyMode(0)).toBe(false)
    expect(isPuppyMode(undefined)).toBe(false)
  })
})
