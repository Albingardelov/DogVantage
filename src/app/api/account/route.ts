import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/client'

export async function DELETE() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

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
}
