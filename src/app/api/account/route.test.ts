import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const { mockGetSupabaseAdmin, mockCustomersDel, mockGetStripeCustomerId } = vi.hoisted(() => ({
  mockGetSupabaseAdmin: vi.fn(),
  mockCustomersDel: vi.fn(),
  mockGetStripeCustomerId: vi.fn(),
}))

vi.mock('@/lib/api/with-auth', () => ({
  withAuth: (_req: NextRequest, handler: (ctx: { user: { id: string } }) => Promise<NextResponse>) =>
    handler({ user: { id: 'u1' } }),
}))
vi.mock('@/lib/supabase/client', () => ({ getSupabaseAdmin: mockGetSupabaseAdmin }))
vi.mock('@/lib/stripe/client', () => ({ getStripe: () => ({ customers: { del: mockCustomersDel } }) }))
vi.mock('@/lib/billing/subscription', () => ({ getStripeCustomerId: mockGetStripeCustomerId }))

import { DELETE } from './route'

function makeAdmin({ deleteError = null as { message: string } | null } = {}) {
  const deleteUser = vi.fn().mockResolvedValue({ error: null })
  const deleted = { error: deleteError }
  const del = vi.fn().mockReturnValue({
    in: vi.fn().mockResolvedValue(deleted),
    eq: vi.fn().mockResolvedValue(deleted),
  })
  const select = vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue({ data: [{ id: 'dog-1' }], error: null }),
  })
  const from = vi.fn().mockReturnValue({ select, delete: del })
  return { from, auth: { admin: { deleteUser } }, deleteUser }
}

const request = () => new NextRequest('http://localhost/api/account', { method: 'DELETE' })

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('DELETE /api/account', () => {
  it('deletes the Stripe customer before the user', async () => {
    const admin = makeAdmin()
    mockGetSupabaseAdmin.mockReturnValue(admin)
    mockGetStripeCustomerId.mockResolvedValue('cus_1')
    mockCustomersDel.mockResolvedValue({ deleted: true })

    const res = await DELETE(request())

    expect(res.status).toBe(200)
    expect(mockCustomersDel).toHaveBeenCalledWith('cus_1')
    expect(mockCustomersDel.mock.invocationCallOrder[0]).toBeLessThan(admin.deleteUser.mock.invocationCallOrder[0])
  })

  it('keeps the account when Stripe cancellation fails', async () => {
    const admin = makeAdmin()
    mockGetSupabaseAdmin.mockReturnValue(admin)
    mockGetStripeCustomerId.mockResolvedValue('cus_1')
    mockCustomersDel.mockRejectedValue(Object.assign(new Error('stripe down'), { code: 'api_error' }))

    const res = await DELETE(request())

    expect(res.status).toBe(500)
    expect(admin.deleteUser).not.toHaveBeenCalled()
  })

  it('continues when the Stripe customer is already gone', async () => {
    const admin = makeAdmin()
    mockGetSupabaseAdmin.mockReturnValue(admin)
    mockGetStripeCustomerId.mockResolvedValue('cus_1')
    mockCustomersDel.mockRejectedValue(Object.assign(new Error('No such customer'), { code: 'resource_missing' }))

    const res = await DELETE(request())

    expect(res.status).toBe(200)
    expect(admin.deleteUser).toHaveBeenCalledWith('u1')
  })

  it('reports failure instead of claiming success when a delete fails', async () => {
    const admin = makeAdmin({ deleteError: { message: 'boom' } })
    mockGetSupabaseAdmin.mockReturnValue(admin)
    mockGetStripeCustomerId.mockResolvedValue(null)

    const res = await DELETE(request())

    expect(res.status).toBe(500)
    expect(admin.deleteUser).not.toHaveBeenCalled()
  })
})
