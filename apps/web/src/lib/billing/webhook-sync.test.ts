import { beforeEach, describe, expect, it, vi } from 'vitest'
import type Stripe from 'stripe'

const { mockGetSupabaseAdmin } = vi.hoisted(() => ({
  mockGetSupabaseAdmin: vi.fn(),
}))

vi.mock('@/lib/supabase/client', () => ({
  getSupabaseAdmin: mockGetSupabaseAdmin,
}))

vi.mock('@/lib/stripe/client', () => ({
  STRIPE_PRICE_IDS: {
    basic: 'price_basic',
    proMonthly: 'price_pro',
    proAnnual: 'price_pro_year',
  },
}))

import {
  markCanceled,
  markPastDue,
  syncSubscription,
  tierFromPriceId,
} from './webhook-sync'

function makeAdmin() {
  const upsert = vi.fn().mockResolvedValue({ error: null })
  const eq = vi.fn().mockResolvedValue({ error: null })
  const update = vi.fn().mockReturnValue({ eq })
  const from = vi.fn().mockReturnValue({ upsert, update })
  return { from, upsert, update, eq }
}

function subscription(overrides: Partial<Stripe.Subscription> = {}): Stripe.Subscription {
  return {
    id: 'sub_123',
    object: 'subscription',
    status: 'active',
    metadata: { user_id: 'u1' },
    customer: 'cus_123',
    trial_end: null,
    current_period_end: 1_700_000_000,
    cancel_at_period_end: false,
    items: {
      object: 'list',
      data: [{ price: { id: 'price_pro' } }] as unknown as Stripe.SubscriptionItem[],
      has_more: false,
      url: '',
    },
    ...overrides,
  } as unknown as Stripe.Subscription
}

describe('webhook sync helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('maps price ids to tiers', () => {
    expect(tierFromPriceId('price_pro')).toBe('pro')
    expect(tierFromPriceId('price_pro_year')).toBe('pro')
    expect(tierFromPriceId('price_basic')).toBe('basic')
    expect(tierFromPriceId('unknown')).toBe('free')
  })

  it('upserts subscription data for create/update events', async () => {
    const admin = makeAdmin()
    mockGetSupabaseAdmin.mockReturnValue(admin)
    await syncSubscription(subscription())
    expect(admin.upsert).toHaveBeenCalledTimes(1)
    const payload = admin.upsert.mock.calls[0][0]
    expect(payload.user_id).toBe('u1')
    expect(payload.tier).toBe('pro')
    expect(payload.status).toBe('active')
  })

  it('marks canceled subscriptions as free/canceled', async () => {
    const admin = makeAdmin()
    mockGetSupabaseAdmin.mockReturnValue(admin)
    await markCanceled(subscription())
    expect(admin.update).toHaveBeenCalledTimes(1)
    expect(admin.eq).toHaveBeenCalledWith('user_id', 'u1')
  })

  it('marks past_due by stripe subscription id', async () => {
    const admin = makeAdmin()
    mockGetSupabaseAdmin.mockReturnValue(admin)
    await markPastDue({ subscription: 'sub_123' } as unknown as Stripe.Invoice)
    expect(admin.eq).toHaveBeenCalledWith('stripe_subscription_id', 'sub_123')
  })
})
