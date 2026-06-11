import { describe, it, expect } from 'vitest'
import { computeDogState, type DogStateInputs } from './dog-state'
import type { SessionLog } from '@/types'

function makeLog(overrides: Partial<SessionLog> = {}): SessionLog {
  return {
    id: 'log-1',
    user_id: 'user-1',
    breed: 'labrador_retriever',
    week_number: 3,
    quick_rating: 'good',
    focus: 4,
    obedience: 4,
    created_at: '2026-06-10T10:00:00Z',
    ...overrides,
  } as SessionLog
}

function metricRow(
  exerciseId: string,
  success: number,
  fail: number,
  criteriaLevelId: string | null = null,
  date = '2026-06-10',
) {
  return {
    exercise_id: exerciseId,
    date,
    success_count: success,
    fail_count: fail,
    criteria_level_id: criteriaLevelId,
  }
}

const EMPTY: DogStateInputs = { metrics: [], sessionLogs: [], checkIns: {} }

describe('computeDogState', () => {
  it('returns an empty baseline for a dog without data', () => {
    const state = computeDogState(EMPTY)
    expect(state.version).toBe(1)
    expect(state.weakExercises).toEqual([])
    expect(state.strongExercises).toEqual([])
    expect(state.environmentDifficulty).toEqual({})
    expect(state.handler).toEqual({
      timing: null,
      consistency: null,
      reading: null,
      sampleSize: 0,
    })
    expect(state.zoneSummary).toEqual({ greenDays: 0, yellowDays: 0, redDays: 0, window: 14 })
    expect(state.thresholdAdjustments).toEqual({})
  })

  it('classifies exercises with >= 10 attempts and <= 60% success as weak', () => {
    const state = computeDogState({
      ...EMPTY,
      metrics: [
        metricRow('inkallning', 4, 6),     // 40% av 10 → svag
        metricRow('sitt', 5, 4),           // 9 försök → under MIN_ATTEMPTS, ignoreras
        metricRow('plats', 9, 1),          // 90% av 10 → stark
      ],
    })
    expect(state.weakExercises).toEqual([
      { exerciseId: 'inkallning', successRate: 0.4, attempts: 10 },
    ])
    expect(state.strongExercises).toEqual([
      { exerciseId: 'plats', successRate: 0.9, attempts: 10 },
    ])
  })

  it('aggregates the same exercise across days and sorts weakest first', () => {
    const state = computeDogState({
      ...EMPTY,
      metrics: [
        metricRow('koppel', 2, 4, null, '2026-06-08'),
        metricRow('koppel', 1, 3, null, '2026-06-09'),   // totalt 3/10 = 30%
        metricRow('inkallning', 5, 5),                    // 50%
      ],
    })
    expect(state.weakExercises.map((e) => e.exerciseId)).toEqual(['koppel', 'inkallning'])
    expect(state.weakExercises[0].successRate).toBeCloseTo(0.3)
  })

  it('caps weak and strong lists at 3 entries', () => {
    const weakMetrics = ['a', 'b', 'c', 'd'].map((id) => metricRow(id, 2, 8))
    const state = computeDogState({ ...EMPTY, metrics: weakMetrics })
    expect(state.weakExercises).toHaveLength(3)
  })

  it('computes success rate per environment from criteria level ids', () => {
    const state = computeDogState({
      ...EMPTY,
      metrics: [
        metricRow('sitt', 9, 1, 'home_low_1m'),
        metricRow('sitt', 2, 8, 'park_distraction'),
      ],
    })
    expect(state.environmentDifficulty.home).toBeCloseTo(0.9)
    expect(state.environmentDifficulty.park).toBeCloseTo(0.2)
    expect(state.environmentDifficulty.outdoor).toBeUndefined()
  })

  it('averages handler self-ratings over session logs', () => {
    const state = computeDogState({
      ...EMPTY,
      sessionLogs: [
        makeLog({ handler_timing: 2, handler_consistency: 4, handler_reading: 3 }),
        makeLog({ handler_timing: 4 }),
      ],
    })
    expect(state.handler.timing).toBeCloseTo(3)
    expect(state.handler.consistency).toBeCloseTo(4)
    expect(state.handler.reading).toBeCloseTo(3)
    expect(state.handler.sampleSize).toBe(2)
  })

  it('counts check-in zones over the window', () => {
    const state = computeDogState({
      ...EMPTY,
      checkIns: {
        '2026-06-08': 'green',
        '2026-06-09': 'yellow',
        '2026-06-10': 'red',
        '2026-06-11': 'green',
      },
    })
    expect(state.zoneSummary).toEqual({ greenDays: 2, yellowDays: 1, redDays: 1, window: 14 })
  })
})
