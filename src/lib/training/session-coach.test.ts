import { describe, it, expect } from 'vitest'
import {
  advanceGuard,
  buildCoachAction,
  EMPTY_GUARD,
  type CoachInput,
} from './session-coach'
import type { CriteriaLevel } from '@/lib/training/exercise-specs'

const LADDER: CriteriaLevel[] = [
  { id: 'home_low', label: 'Hemma, låg störning', criteria: 'Inomhus utan distraktion' },
  { id: 'garden', label: 'Trädgård', criteria: 'Utomhus, mild distraktion' },
  { id: 'park', label: 'Park', criteria: 'Full distraktion' },
]

function input(overrides: Partial<CoachInput> = {}): CoachInput {
  return {
    successCount: 0,
    failCount: 0,
    latencyBucket: null,
    ageWeeks: 52,
    guard: EMPTY_GUARD,
    ladder: LADDER,
    currentLevelId: 'garden',
    ...overrides,
  }
}

describe('advanceGuard', () => {
  it('increments consecutiveFails on a miss and sets stopTriggered at 2', () => {
    const g1 = advanceGuard(EMPTY_GUARD, { fail_count: 1 })
    expect(g1).toEqual({ consecutiveFails: 1, consecutiveSlow: 0, stopTriggered: false })
    const g2 = advanceGuard(g1, { fail_count: 2 })
    expect(g2.consecutiveFails).toBe(2)
    expect(g2.stopTriggered).toBe(true)
  })

  it('sets stopTriggered after 2 consecutive slow reps', () => {
    const g1 = advanceGuard(EMPTY_GUARD, { latency_bucket: 'gt3s' })
    const g2 = advanceGuard(g1, { latency_bucket: 'gt3s' })
    expect(g2.stopTriggered).toBe(true)
  })

  it('a success resets counters but keeps stopTriggered', () => {
    const stopped = { consecutiveFails: 2, consecutiveSlow: 0, stopTriggered: true }
    const g = advanceGuard(stopped, { success_count: 5 })
    expect(g).toEqual({ consecutiveFails: 0, consecutiveSlow: 0, stopTriggered: true })
  })
})

describe('buildCoachAction', () => {
  it('suggests stop with the previous ladder step after 2 consecutive misses', () => {
    const action = buildCoachAction(input({
      guard: { consecutiveFails: 2, consecutiveSlow: 0, stopTriggered: true },
      failCount: 2,
    }))
    expect(action?.kind).toBe('stop')
    expect(action?.suggestedLevelId).toBe('home_low')
  })

  it('stop at the lowest ladder step has no suggested level', () => {
    const action = buildCoachAction(input({
      guard: { consecutiveFails: 2, consecutiveSlow: 0, stopTriggered: true },
      currentLevelId: 'home_low',
    }))
    expect(action?.kind).toBe('stop')
    expect(action?.suggestedLevelId).toBeNull()
  })

  it('suggests end_on_success after a success that follows a stop', () => {
    const action = buildCoachAction(input({
      guard: { consecutiveFails: 0, consecutiveSlow: 0, stopTriggered: true },
      successCount: 3,
      failCount: 2,
    }))
    expect(action?.kind).toBe('end_on_success')
    expect(action?.suggestedLevelId).toBeNull()
  })

  it('asks for more attempts below 10 attempts', () => {
    const action = buildCoachAction(input({ successCount: 5, failCount: 1 }))
    expect(action?.kind).toBe('keep')
  })

  it('suggests raise with next ladder step at >= 80% for adult dogs', () => {
    const action = buildCoachAction(input({ successCount: 9, failCount: 1 }))
    expect(action?.kind).toBe('raise')
    expect(action?.suggestedLevelId).toBe('park')
  })

  it('never suggests raise for puppies', () => {
    const action = buildCoachAction(input({ successCount: 9, failCount: 1, ageWeeks: 12 }))
    expect(action?.kind).toBe('keep')
  })

  it('raise at the top of the ladder becomes keep with a stabilize message', () => {
    const action = buildCoachAction(input({
      successCount: 9, failCount: 1, currentLevelId: 'park',
    }))
    expect(action?.kind).toBe('keep')
    expect(action?.suggestedLevelId).toBeNull()
  })

  it('suggests lower with previous ladder step at <= 60%', () => {
    const action = buildCoachAction(input({ successCount: 5, failCount: 5 }))
    expect(action?.kind).toBe('lower')
    expect(action?.suggestedLevelId).toBe('home_low')
  })

  it('a positive advanceThresholdDelta raises the bar for raise', () => {
    const base = input({ successCount: 8, failCount: 2 }) // 80%
    expect(buildCoachAction(base)?.kind).toBe('raise')
    expect(buildCoachAction({ ...base, advanceThresholdDelta: 0.05 })?.kind).toBe('keep')
  })

  it('caps the effective advance threshold at 0.9', () => {
    const action = buildCoachAction(input({
      successCount: 9, failCount: 1, advanceThresholdDelta: 0.5,
    })) // 90% ska fortfarande nå raise trots delta 0.5
    expect(action?.kind).toBe('raise')
  })

  it('works without a ladder (custom exercises): kinds intact, no suggested levels', () => {
    const action = buildCoachAction(input({
      successCount: 5, failCount: 5, ladder: null, currentLevelId: null,
    }))
    expect(action?.kind).toBe('lower')
    expect(action?.suggestedLevelId).toBeNull()
  })
})
