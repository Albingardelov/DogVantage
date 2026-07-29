import { describe, expect, it } from 'vitest'
import {
  evaluateRate,
  resolveProgressionState,
  ADVANCE_THRESHOLD,
  REGRESS_THRESHOLD,
} from './progression-kernel'

describe('evaluateRate', () => {
  it('holds when under min attempts (session adult needs 5)', () => {
    const r = evaluateRate({
      success: 3, fail: 0, horizon: 'session', isPuppy: false,
    })
    expect(r.decision).toBe('hold')
    expect(r.attempts).toBe(3)
  })

  it('advances at 80% with 5 session attempts', () => {
    const r = evaluateRate({
      success: 4, fail: 1, horizon: 'session', isPuppy: false,
    })
    expect(r.decision).toBe('advance')
    expect(r.rate).toBeCloseTo(0.8)
  })

  it('puppy session min is 3 — kernel advances at 2/3', () => {
    const r = evaluateRate({
      success: 2, fail: 1, horizon: 'session', isPuppy: true,
    })
    expect(r.decision).toBe('advance')
  })

  it('adult holds at 2/3 on session', () => {
    const r = evaluateRate({
      success: 2, fail: 1, horizon: 'session', isPuppy: false,
    })
    expect(r.decision).toBe('hold')
  })

  it('regresses at <=60% with enough attempts', () => {
    const r = evaluateRate({
      success: 3, fail: 2, horizon: 'session', // 60% of 5
    })
    expect(r.decision).toBe('regress')
    expect(r.reason).not.toMatch(/under 80|under\s*80/i)
  })

  it('holds between 61% and 79%', () => {
    const r = evaluateRate({
      success: 7, fail: 3, horizon: 'session', // 70%
    })
    expect(r.decision).toBe('hold')
  })

  it('week holds when sessionCount < 2 even at high rate', () => {
    const r = evaluateRate({
      success: 10, fail: 0, horizon: 'week', sessionCount: 1,
    })
    expect(r.decision).toBe('hold')
    expect(r.reason).toMatch(/pass/i)
  })

  it('week advances with 2 sessions and 10 attempts at 80%', () => {
    const r = evaluateRate({
      success: 8, fail: 2, horizon: 'week', sessionCount: 2,
    })
    expect(r.decision).toBe('advance')
  })

  it('project advances at 6 attempts and 80%', () => {
    const r = evaluateRate({
      success: 5, fail: 1, horizon: 'project',
    })
    expect(r.decision).toBe('advance')
  })

  it('project holds under 6 attempts', () => {
    const r = evaluateRate({
      success: 4, fail: 0, horizon: 'project',
    })
    expect(r.decision).toBe('hold')
  })

  it('latency lt1s can push borderline toward advance', () => {
    // 7/9 ≈ 0.778 + 0.05 = 0.828 >= 0.80
    const r = evaluateRate({
      success: 7, fail: 2, horizon: 'session', latencyBucket: 'lt1s',
    })
    expect(r.decision).toBe('advance')
  })

  it('caps advance threshold at 0.90', () => {
    const r = evaluateRate({
      success: 9, fail: 1, horizon: 'session', advanceThresholdDelta: 0.5,
    })
    expect(r.decision).toBe('advance')
  })

  it('exports shared thresholds', () => {
    expect(ADVANCE_THRESHOLD).toBe(0.8)
    expect(REGRESS_THRESHOLD).toBe(0.6)
  })
})

describe('resolveProgressionState', () => {
  it('aggregates rows for exercise+rung within window', () => {
    const state = resolveProgressionState({
      rows: [
        {
          exercise_id: 'sitt',
          date: '2026-07-28',
          success_count: 4,
          fail_count: 1,
          criteria_level_id: 'home',
          latency_bucket: null,
        },
        {
          exercise_id: 'sitt',
          date: '2026-07-27',
          success_count: 4,
          fail_count: 1,
          criteria_level_id: 'home',
          latency_bucket: null,
        },
        {
          exercise_id: 'other',
          date: '2026-07-28',
          success_count: 10,
          fail_count: 0,
          criteria_level_id: 'home',
        },
      ],
      exerciseId: 'sitt',
      criteriaLevelId: 'home',
      horizon: 'week',
      now: new Date('2026-07-29T12:00:00Z'),
      windowDays: 7,
      sessionRows: [
        { exercise_id: 'sitt', criteria_level_id: 'home', date: '2026-07-28' },
        { exercise_id: 'sitt', criteria_level_id: 'home', date: '2026-07-27' },
      ],
    })
    expect(state.attempts).toBe(10)
    expect(state.rungId).toBe('home')
    expect(state.decision).toBe('advance')
  })
})
