import type { DailyExerciseMetrics, Exercise, ExerciseSummary } from '@/types'

export function emptyMetrics(): DailyExerciseMetrics {
  return {
    success_count: 0,
    fail_count: 0,
    latency_bucket: null,
    criteria_level_id: null,
  }
}

export function buildExerciseSummaries(
  exercises: Exercise[],
  metrics: Record<string, DailyExerciseMetrics>,
): ExerciseSummary[] {
  return exercises.map((ex) => {
    const m = metrics[ex.id]
    return {
      id: ex.id,
      label: ex.label,
      success_count: m?.success_count ?? 0,
      fail_count: m?.fail_count ?? 0,
      latency_bucket: m?.latency_bucket ?? null,
      criteria_level_id: m?.criteria_level_id ?? null,
    }
  })
}
