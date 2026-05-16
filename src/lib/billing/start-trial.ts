import { getSupabaseAdmin } from '@/lib/supabase/client'
import { getStripe } from '@/lib/stripe/client'

const TRIAL_DAYS = 14

type SubscriptionExistsRow = { user_id: string }

export async function ensureTrial(userId: string, email: string): Promise<void> {
  const admin = getSupabaseAdmin() as unknown as {
    from: (table: string) => {
      select: (columns: string) => {
        eq: (column: string, value: string) => {
          maybeSingle: () => Promise<{ data: SubscriptionExistsRow | null; error?: { message: string } | null }>
        }
      }
      insert: (payload: Record<string, unknown>) => Promise<{ error: { message: string } | null }>
    }
  }

  const { data: existing, error: existingError } = await admin
    .from('subscriptions')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle()

  if (existingError) {
    throw new Error(`Failed to check trial state: ${existingError.message}`)
  }
  if (existing) return

  const customer = await getStripe().customers.create({
    email,
    metadata: { user_id: userId },
  })

  const trialEnd = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString()

  const { error } = await admin
    .from('subscriptions')
    .insert({
      user_id: userId,
      stripe_customer_id: customer.id,
      stripe_subscription_id: null,
      tier: 'pro',
      status: 'trialing',
      trial_end: trialEnd,
      current_period_end: trialEnd,
      cancel_at_period_end: false,
    })

  if (error) {
    console.error('[start-trial] insert failed', error)
    throw new Error(`Failed to create trial: ${error.message}`)
  }
}
