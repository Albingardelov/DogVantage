import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/client'

export async function DELETE() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const admin = getSupabaseAdmin()

  await Promise.allSettled([
    admin.from('dog_profiles').delete().eq('user_id', user.id),
    admin.from('session_logs').delete().eq('user_id', user.id),
    admin.from('custom_exercises').delete().eq('user_id', user.id),
    admin.from('daily_exercise_metrics').delete().eq('dog_key', user.id),
    admin.from('daily_progress').delete().eq('dog_key', user.id),
    admin.from('training_cache').delete().like('breed', `%${user.id}%`),
  ])

  await admin.auth.admin.deleteUser(user.id)

  return NextResponse.json({ deleted: true })
}
