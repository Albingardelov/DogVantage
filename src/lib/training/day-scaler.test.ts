import { describe, it, expect } from 'vitest'
import { scaleDayPlan, type DayCheckInState } from './day-scaler'
import type { Exercise } from '@/types'

const EXERCISES: Exercise[] = [
  { id: 'inkallning', label: 'Inkallning', desc: '5 reps', reps: 5 },
  { id: 'koppel', label: 'Koppel', desc: '5 reps', reps: 5 },
  { id: 'plats', label: 'Plats', desc: '3 reps', reps: 3 },
]

function checkIn(overrides: Partial<DayCheckInState> = {}): DayCheckInState {
  return { zone: 'green', handlerEnergy: null, minutesAvailable: null, ...overrides }
}

describe('scaleDayPlan', () => {
  it('returns full mode untouched without a check-in', () => {
    const result = scaleDayPlan(EXERCISES, null)
    expect(result.mode).toBe('full')
    expect(result.exercises).toEqual(EXERCISES)
    expect(result.note).toBeNull()
  })

  it('returns full mode for empty exercise lists', () => {
    const result = scaleDayPlan([], checkIn({ zone: 'red' }))
    expect(result.mode).toBe('full')
    expect(result.exercises).toEqual([])
  })

  it('red zone becomes a rest day', () => {
    const result = scaleDayPlan(EXERCISES, checkIn({ zone: 'red' }))
    expect(result.mode).toBe('rest')
    expect(result.exercises).toEqual([])
    expect(result.note).toContain('vila')
  })

  it('yellow zone becomes one calm exercise picked from metrics', () => {
    const result = scaleDayPlan(EXERCISES, checkIn({ zone: 'yellow' }), {
      metrics: { plats: { success_count: 5, fail_count: 1 } },
    })
    expect(result.mode).toBe('calm')
    expect(result.exercises).toHaveLength(1)
    expect(result.exercises[0].id).toBe('plats')
  })

  it('yellow zone falls back to nosework without metrics', () => {
    const result = scaleDayPlan(EXERCISES, checkIn({ zone: 'yellow' }))
    expect(result.exercises[0].id).toBe('nosework')
  })

  it('low handler energy trims to one exercise, preferring priority ids', () => {
    const result = scaleDayPlan(EXERCISES, checkIn({ handlerEnergy: 'low' }), {
      priorityIds: ['koppel'],
    })
    expect(result.mode).toBe('trimmed')
    expect(result.exercises).toEqual([EXERCISES[1]])
  })

  it('under 10 minutes trims to the first exercise when no priority matches', () => {
    const result = scaleDayPlan(EXERCISES, checkIn({ minutesAvailable: 5 }), {
      priorityIds: ['apportering'],
    })
    expect(result.mode).toBe('trimmed')
    expect(result.exercises).toEqual([EXERCISES[0]])
  })

  it('10 minutes or more with ok energy stays full', () => {
    const result = scaleDayPlan(EXERCISES, checkIn({ handlerEnergy: 'ok', minutesAvailable: 10 }))
    expect(result.mode).toBe('full')
    expect(result.exercises).toEqual(EXERCISES)
  })
})
