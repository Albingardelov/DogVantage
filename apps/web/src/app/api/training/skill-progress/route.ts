import { NextRequest, NextResponse } from 'next/server'
import { withAuthAndDog } from '@/lib/api/with-auth'
import { apiError } from '@/lib/api/errors'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import { aggregateSkillProgress, type MetricRow } from '@dogvantage/core'
import { getExerciseSpec } from '@dogvantage/core'
import type { ExerciseSummary } from '@dogvantage/core'

function daysAgo(days: number): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - days)
  return d.toISOString().slice(0, 10)
}

export async function GET(req: NextRequest) {
  const requestedBreed = req.nextUrl.searchParams.get('breed')
  const weeksParam = Number(req.nextUrl.searchParams.get('weeks') ?? '4')
  const weeks = Number.isFinite(weeksParam) ? Math.min(12, Math.max(1, Math.round(weeksParam))) : 4

  return withAuthAndDog(req, async ({ dog }) => {
    if (requestedBreed && requestedBreed !== dog.breed) {
      console.warn(`[GET /api/training/skill-progress] ignored mismatched breed query="${requestedBreed}" for dog=${dog.id}`)
    }
    const since = daysAgo(weeks * 7 + 7)
    const admin = getSupabaseAdmin()

    const [metricsRes, logsRes] = await Promise.all([
      admin
        .from('daily_exercise_metrics')
        .select('exercise_id, date, success_count, fail_count, criteria_level_id')
        .eq('dog_id', dog.id)
        .eq('breed', dog.breed)
        .gte('date', since),
      admin
        .from('session_logs')
        .select('exercises')
        .eq('dog_id', dog.id)
        .order('created_at', { ascending: false })
        .limit(60),
    ])

    if (metricsRes.error) {
      return apiError(metricsRes.error, 'failed_to_load_skill_progress')
    }
    if (logsRes.error) {
      return apiError(logsRes.error, 'failed_to_load_skill_progress_logs')
    }

    const exerciseLabels: Record<string, string> = {}
    const criteriaLabels: Record<string, string> = {}
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
    for (const row of rows) {
      const spec = getExerciseSpec(row.exercise_id)
      if (!spec) continue
      for (const level of spec.ladder) {
        if (!criteriaLabels[level.id]) criteriaLabels[level.id] = level.label
      }
    }

    const progress = aggregateSkillProgress(rows, {
      exerciseLabels,
      criteriaLabels,
      endDate: new Date(),
      weeks,
    })

    return NextResponse.json({ exercises: progress })
  })
}
