import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const { mockCreateSupabaseServer } = vi.hoisted(() => ({
  mockCreateSupabaseServer: vi.fn(),
}))
const { mockEnforceApiRateLimit } = vi.hoisted(() => ({
  mockEnforceApiRateLimit: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServer: mockCreateSupabaseServer,
}))
vi.mock('./rate-limit', () => ({
  enforceApiRateLimit: mockEnforceApiRateLimit,
}))

import { withAuth, withAuthAndDog } from './with-auth'

type MockSupabase = {
  auth: {
    getUser: ReturnType<typeof vi.fn>
  }
  from: ReturnType<typeof vi.fn>
}

function makeRequest(url: string, body?: unknown): NextRequest {
  return new NextRequest(url, body === undefined ? undefined : {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  })
}

function makeSupabase({
  userId,
  dog,
}: {
  userId?: string
  dog?: { id: string; breed: string; user_id: string } | null
}): MockSupabase {
  const single = vi.fn().mockResolvedValue({ data: dog ?? null })
  const eqUserId = vi.fn().mockReturnValue({ single })
  const eqDogId = vi.fn().mockReturnValue({ eq: eqUserId })
  const select = vi.fn().mockReturnValue({ eq: eqDogId })
  const from = vi.fn().mockReturnValue({ select })

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: userId ? { id: userId } : null } }),
    },
    from,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  mockEnforceApiRateLimit.mockResolvedValue(null)
})

describe('withAuthAndDog', () => {
  it('returns 400 when dogId is missing', async () => {
    const supabase = makeSupabase({ userId: 'u1' })
    mockCreateSupabaseServer.mockResolvedValue(supabase)

    const response = await withAuthAndDog(
      makeRequest('http://localhost/api/training/week'),
      async () => NextResponse.json({ ok: true }),
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: 'dogId required' })
  })

  it('returns 403 when dog does not belong to user', async () => {
    const supabase = makeSupabase({ userId: 'u1', dog: null })
    mockCreateSupabaseServer.mockResolvedValue(supabase)

    const response = await withAuthAndDog(
      makeRequest('http://localhost/api/training/week?dogId=dog-x'),
      async () => NextResponse.json({ ok: true }),
    )

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({ error: 'forbidden' })
  })

  it('calls handler when user owns dog', async () => {
    const dog = { id: 'dog-1', breed: 'labrador', user_id: 'u1' }
    const supabase = makeSupabase({ userId: 'u1', dog })
    mockCreateSupabaseServer.mockResolvedValue(supabase)
    const handler = vi.fn().mockResolvedValue(NextResponse.json({ ok: true }))

    const response = await withAuthAndDog(
      makeRequest('http://localhost/api/training/week?dogId=dog-1'),
      handler,
    )

    expect(response.status).toBe(200)
    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler.mock.calls[0][0].dog.id).toBe('dog-1')
  })

  it('returns 429 when user is rate limited', async () => {
    const supabase = makeSupabase({ userId: 'u1' })
    mockCreateSupabaseServer.mockResolvedValue(supabase)
    mockEnforceApiRateLimit.mockResolvedValue(
      NextResponse.json({ error: 'rate_limited' }, { status: 429 }),
    )

    const response = await withAuthAndDog(
      makeRequest('http://localhost/api/training/week?dogId=dog-1'),
      async () => NextResponse.json({ ok: true }),
    )

    expect(response.status).toBe(429)
  })
})

describe('withAuth', () => {
  it('returns 401 when user is missing', async () => {
    const supabase = makeSupabase({})
    mockCreateSupabaseServer.mockResolvedValue(supabase)

    const response = await withAuth(
      makeRequest('http://localhost/api/account', {}),
      async () => NextResponse.json({ ok: true }),
    )

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: 'unauthorized' })
  })

  it('calls handler when user exists and not rate limited', async () => {
    const supabase = makeSupabase({ userId: 'u1' })
    mockCreateSupabaseServer.mockResolvedValue(supabase)
    const handler = vi.fn().mockResolvedValue(NextResponse.json({ ok: true }))

    const response = await withAuth(
      makeRequest('http://localhost/api/account', {}),
      handler,
    )

    expect(response.status).toBe(200)
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('returns 429 when auth endpoint is rate limited', async () => {
    const supabase = makeSupabase({ userId: 'u1' })
    mockCreateSupabaseServer.mockResolvedValue(supabase)
    mockEnforceApiRateLimit.mockResolvedValue(
      NextResponse.json({ error: 'rate_limited' }, { status: 429 }),
    )

    const response = await withAuth(
      makeRequest('http://localhost/api/account', {}),
      async () => NextResponse.json({ ok: true }),
    )

    expect(response.status).toBe(429)
  })
})
