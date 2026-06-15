import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

const mockApiFetch = vi.fn()
vi.mock('@/lib/api/fetch', () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch(...args),
  ApiError: class extends Error {},
}))

import { useExerciseHistory } from './use-exercise-history'

describe('useExerciseHistory', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns the practiced set from the API', async () => {
    mockApiFetch.mockResolvedValue({ practicedExerciseIds: ['sitt', 'fokus'] })
    const { result } = renderHook(() => useExerciseHistory('dog-1'))
    await waitFor(() => expect(result.current.has('sitt')).toBe(true))
    expect(result.current.has('fokus')).toBe(true)
    expect(result.current.has('ligg')).toBe(false)
  })

  it('returns an empty set on error (treat all as practiced upstream)', async () => {
    mockApiFetch.mockRejectedValue(new Error('boom'))
    const { result } = renderHook(() => useExerciseHistory('dog-1'))
    await waitFor(() => expect(mockApiFetch).toHaveBeenCalled())
    expect(result.current.size).toBe(0)
  })
})
