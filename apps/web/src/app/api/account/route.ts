import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import { isSupportedLocale, DEFAULT_LOCALE } from '@/i18n/config'

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
    const { data: dogs } = await admin
      .from('dog_profiles')
      .select('id')
      .eq('user_id', user.id)

    const dogIds = (dogs ?? []).map((d: { id: string }) => d.id)
    await Promise.allSettled([
      dogIds.length > 0 && admin.from('session_logs').delete().in('dog_id', dogIds),
      dogIds.length > 0 && admin.from('daily_exercise_metrics').delete().in('dog_id', dogIds),
      dogIds.length > 0 && admin.from('daily_progress').delete().in('dog_id', dogIds),
      dogIds.length > 0 && admin.from('training_cache').delete().in('dog_id', dogIds),
      admin.from('custom_exercises').delete().eq('user_id', user.id),
      admin.from('user_settings').delete().eq('user_id', user.id),
      admin.from('dog_profiles').delete().eq('user_id', user.id),
    ])

    await admin.auth.admin.deleteUser(user.id)
    return NextResponse.json({ deleted: true })
  })
}
