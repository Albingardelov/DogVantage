import { beforeEach, describe, expect, it, vi } from 'vitest'
import type Stripe from 'stripe'

const { mockGetSupabaseAdmin, mockRetrieve } = vi.hoisted(() => ({
  mockGetSupabaseAdmin: vi.fn(),
  mockRetrieve: vi.fn(),
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
  getStripe: () => ({ subscriptions: { retrieve: mockRetrieve } }),
}))

import {
  periodEndFromSubscription,
  subscriptionIdFromInvoice,
  syncSubscription,
  syncSubscriptionById,
  tierFromPriceId,
} from './webhook-sync'

type Existing = { user_id: string; stripe_subscription_id: string | null; status: string } | null

function makeAdmin(existing: Existing = null) {
  const upsert = vi.fn().mockResolvedValue({ error: null })
  const maybeSingle = vi.fn().mockResolvedValue({ data: existing, error: null })
  const eq = vi.fn().mockReturnValue({ maybeSingle })
  const select = vi.fn().mockReturnValue({ eq })
  const from = vi.fn().mockReturnValue({ upsert, select })
  return { from, upsert, select, eq }
}

function subscription(overrides: Record<string, unknown> = {}): Stripe.Subscription {
  return {
    id: 'sub_123',
    object: 'subscription',
    status: 'active',
    metadata: { user_id: 'u1' },
    customer: 'cus_123',
    trial_end: null,
    cancel_at_period_end: false,
    items: {
      object: 'list',
      data: [{ price: { id: 'price_pro' }, current_period_end: 1_700_000_000 }],
      has_more: false,
      url: '',
    },
    ...overrides,
  } as unknown as Stripe.Subscription
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('tierFromPriceId', () => {
  it('maps configured price ids to tiers', () => {
    expect(tierFromPriceId('price_pro')).toBe('pro')
    expect(tierFromPriceId('price_pro_year')).toBe('pro')
    expect(tierFromPriceId('price_basic')).toBe('basic')
    expect(tierFromPriceId('unknown')).toBe('free')
    expect(tierFromPriceId(undefined)).toBe('free')
  })
})

describe('periodEndFromSubscription', () => {
  it('reads the period end from subscription items', () => {
    expect(periodEndFromSubscription(subscription())).toBe(1_700_000_000)
  })

  it('falls back to the legacy top-level field', () => {
    const sub = subscription({
      current_period_end: 1_600_000_000,
      items: { object: 'list', data: [{ price: { id: 'price_pro' } }], has_more: false, url: '' },
    })
    expect(periodEndFromSubscription(sub)).toBe(1_600_000_000)
  })
})

describe('subscriptionIdFromInvoice', () => {
  it('reads the subscription from invoice.parent', () => {
    const invoice = { parent: { subscription_details: { subscription: 'sub_new' } } } as unknown as Stripe.Invoice
    expect(subscriptionIdFromInvoice(invoice)).toBe('sub_new')
  })

  it('falls back to the legacy invoice.subscription field', () => {
    expect(subscriptionIdFromInvoice({ subscription: 'sub_old' } as unknown as Stripe.Invoice)).toBe('sub_old')
  })

  it('returns null for one-off invoices', () => {
    expect(subscriptionIdFromInvoice({ parent: null } as unknown as Stripe.Invoice)).toBeNull()
  })
})

describe('syncSubscription', () => {
  it('upserts tier, status and item period end', async () => {
    const admin = makeAdmin()
    mockGetSupabaseAdmin.mockReturnValue(admin)

    await syncSubscription(subscription())

    const payload = admin.upsert.mock.calls[0][0]
    expect(payload).toMatchObject({ user_id: 'u1', tier: 'pro', status: 'active', stripe_subscription_id: 'sub_123' })
    expect(payload.current_period_end).toBe(new Date(1_700_000_000 * 1000).toISOString())
  })

  it('downgrades a canceled subscription to free', async () => {
    const admin = makeAdmin({ user_id: 'u1', stripe_subscription_id: 'sub_123', status: 'active' })
    mockGetSupabaseAdmin.mockReturnValue(admin)

    await syncSubscription(subscription({ status: 'canceled' }))

    expect(admin.upsert.mock.calls[0][0]).toMatchObject({ tier: 'free', status: 'canceled' })
  })

  it('keeps the paid tier while past_due so the grace period applies', async () => {
    const admin = makeAdmin({ user_id: 'u1', stripe_subscription_id: 'sub_123', status: 'active' })
    mockGetSupabaseAdmin.mockReturnValue(admin)

    await syncSubscription(subscription({ status: 'past_due' }))

    expect(admin.upsert.mock.calls[0][0]).toMatchObject({ tier: 'pro', status: 'past_due' })
  })

  it('does not let an old canceled subscription overwrite the active one', async () => {
    const admin = makeAdmin({ user_id: 'u1', stripe_subscription_id: 'sub_current', status: 'active' })
    mockGetSupabaseAdmin.mockReturnValue(admin)

    await syncSubscription(subscription({ id: 'sub_old', status: 'canceled' }))

    expect(admin.upsert).not.toHaveBeenCalled()
  })

  it('maps a subscription without metadata through the stored customer id', async () => {
    const admin = makeAdmin({ user_id: 'u9', stripe_subscription_id: null, status: 'canceled' })
    mockGetSupabaseAdmin.mockReturnValue(admin)

    await syncSubscription(subscription({ metadata: {} }))

    expect(admin.eq).toHaveBeenCalledWith('stripe_customer_id', 'cus_123')
    expect(admin.upsert.mock.calls[0][0].user_id).toBe('u9')
  })
})

describe('syncSubscriptionById', () => {
  it('syncs the state freshly retrieved from Stripe', async () => {
    const admin = makeAdmin()
    mockGetSupabaseAdmin.mockReturnValue(admin)
    mockRetrieve.mockResolvedValue(subscription({ status: 'trialing' }))

    await syncSubscriptionById('sub_123')

    expect(mockRetrieve).toHaveBeenCalledWith('sub_123')
    expect(admin.upsert.mock.calls[0][0].status).toBe('trialing')
  })
})
