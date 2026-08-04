import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiError } from './errors'

describe('apiError', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('returns 500 with generic fallback key', async () => {
    const logSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const res = apiError(new Error('database exploded'))
    expect(res.status).toBe(500)
    await expect(res.json()).resolves.toEqual({ error: 'server_error' })
    expect(logSpy).toHaveBeenCalled()
  })

  it('uses provided fallback code', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const res = apiError(new Error('bad insert'), 'failed_to_save')
    await expect(res.json()).resolves.toEqual({ error: 'failed_to_save' })
  })
})
