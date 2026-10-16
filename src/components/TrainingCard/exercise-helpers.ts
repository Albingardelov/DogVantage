import type { DailyExerciseMetrics, Exercise, ExerciseSummary } from '@/types'

export function emptyMetrics(): DailyExerciseMetrics {
  return {
    success_count: 0,
    fail_count: 0,
    latency_bucket: null,
    criteria_level_id: null,
  }
}

/** Patch that adds one to a count, based on the latest known metrics for the exercise. */
export function incrementedCountPatch(
  current: DailyExerciseMetrics | null,
  field: 'success_count' | 'fail_count',
): Partial<DailyExerciseMetrics> {
  return field === 'success_count'
    ? { success_count: (current?.success_count ?? 0) + 1 }
    : { fail_count: (current?.fail_count ?? 0) + 1 }
}

/** Share of logged attempts that succeeded, or null when nothing has been attempted. */
export function successRatePercent(successes: number, fails: number): number | null {
  const attempts = successes + fails
  return attempts > 0 ? Math.round((successes / attempts) * 100) : null
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
