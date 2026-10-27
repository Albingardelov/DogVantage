import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import { isSupportedLocale, DEFAULT_LOCALE } from '@/i18n/config'
import { apiError } from '@/lib/api/errors'
import { getStripeCustomerId } from '@/lib/billing/subscription'
import { getStripe } from '@/lib/stripe/client'

export async function GET(req: NextRequest) {
  return withAuth(req, async ({ user }) => {
    const admin = getSupabaseAdmin()
    const { data } = await admin
      .from('user_settings')
      .select('locale')
      .eq('user_id', user.id)
      .maybeSingle()
    return NextResponse.json({ locale: data?.locale ?? DEFAULT_LOCALE })
  })
}

export async function PATCH(req: NextRequest) {
  return withAuth(req, async ({ user }) => {
    const body = await req.json().catch(() => null)
    const locale = (body as { locale?: unknown } | null)?.locale
    if (!isSupportedLocale(locale)) {
      return NextResponse.json({ error: 'invalid_locale' }, { status: 400 })
    }
    const admin = getSupabaseAdmin()
    const { error } = await admin
      .from('user_settings')
      .upsert({ user_id: user.id, locale }, { onConflict: 'user_id' })
    if (error) {
      return NextResponse.json({ error: 'save_failed' }, { status: 500 })
    }
    return NextResponse.json({ locale })
  })
}

export async function DELETE(req: NextRequest) {
  return withAuth(req, async ({ user }) => {
    const admin = getSupabaseAdmin()

    // Stop billing first. If that fails the account stays intact so the user
    // can retry, rather than being charged for an account that no longer exists.
    const customerId = await getStripeCustomerId(user.id)
    if (customerId) {
      try {
        await getStripe().customers.del(customerId)
      } catch (err) {
        if ((err as { code?: unknown }).code !== 'resource_missing') {
          return apiError(err, 'billing_cancel_failed')
        }
      }
    }

    const { data: dogs, error: dogsError } = await admin
      .from('dog_profiles')
      .select('id')
      .eq('user_id', user.id)
    if (dogsError) return apiError(dogsError, 'account_delete_failed')

    const dogIds = (dogs ?? []).map((d: { id: string }) => d.id)
    const results = await Promise.all([
      ...(dogIds.length > 0
        ? [
          admin.from('session_logs').delete().in('dog_id', dogIds),
          admin.from('daily_exercise_metrics').delete().in('dog_id', dogIds),
          admin.from('daily_progress').delete().in('dog_id', dogIds),
          admin.from('training_cache').delete().in('dog_id', dogIds),
        ]
        : []),
      admin.from('custom_exercises').delete().eq('user_id', user.id),
      admin.from('user_settings').delete().eq('user_id', user.id),
    ])
    const failed = results.find((r) => r.error)
    if (failed?.error) return apiError(failed.error, 'account_delete_failed')

    const { error: profilesError } = await admin.from('dog_profiles').delete().eq('user_id', user.id)
    if (profilesError) return apiError(profilesError, 'account_delete_failed')

    // Everything else (chat, subscription row, learning progress, ...) cascades from auth.users.
    const { error: userError } = await admin.auth.admin.deleteUser(user.id)
    if (userError) return apiError(userError, 'account_delete_failed')

    return NextResponse.json({ deleted: true })
  })
}
