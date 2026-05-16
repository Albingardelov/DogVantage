import type Stripe from 'stripe'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import { STRIPE_PRICE_IDS } from '@/lib/stripe/client'
import type { SubscriptionStatus, Tier } from './subscription'

export function tierFromPriceId(priceId: string | undefined): Tier {
  if (priceId === STRIPE_PRICE_IDS.proMonthly || priceId === STRIPE_PRICE_IDS.proAnnual) return 'pro'
  if (priceId === STRIPE_PRICE_IDS.basic) return 'basic'
  return 'free'
}

export function statusFromStripe(status: Stripe.Subscription.Status): SubscriptionStatus {
  return status as SubscriptionStatus
}

export async function syncSubscription(sub: Stripe.Subscription): Promise<void> {
  const raw = sub as unknown as Record<string, unknown>
  const metadata = (raw.metadata ?? {}) as Record<string, unknown>
  const userId = typeof metadata.user_id === 'string' ? metadata.user_id : null
  if (!userId) {
    console.error('[stripe-webhook] subscription missing user_id metadata', sub.id)
    return
  }

  const priceId = sub.items.data[0]?.price?.id
  const tier = tierFromPriceId(priceId)
  const status = statusFromStripe(sub.status)
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id
  const trialEnd = typeof raw.trial_end === 'number' ? raw.trial_end : null
  const currentPeriodEnd = typeof raw.current_period_end === 'number' ? raw.current_period_end : null

  const admin = getSupabaseAdmin() as unknown as {
    from: (table: string) => {
      upsert: (payload: Record<string, unknown>, options: { onConflict: string }) => Promise<{ error: { message: string } | null }>
    }
  }

  const { error } = await admin.from('subscriptions').upsert(
    {
      user_id: userId,
      stripe_customer_id: customerId,
      stripe_subscription_id: sub.id,
      tier,
      status,
      trial_end: trialEnd ? new Date(trialEnd * 1000).toISOString() : null,
      current_period_end: currentPeriodEnd
        ? new Date(currentPeriodEnd * 1000).toISOString()
        : null,
      cancel_at_period_end: sub.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  )
  if (error) throw new Error(error.message)
}

export async function markCanceled(sub: Stripe.Subscription): Promise<void> {
  const userId = sub.metadata?.user_id
  if (!userId) return

  const admin = getSupabaseAdmin() as unknown as {
    from: (table: string) => {
      update: (payload: Record<string, unknown>) => {
        eq: (column: string, value: string) => Promise<{ error: { message: string } | null }>
      }
    }
  }

  const { error } = await admin
    .from('subscriptions')
    .update({
      tier: 'free',
      status: 'canceled',
      cancel_at_period_end: false,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)

  if (error) throw new Error(error.message)
}

export async function markPastDue(invoice: Stripe.Invoice): Promise<void> {
  const raw = invoice as unknown as Record<string, unknown>
  const directSubscription = raw.subscription
  const subId = typeof directSubscription === 'string'
    ? directSubscription
    : null
  if (!subId) return

  const admin = getSupabaseAdmin() as unknown as {
    from: (table: string) => {
      update: (payload: Record<string, unknown>) => {
        eq: (column: string, value: string) => Promise<{ error: { message: string } | null }>
      }
    }
  }

  const { error } = await admin
    .from('subscriptions')
    .update({
      status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subId)

  if (error) throw new Error(error.message)
}
