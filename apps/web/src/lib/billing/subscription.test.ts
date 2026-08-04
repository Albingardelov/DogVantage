import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockGetSupabaseAdmin, mockCreateSupabaseServer } = vi.hoisted(() => ({
  mockGetSupabaseAdmin: vi.fn(),
  mockCreateSupabaseServer: vi.fn(),
}))

vi.mock('@/lib/supabase/client', () => ({
  getSupabaseAdmin: mockGetSupabaseAdmin,
}))

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServer: mockCreateSupabaseServer,
}))

import {
  getCurrentSubscriptionState,
  getSubscriptionState,
  hasFeature,
  type SubscriptionRow,
} from './subscription'

function makeAdmin(row: SubscriptionRow | null) {
  const maybeSingle = vi.fn().mockResolvedValue({ data: row })
  const eq = vi.fn().mockReturnValue({ maybeSingle })
  const select = vi.fn().mockReturnValue({ eq })
  const from = vi.fn().mockReturnValue({ select })
  return { from }
}

describe('subscription-state lib', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns empty free state when row is missing', async () => {
    mockGetSupabaseAdmin.mockReturnValue(makeAdmin(null))
    const state = await getSubscriptionState('u1')
    expect(state.tier).toBe('free')
    expect(state.isActive).toBe(false)
    expect(state.isOnTrial).toBe(false)
    expect(state.trialDaysLeft).toBe(0)
  })

  it('sets trial as active when trial end is in future', async () => {
    mockGetSupabaseAdmin.mockReturnValue(makeAdmin({
      tier: 'pro',
      status: 'trialing',
      stripe_subscription_id: null,
      trial_end: '2099-01-20T00:00:00.000Z',
      current_period_end: '2099-02-01T00:00:00.000Z',
      cancel_at_period_end: false,
    }))
    const state = await getSubscriptionState('u1')
    expect(state.isOnTrial).toBe(true)
    expect(state.isActive).toBe(true)
    expect(state.trialDaysLeft).toBeGreaterThan(0)
  })

  it('marks trial inactive when trial end is in past', async () => {
    mockGetSupabaseAdmin.mockReturnValue(makeAdmin({
      tier: 'pro',
      status: 'trialing',
      stripe_subscription_id: null,
      trial_end: '2000-01-01T00:00:00.000Z',
      current_period_end: '2000-01-10T00:00:00.000Z',
      cancel_at_period_end: false,
    }))
    const state = await getSubscriptionState('u1')
    expect(state.isOnTrial).toBe(false)
    expect(state.trialDaysLeft).toBe(0)
  })

  it('keeps past_due active inside grace period', async () => {
    const now = Date.now()
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString()
    mockGetSupabaseAdmin.mockReturnValue(makeAdmin({
      tier: 'basic',
      status: 'past_due',
      stripe_subscription_id: 'sub_123',
      trial_end: null,
      current_period_end: oneDayAgo,
      cancel_at_period_end: false,
    }))
    const state = await getSubscriptionState('u1')
    expect(state.isActive).toBe(true)
  })

  it('sets past_due inactive after grace period', async () => {
    const now = Date.now()
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString()
    mockGetSupabaseAdmin.mockReturnValue(makeAdmin({
      tier: 'basic',
      status: 'past_due',
      stripe_subscription_id: 'sub_123',
      trial_end: null,
      current_period_end: sevenDaysAgo,
      cancel_at_period_end: false,
    }))
    const state = await getSubscriptionState('u1')
    expect(state.isActive).toBe(false)
  })

  it('treats canceled as inactive', async () => {
    mockGetSupabaseAdmin.mockReturnValue(makeAdmin({
      tier: 'basic',
      status: 'canceled',
      stripe_subscription_id: 'sub_123',
      trial_end: null,
      current_period_end: null,
      cancel_at_period_end: true,
    }))
    const state = await getSubscriptionState('u1')
    expect(state.isActive).toBe(false)
  })

  it('returns features only for active tiers', () => {
    const activeBasic = {
      tier: 'basic',
      status: 'active',
      stripeSubscriptionId: 'sub_1',
      trialEnd: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      isActive: true,
      isOnTrial: false,
      trialDaysLeft: 0,
    } as const
    const inactivePro = { ...activeBasic, tier: 'pro', isActive: false } as const

    expect(hasFeature(activeBasic, 'view_week_plan')).toBe(true)
    expect(hasFeature(activeBasic, 'ai_chat')).toBe(false)
    expect(hasFeature(inactivePro, 'ai_chat')).toBe(false)
  })

  it('returns null for current state when no user in session', async () => {
    mockCreateSupabaseServer.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    })
    const state = await getCurrentSubscriptionState()
    expect(state).toBeNull()
  })
})
