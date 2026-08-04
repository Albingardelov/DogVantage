import { getSupabaseAdmin } from './client'

export async function logExerciseSkip(
  dogId: string,
  exerciseId: string,
  date: string,
): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from('exercise_skips')
    .insert({ dog_id: dogId, exercise_id: exerciseId, date })
  if (error) throw new Error(`Exercise skip insert failed: ${error.message}`)
}

/** Antal skippningar per övning de senaste `days` dagarna. */
export async function getRecentSkipCounts(
  dogId: string,
  days = 14,
): Promise<Record<string, number>> {
  const since = new Date()
  since.setUTCDate(since.getUTCDate() - days)
  const { data, error } = await getSupabaseAdmin()
    .from('exercise_skips')
    .select('exercise_id')
    .eq('dog_id', dogId)
    .gte('date', since.toISOString().slice(0, 10))
    .limit(200)
  if (error || !data) return {}
  const counts: Record<string, number> = {}
  for (const row of data) {
    counts[row.exercise_id] = (counts[row.exercise_id] ?? 0) + 1
  }
  return counts
}
