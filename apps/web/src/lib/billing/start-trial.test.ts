import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockGetSupabaseAdmin, mockGetStripe } = vi.hoisted(() => ({
  mockGetSupabaseAdmin: vi.fn(),
  mockGetStripe: vi.fn(),
}))

vi.mock('@/lib/supabase/client', () => ({
  getSupabaseAdmin: mockGetSupabaseAdmin,
}))

vi.mock('@/lib/stripe/client', () => ({
  getStripe: mockGetStripe,
}))

import { ensureTrial } from './start-trial'

function makeAdmin(row: { user_id: string } | null, insertError: { message: string } | null = null) {
  const maybeSingle = vi.fn().mockResolvedValue({ data: row, error: null })
  const eq = vi.fn().mockReturnValue({ maybeSingle })
  const select = vi.fn().mockReturnValue({ eq })
  const insert = vi.fn().mockResolvedValue({ error: insertError })
  const from = vi.fn().mockReturnValue({ select, insert })
  return { from, insert }
}

describe('ensureTrial', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does nothing when subscription row already exists', async () => {
    const admin = makeAdmin({ user_id: 'u1' })
    mockGetSupabaseAdmin.mockReturnValue(admin)
    const create = vi.fn()
    mockGetStripe.mockReturnValue({ customers: { create } })

    await ensureTrial('u1', 'test@example.com')

    expect(create).not.toHaveBeenCalled()
    expect(admin.insert).not.toHaveBeenCalled()
  })

  it('creates stripe customer and inserts pro trial row', async () => {
    const now = new Date('2026-01-01T00:00:00.000Z')
    vi.useFakeTimers()
    vi.setSystemTime(now)

    const admin = makeAdmin(null)
    mockGetSupabaseAdmin.mockReturnValue(admin)
    const create = vi.fn().mockResolvedValue({ id: 'cus_123' })
    mockGetStripe.mockReturnValue({ customers: { create } })

    await ensureTrial('u1', 'test@example.com')

    expect(create).toHaveBeenCalledWith({
      email: 'test@example.com',
      metadata: { user_id: 'u1' },
    })
    expect(admin.insert).toHaveBeenCalledTimes(1)
    const payload = admin.insert.mock.calls[0][0]
    expect(payload.user_id).toBe('u1')
    expect(payload.tier).toBe('pro')
    expect(payload.status).toBe('trialing')
    const diffDays = (new Date(payload.trial_end).getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
    expect(diffDays).toBe(14)
    expect(payload.current_period_end).toBe(payload.trial_end)

    vi.useRealTimers()
  })

  it('throws when insert fails', async () => {
    const admin = makeAdmin(null, { message: 'insert failed' })
    mockGetSupabaseAdmin.mockReturnValue(admin)
    const create = vi.fn().mockResolvedValue({ id: 'cus_123' })
    mockGetStripe.mockReturnValue({ customers: { create } })

    await expect(ensureTrial('u1', 'test@example.com')).rejects.toThrow('Failed to create trial')
  })
})
