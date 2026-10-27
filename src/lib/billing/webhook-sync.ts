import type Stripe from 'stripe'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import { getStripe, STRIPE_PRICE_IDS } from '@/lib/stripe/client'
import type { SubscriptionStatus, Tier } from './subscription'

const ENTITLED_STATUSES: ReadonlySet<SubscriptionStatus> = new Set(['active', 'trialing', 'past_due'])
const CLOSED_STATUSES: ReadonlySet<SubscriptionStatus> = new Set(['canceled', 'incomplete_expired'])

interface ExistingRow {
  user_id: string
  stripe_subscription_id: string | null
  status: SubscriptionStatus
}

type AdminClient = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        maybeSingle: () => Promise<{ data: ExistingRow | null; error: { message: string } | null }>
      }
    }
    upsert: (
      payload: Record<string, unknown>,
      options: { onConflict: string },
    ) => Promise<{ error: { message: string } | null }>
  }
}

function admin(): AdminClient {
  return getSupabaseAdmin() as unknown as AdminClient
}

export function tierFromPriceId(priceId: string | undefined): Tier {
  if (priceId && (priceId === STRIPE_PRICE_IDS.proMonthly || priceId === STRIPE_PRICE_IDS.proAnnual)) return 'pro'
  if (priceId && priceId === STRIPE_PRICE_IDS.basic) return 'basic'
  return 'free'
}

/**
 * Billing period end. Since API version 2025-03-31 Stripe reports it per
 * subscription item; older payloads still carry it on the subscription.
 */
export function periodEndFromSubscription(sub: Stripe.Subscription): number | null {
  const itemEnds = sub.items.data
    .map((item) => (item as { current_period_end?: unknown }).current_period_end)
    .filter((v): v is number => typeof v === 'number')
  if (itemEnds.length > 0) return Math.max(...itemEnds)
  const legacy = (sub as unknown as { current_period_end?: unknown }).current_period_end
  return typeof legacy === 'number' ? legacy : null
}

export function subscriptionIdFromInvoice(invoice: Stripe.Invoice): string | null {
  const fromParent = invoice.parent?.subscription_details?.subscription
  if (fromParent) return typeof fromParent === 'string' ? fromParent : fromParent.id
  const legacy = (invoice as unknown as { subscription?: unknown }).subscription
  if (typeof legacy === 'string') return legacy
  if (legacy && typeof legacy === 'object' && typeof (legacy as { id?: unknown }).id === 'string') {
    return (legacy as { id: string }).id
  }
  return null
}

async function resolveUserId(sub: Stripe.Subscription, customerId: string): Promise<string | null> {
  const fromMetadata = sub.metadata?.user_id
  if (typeof fromMetadata === 'string' && fromMetadata.length > 0) return fromMetadata
  const { data } = await admin()
    .from('subscriptions')
    .select('user_id, stripe_subscription_id, status')
    .eq('stripe_customer_id', customerId)
    .maybeSingle()
  return data?.user_id ?? null
}

/**
 * Writes the subscription's current state to the user's row. Callers pass a
 * subscription freshly retrieved from Stripe, so replayed or out-of-order
 * webhook events converge on the same result.
 */
export async function syncSubscription(sub: Stripe.Subscription): Promise<void> {
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id
  const userId = await resolveUserId(sub, customerId)
  if (!userId) {
    console.error('[stripe-webhook] cannot map subscription to a user', sub.id)
    return
  }

  const status = sub.status as SubscriptionStatus
  const { data: existing, error: existingError } = await admin()
    .from('subscriptions')
    .select('user_id, stripe_subscription_id, status')
    .eq('user_id', userId)
    .maybeSingle()
  if (existingError) throw new Error(existingError.message)
  if (!existing && CLOSED_STATUSES.has(status)) {
    // Typically the cancellation that follows an account deletion: nothing to record.
    return
  }

  const replacesOtherSubscription = existing?.stripe_subscription_id != null
    && existing.stripe_subscription_id !== sub.id
  if (replacesOtherSubscription && ENTITLED_STATUSES.has(existing.status) && !ENTITLED_STATUSES.has(status)) {
    console.warn('[stripe-webhook] ignoring inactive subscription that is not the current one', sub.id)
    return
  }

  const priceId = sub.items.data[0]?.price?.id
  const priceTier = tierFromPriceId(priceId)
  if (priceTier === 'free' && !CLOSED_STATUSES.has(status)) {
    console.error('[stripe-webhook] unknown price id, check STRIPE_PRICE_* env', priceId, sub.id)
  }
  const tier: Tier = CLOSED_STATUSES.has(status) ? 'free' : priceTier
  const periodEnd = periodEndFromSubscription(sub)

  const { error } = await admin().from('subscriptions').upsert(
    {
      user_id: userId,
      stripe_customer_id: customerId,
      stripe_subscription_id: sub.id,
      tier,
      status,
      trial_end: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      cancel_at_period_end: sub.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  )
  if (error) throw new Error(error.message)
}

export async function syncSubscriptionById(subscriptionId: string): Promise<void> {
  const sub = await getStripe().subscriptions.retrieve(subscriptionId)
  await syncSubscription(sub)
}
