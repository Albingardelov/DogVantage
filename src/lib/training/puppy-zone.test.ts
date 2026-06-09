import { describe, it, expect } from 'vitest'
import {
  selectYellowExercise,
  buildYellowExercise,
  getRecoveryTips,
  CALM_EXERCISE_IDS,
} from './puppy-zone'

describe('selectYellowExercise', () => {
  it('returns the first calm exercise with positive success rate', () => {
    const metrics = {
      nosework: { success_count: 0, fail_count: 3 },
      plats: { success_count: 4, fail_count: 1 },
      ligg: { success_count: 2, fail_count: 0 },
    }
    expect(selectYellowExercise(metrics)).toBe('plats')
  })

  it('falls back to nosework when no calm exercise has positive rate', () => {
    const metrics = {
      nosework: { success_count: 0, fail_count: 5 },
      plats: { success_count: 0, fail_count: 2 },
    }
    expect(selectYellowExercise(metrics)).toBe('nosework')
  })

  it('falls back to nosework when metrics is empty', () => {
    expect(selectYellowExercise({})).toBe('nosework')
  })

  it('only considers CALM_EXERCISE_IDS — ignores non-calm exercises', () => {
    const metrics = {
      inkallning: { success_count: 10, fail_count: 0 },
      nosework: { success_count: 0, fail_count: 1 },
    }
    expect(selectYellowExercise(metrics)).toBe('nosework')
  })
})

describe('buildYellowExercise', () => {
  it('returns an Exercise with 3 reps and a framing desc', () => {
    const ex = buildYellowExercise('plats')
    expect(ex.id).toBe('plats')
    expect(ex.reps).toBe(3)
    expect(ex.label).toBe('Plats')
    expect(ex.desc).toContain('3 repetitioner')
  })
})

describe('getRecoveryTips', () => {
  it('returns exactly 3 non-empty tips', () => {
    const tips = getRecoveryTips()
    expect(tips).toHaveLength(3)
    tips.forEach((t) => expect(t.length).toBeGreaterThan(0))
  })
})

describe('CALM_EXERCISE_IDS', () => {
  it('contains expected calm exercises', () => {
    expect(CALM_EXERCISE_IDS).toContain('nosework')
    expect(CALM_EXERCISE_IDS).toContain('plats')
    expect(CALM_EXERCISE_IDS).toContain('ligg')
  })
})
