import { describe, it, expect, vi, beforeEach } from 'vitest'

const upsert = vi.fn()
vi.mock('./client', () => ({
  getSupabaseAdmin: () => ({
    from: () => ({ upsert }),
  }),
}))

import { upsertMetrics } from './daily-exercise-metrics'

const DOG_ID = 'dog-1'
const BREED = 'labrador'
const DATE = '2026-10-12'
const EXERCISE_ID = 'inkallning'

describe('upsertMetrics', () => {
  beforeEach(() => {
    upsert.mockReset()
    upsert.mockResolvedValue({ error: null })
  })

  it('writes only the fields that were sent', async () => {
    await upsertMetrics(BREED, DATE, DOG_ID, EXERCISE_ID, { success_count: 3 })

    expect(upsert).toHaveBeenCalledWith(
      { dog_id: DOG_ID, breed: BREED, date: DATE, exercise_id: EXERCISE_ID, success_count: 3 },
      { onConflict: 'dog_id,breed,date,exercise_id' },
    )
  })

  it('leaves criteria, latency and notes out of a plain miss', async () => {
    await upsertMetrics(BREED, DATE, DOG_ID, EXERCISE_ID, { fail_count: 1 })

    const row = upsert.mock.calls[0][0] as Record<string, unknown>
    expect(row).not.toHaveProperty('criteria_level_id')
    expect(row).not.toHaveProperty('latency_bucket')
    expect(row).not.toHaveProperty('notes')
  })

  it('clears a field when the route marks it as cleared', async () => {
    // The PATCH route sets notes to undefined when the client sends an empty value.
    await upsertMetrics(BREED, DATE, DOG_ID, EXERCISE_ID, { criteria_level_id: null, notes: undefined })

    expect(upsert.mock.calls[0][0]).toMatchObject({ criteria_level_id: null, notes: null })
  })

  it('sets a criteria level when it is sent', async () => {
    await upsertMetrics(BREED, DATE, DOG_ID, EXERCISE_ID, { criteria_level_id: 'steg-2' })

    expect(upsert.mock.calls[0][0]).toMatchObject({ criteria_level_id: 'steg-2' })
  })

  it('throws when the database rejects the write', async () => {
    upsert.mockResolvedValue({ error: { message: 'boom' } })

    await expect(
      upsertMetrics(BREED, DATE, DOG_ID, EXERCISE_ID, { success_count: 1 }),
    ).rejects.toThrow('Metrics upsert failed: boom')
  })
})
