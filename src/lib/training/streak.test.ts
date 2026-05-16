import { describe, expect, it } from 'vitest'
import { computeStreak } from './streak'

const TODAY = new Date('2026-05-16T12:00:00.000Z')

function logAt(isoDate: string) {
  return { created_at: `${isoDate}T09:00:00.000Z` }
}

describe('computeStreak', () => {
  it('returns 0 for empty logs', () => {
    expect(computeStreak([], TODAY)).toBe(0)
  })

  it('returns 1 when trained today', () => {
    expect(computeStreak([logAt('2026-05-16')], TODAY)).toBe(1)
  })

  it('counts consecutive days when trained today, yesterday and day before', () => {
    const logs = [logAt('2026-05-16'), logAt('2026-05-15'), logAt('2026-05-14')]
    expect(computeStreak(logs, TODAY)).toBe(3)
  })

  it('keeps streak alive when trained yesterday but not today', () => {
    const logs = [logAt('2026-05-15'), logAt('2026-05-14')]
    expect(computeStreak(logs, TODAY)).toBe(2)
  })

  it('stops at first gap in streak', () => {
    const logs = [logAt('2026-05-16'), logAt('2026-05-15'), logAt('2026-05-13')]
    expect(computeStreak(logs, TODAY)).toBe(2)
  })

  it('counts multiple logs on same day as one day', () => {
    const logs = [logAt('2026-05-16'), logAt('2026-05-16'), logAt('2026-05-15')]
    expect(computeStreak(logs, TODAY)).toBe(2)
  })
})
