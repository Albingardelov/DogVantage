export interface ExerciseMetricRow {
  exercise_id: string
  success_count: number | null
  fail_count: number | null
}

const MIN_ATTEMPTS = 4

/** Exercise ids sorted weakest-first by success rate. Exercises with too few attempts are dropped. */
export function rankWeakestExercises(rows: ExerciseMetricRow[], minAttempts = MIN_ATTEMPTS): string[] {
  const byExercise = new Map<string, { success: number; attempts: number }>()
  for (const row of rows) {
    const agg = byExercise.get(row.exercise_id) ?? { success: 0, attempts: 0 }
    agg.success += row.success_count ?? 0
    agg.attempts += (row.success_count ?? 0) + (row.fail_count ?? 0)
    byExercise.set(row.exercise_id, agg)
  }
  return [...byExercise.entries()]
    .filter(([, agg]) => agg.attempts >= minAttempts)
    .sort(([, a], [, b]) => a.success / a.attempts - b.success / b.attempts)
    .map(([exerciseId]) => exerciseId)
}

/**
 * Next micro-lesson topic: weakest exercise the owner has not already taken the
 * lesson quiz on, falling back to the life-stage default. Null when everything
 * is recently completed — the card hides instead of repeating itself.
 */
export function pickMicroLessonExercise(
  ranked: string[],
  fallback: string,
  completed: ReadonlySet<string>,
): string | null {
  for (const exerciseId of ranked) {
    if (!completed.has(exerciseId)) return exerciseId
  }
  return completed.has(fallback) ? null : fallback
}
