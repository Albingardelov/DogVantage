import { getSupabaseAdmin } from './client'

/**
 * Exercise ids the dog has actually trained before today
 * (≥1 logged attempt on an earlier date). Ownership is enforced
 * by the calling route via withAuthAndDog.
 */
export async function getPracticedExerciseIds(
  dogId: string,
  todayDate: string,
): Promise<string[]> {
  const { data, error } = await getSupabaseAdmin()
    .from('daily_exercise_metrics')
    .select('exercise_id, success_count, fail_count')
    .eq('dog_id', dogId)
    .lt('date', todayDate)

  if (error) throw new Error(`exercise history fetch failed: ${error.message}`)

  const practiced = new Set<string>()
  for (const row of data ?? []) {
    if ((row.success_count ?? 0) + (row.fail_count ?? 0) > 0) {
      practiced.add(row.exercise_id)
    }
  }
  return [...practiced]
}
