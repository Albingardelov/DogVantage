import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { useTrainingWrite } from './use-training-write'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useTrainingWrite', () => {
  it('stays clean after a successful write', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }))
    const { result } = renderHook(() => useTrainingWrite())

    act(() => result.current.saveTrainingWrite('/api/training/progress', { count: 1 }))

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1))
    expect(result.current.writeFailed).toBe(false)
  })

  it('flags a failed write when the server responds with an error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }))
    const { result } = renderHook(() => useTrainingWrite())

    act(() => result.current.saveTrainingWrite('/api/training/metrics', { patch: {} }))

    await waitFor(() => expect(result.current.writeFailed).toBe(true))
  })

  it('flags a failed write when the request throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    const { result } = renderHook(() => useTrainingWrite())

    act(() => result.current.saveTrainingWrite('/api/training/metrics', { patch: {} }))

    await waitFor(() => expect(result.current.writeFailed).toBe(true))
  })

  it('clears the flag when a later write succeeds', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 500 })
      .mockResolvedValueOnce({ ok: true })
    vi.stubGlobal('fetch', fetchMock)
    const { result } = renderHook(() => useTrainingWrite())

    act(() => result.current.saveTrainingWrite('/api/training/progress', { count: 1 }))
    await waitFor(() => expect(result.current.writeFailed).toBe(true))

    act(() => result.current.saveTrainingWrite('/api/training/progress', { count: 2 }))
    await waitFor(() => expect(result.current.writeFailed).toBe(false))
  })
})
