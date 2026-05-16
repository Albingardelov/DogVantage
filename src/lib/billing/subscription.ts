import { getSupabaseAdmin } from '@/lib/supabase/client'
import { createSupabaseServer } from '@/lib/supabase/server'

export type Tier = 'free' | 'basic' | 'pro'
export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired'
  | 'unpaid'

export type FeatureKey =
  | 'view_week_plan'
  | 'log_sessions'
  | 'calendar_history'
  | 'learn_library'
  | 'ai_chat'
  | 'multiple_dogs'
  | 'custom_exercises'
  | 'reactive_protocols'

export interface SubscriptionState {
  tier: Tier
  status: SubscriptionStatus
  stripeSubscriptionId: string | null
  trialEnd: Date | null
  currentPeriodEnd: Date | null
  cancelAtPeriodEnd: boolean
  isActive: boolean
  isOnTrial: boolean
  trialDaysLeft: number
}

export interface SubscriptionRow {
  tier: Tier
  status: SubscriptionStatus
  stripe_subscription_id: string | null
  trial_end: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
}

const TIER_FEATURES: Record<Tier, ReadonlySet<FeatureKey>> = {
  free: new Set(),
  basic: new Set([
    'view_week_plan',
    'log_sessions',
    'calendar_history',
    'learn_library',
  ]),
  pro: new Set([
    'view_week_plan',
    'log_sessions',
    'calendar_history',
    'learn_library',
    'ai_chat',
    'multiple_dogs',
    'custom_exercises',
    'reactive_protocols',
  ]),
}

const GRACE_DAYS = 3

export async function getSubscriptionState(userId: string): Promise<SubscriptionState> {
  const admin = getSupabaseAdmin() as unknown as {
    from: (table: string) => {
      select: (query: string) => {
        eq: (column: string, value: string) => {
          maybeSingle: () => Promise<{ data: SubscriptionRow | null }>
        }
      }
    }
  }

  const { data } = await admin
    .from('subscriptions')
    .select('tier, status, stripe_subscription_id, trial_end, current_period_end, cancel_at_period_end')
    .eq('user_id', userId)
    .maybeSingle()

  return mapState(data)
}

export function hasFeature(state: SubscriptionState, feature: FeatureKey): boolean {
  if (!state.isActive) return false
  return TIER_FEATURES[state.tier].has(feature)
}

export async function getCurrentSubscriptionState(): Promise<SubscriptionState | null> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  return getSubscriptionState(user.id)
}

function mapState(row: SubscriptionRow | null): SubscriptionState {
  if (!row) return emptyState()

  const now = new Date()
  const trialEnd = row.trial_end ? new Date(row.trial_end) : null
  const currentPeriodEnd = row.current_period_end ? new Date(row.current_period_end) : null
  const isOnTrial = row.status === 'trialing' && trialEnd != null && trialEnd > now

  let isActive = row.status === 'active' || isOnTrial
  if (row.status === 'past_due' && currentPeriodEnd) {
    const graceEnd = new Date(currentPeriodEnd.getTime() + GRACE_DAYS * 24 * 60 * 60 * 1000)
    isActive = now < graceEnd
  }

  const trialDaysLeft = isOnTrial && trialEnd
    ? Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)))
    : 0

  return {
    tier: row.tier,
    status: row.status,
    stripeSubscriptionId: row.stripe_subscription_id,
    trialEnd,
    currentPeriodEnd,
    cancelAtPeriodEnd: row.cancel_at_period_end,
    isActive,
    isOnTrial,
    trialDaysLeft,
  }
}

function emptyState(): SubscriptionState {
  return {
    tier: 'free',
    status: 'canceled',
    stripeSubscriptionId: null,
    trialEnd: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    isActive: false,
    isOnTrial: false,
    trialDaysLeft: 0,
  }
}
