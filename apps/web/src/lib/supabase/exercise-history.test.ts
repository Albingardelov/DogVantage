import { describe, it, expect, vi, beforeEach } from 'vitest'

const rows = vi.fn()
vi.mock('./client', () => ({
  getSupabaseAdmin: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          lt: () => Promise.resolve({ data: rows(), error: null }),
        }),
      }),
    }),
  }),
}))

import { getPracticedExerciseIds } from './exercise-history'

describe('getPracticedExerciseIds', () => {
  beforeEach(() => rows.mockReset())

  it('returns distinct ids that have at least one attempt', async () => {
    rows.mockReturnValue([
      { exercise_id: 'sitt', success_count: 2, fail_count: 0 },
      { exercise_id: 'sitt', success_count: 0, fail_count: 1 },
      { exercise_id: 'fokus', success_count: 0, fail_count: 0 },
    ])
    const ids = await getPracticedExerciseIds('dog-1', '2026-06-15')
    expect(ids.sort()).toEqual(['sitt'])
  })

  it('returns empty when no rows', async () => {
    rows.mockReturnValue([])
    expect(await getPracticedExerciseIds('dog-1', '2026-06-15')).toEqual([])
  })
})
