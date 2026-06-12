import { describe, it, expect } from 'vitest'
import { rankWeakestExercises, pickMicroLessonExercise } from './micro-lesson'

describe('rankWeakestExercises', () => {
  it('returns empty for no rows', () => {
    expect(rankWeakestExercises([])).toEqual([])
  })

  it('sorts exercises by success rate ascending', () => {
    const rows = [
      { exercise_id: 'sitt', success_count: 9, fail_count: 1 },
      { exercise_id: 'inkallning', success_count: 2, fail_count: 8 },
      { exercise_id: 'koppel', success_count: 5, fail_count: 5 },
    ]
    expect(rankWeakestExercises(rows)).toEqual(['inkallning', 'koppel', 'sitt'])
  })

  it('aggregates multiple rows per exercise', () => {
    const rows = [
      { exercise_id: 'sitt', success_count: 1, fail_count: 4 },
      { exercise_id: 'sitt', success_count: 9, fail_count: 0 },
      { exercise_id: 'koppel', success_count: 3, fail_count: 4 },
    ]
    // sitt: 10/14 ≈ 0.71, koppel: 3/7 ≈ 0.43
    expect(rankWeakestExercises(rows)).toEqual(['koppel', 'sitt'])
  })

  it('drops exercises below the attempt threshold', () => {
    const rows = [
      { exercise_id: 'sitt', success_count: 1, fail_count: 2 },
      { exercise_id: 'koppel', success_count: 2, fail_count: 2 },
    ]
    expect(rankWeakestExercises(rows, 4)).toEqual(['koppel'])
  })

  it('handles null counts', () => {
    const rows = [{ exercise_id: 'sitt', success_count: null, fail_count: null }]
    expect(rankWeakestExercises(rows)).toEqual([])
  })
})

describe('pickMicroLessonExercise', () => {
  it('picks the weakest non-completed exercise', () => {
    expect(pickMicroLessonExercise(['inkallning', 'koppel'], 'marker', new Set(['inkallning']))).toBe('koppel')
  })

  it('falls back to the stage exercise when all ranked are completed', () => {
    expect(pickMicroLessonExercise(['inkallning'], 'marker', new Set(['inkallning']))).toBe('marker')
  })

  it('uses the fallback when there are no ranked exercises', () => {
    expect(pickMicroLessonExercise([], 'marker', new Set())).toBe('marker')
  })

  it('returns null when even the fallback is completed', () => {
    expect(pickMicroLessonExercise(['inkallning'], 'marker', new Set(['inkallning', 'marker']))).toBeNull()
  })
})
