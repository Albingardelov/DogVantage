import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import { aggregateSkillProgress, type MetricRow } from '@/lib/training/skill-progress'
import { isValidBreed } from '@/lib/breeds/registry'
import type { Breed, ExerciseSummary } from '@/types'

function daysAgo(days: number): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - days)
  return d.toISOString().slice(0, 10)
}

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const breed = req.nextUrl.searchParams.get('breed')
  const dogId = req.nextUrl.searchParams.get('dogId') ?? ''
  const weeksParam = Number(req.nextUrl.searchParams.get('weeks') ?? '4')
  const weeks = Number.isFinite(weeksParam) ? Math.min(12, Math.max(1, Math.round(weeksParam))) : 4

  if (!breed || !isValidBreed(breed)) return NextResponse.json({ error: 'breed required' }, { status: 400 })
  if (!dogId) return NextResponse.json({ error: 'dogId required' }, { status: 400 })

  const { data: dog } = await supabase
    .from('dog_profiles')
    .select('id')
    .eq('id', dogId)
    .eq('user_id', user.id)
    .single()
  if (!dog) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  const since = daysAgo(weeks * 7 + 7)

  const admin = getSupabaseAdmin()

  const [metricsRes, logsRes] = await Promise.all([
    admin
      .from('daily_exercise_metrics')
      .select('exercise_id, date, success_count, fail_count, criteria_level_id')
      .eq('dog_id', dogId)
      .eq('breed', breed)
      .gte('date', since),
    admin
      .from('session_logs')
      .select('exercises')
      .eq('dog_id', dogId)
      .order('created_at', { ascending: false })
      .limit(60),
  ])

  if (metricsRes.error) {
    return NextResponse.json({ error: metricsRes.error.message }, { status: 500 })
  }

  const exerciseLabels: Record<string, string> = {}
  const logs = logsRes.data ?? []
  for (const row of logs) {
    const exercises = (row as { exercises: ExerciseSummary[] | null }).exercises ?? []
    for (const ex of exercises) {
      if (ex.id && ex.label && !exerciseLabels[ex.id]) exerciseLabels[ex.id] = ex.label
    }
  }

  const rows: MetricRow[] = (metricsRes.data ?? []).map((r) => ({
    exercise_id: r.exercise_id,
    date: r.date,
    success_count: r.success_count ?? 0,
    fail_count: r.fail_count ?? 0,
    criteria_level_id: r.criteria_level_id ?? null,
  }))

  const progress = aggregateSkillProgress(rows, {
    exerciseLabels,
    endDate: new Date(),
    weeks,
    topN: 5,
  })

  return NextResponse.json({ exercises: progress })
}
