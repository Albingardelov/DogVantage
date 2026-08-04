import { NextRequest, NextResponse } from 'next/server'
import { withAuthAndDog } from '@/lib/api/with-auth'
import { apiError } from '@/lib/api/errors'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import {
  computeProgressionDecisions,
  type ProgressionMetricRow,
  type ProgressionSessionRow,
} from '@/lib/training/progression-rules'
import type { ExerciseSummary, LatencyBucket } from '@dogvantage/core'

function daysAgo(days: number): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - days)
  return d.toISOString().slice(0, 10)
}

export async function GET(req: NextRequest) {
  return withAuthAndDog(req, async ({ dog }) => {
    const requestedBreed = req.nextUrl.searchParams.get('breed')
    if (requestedBreed && requestedBreed !== dog.breed) {
      console.warn(`[GET /api/training/progression] ignored mismatched breed query="${requestedBreed}" for dog=${dog.id}`)
    }
    const since = daysAgo(14)
    const admin = getSupabaseAdmin()

    const [metricsRes, logsRes] = await Promise.all([
      admin
        .from('daily_exercise_metrics')
        .select('exercise_id, date, success_count, fail_count, latency_bucket, criteria_level_id')
        .eq('dog_id', dog.id)
        .eq('breed', dog.breed)
        .gte('date', since),
      admin
        .from('session_logs')
        .select('created_at, exercises')
        .eq('dog_id', dog.id)
        .eq('breed', dog.breed)
        .gte('created_at', `${daysAgo(7)}T00:00:00Z`)
        .order('created_at', { ascending: false })
        .limit(80),
    ])

    if (metricsRes.error) {
      return apiError(metricsRes.error, 'failed_to_load_progression')
    }
    if (logsRes.error) {
      return apiError(logsRes.error, 'failed_to_load_progression_logs')
    }

    const labels: Record<string, string> = {}
    const logs = logsRes.data ?? []
    for (const row of logs) {
      const exercises = (row as { exercises: ExerciseSummary[] | null }).exercises ?? []
      for (const ex of exercises) {
        if (ex.id && ex.label && !labels[ex.id]) labels[ex.id] = ex.label
      }
    }

    const rows: ProgressionMetricRow[] = (metricsRes.data ?? []).map((r) => ({
      exercise_id: r.exercise_id,
      date: r.date,
      success_count: r.success_count ?? 0,
      fail_count: r.fail_count ?? 0,
      latency_bucket: r.latency_bucket as LatencyBucket | null,
      criteria_level_id: r.criteria_level_id ?? null,
    }))

    const sessionRows: ProgressionSessionRow[] = logs.flatMap((row) => {
      const createdAt = (row as { created_at?: string | null }).created_at
      if (!createdAt) return []
      const date = createdAt.slice(0, 10)
      const exercises = (row as { exercises: ExerciseSummary[] | null }).exercises ?? []
      return exercises.map((exercise) => ({
        exercise_id: exercise.id,
        criteria_level_id: exercise.criteria_level_id ?? null,
        date,
      }))
    })

    const decisions = computeProgressionDecisions(rows, { windowDays: 7, now: new Date(), sessionRows })
      .map((d) => ({
        exerciseId: d.exercise_id,
        label: labels[d.exercise_id] ?? d.exercise_id,
        decision: d.decision,
        reason: d.reason,
        attempts: d.attempts,
        successRate: d.success_rate,
        criteriaLevelId: d.criteria_level_id,
      }))

    return NextResponse.json({ decisions })
  })
}
