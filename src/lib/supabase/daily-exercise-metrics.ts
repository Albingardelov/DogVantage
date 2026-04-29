import { supabaseAdmin } from './client'
import type { Breed } from '@/types'
import type { DailyExerciseMetrics, LatencyBucket } from '@/types'

type Row = {
  exercise_id: string
  success_count: number
  fail_count: number
  latency_bucket: LatencyBucket | null
  criteria_level_id: string | null
  notes: string | null
}

export async function getMetrics(
  breed: Breed,
  date: string
): Promise<Record<string, DailyExerciseMetrics>> {
  const { data, error } = await supabaseAdmin
    .from('daily_exercise_metrics')
    .select('exercise_id, success_count, fail_count, latency_bucket, criteria_level_id, notes')
    .eq('breed', breed)
    .eq('date', date)

  if (error) throw new Error(`Metrics fetch failed: ${error.message}`)

  const rows = (data ?? []) as unknown as Row[]
  return Object.fromEntries(rows.map((r) => [r.exercise_id, {
    success_count: r.success_count ?? 0,
    fail_count: r.fail_count ?? 0,
    latency_bucket: (r.latency_bucket ?? null) as LatencyBucket | null,
    criteria_level_id: r.criteria_level_id ?? null,
    notes: r.notes ?? undefined,
  } satisfies DailyExerciseMetrics]))
}

export async function upsertMetrics(
  breed: Breed,
  date: string,
  exerciseId: string,
  patch: Partial<DailyExerciseMetrics>
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('daily_exercise_metrics')
    .upsert(
      {
        breed,
        date,
        exercise_id: exerciseId,
        success_count: patch.success_count,
        fail_count: patch.fail_count,
        latency_bucket: patch.latency_bucket ?? null,
        criteria_level_id: patch.criteria_level_id ?? null,
        notes: patch.notes ?? null,
      },
      { onConflict: 'breed,date,exercise_id' }
    )

  if (error) throw new Error(`Metrics upsert failed: ${error.message}`)
}

