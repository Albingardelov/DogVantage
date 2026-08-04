import { getSupabaseAdmin } from './client'
import type { Breed } from '@/types'

export async function getProgress(
  breed: Breed,
  date: string,
  dogId: string
): Promise<Record<string, number>> {
  const { data, error } = await getSupabaseAdmin()
    .from('daily_progress')
    .select('exercise_id, reps_done')
    .eq('dog_id', dogId)
    .eq('breed', breed)
    .eq('date', date)

  if (error) throw new Error(`Progress fetch failed: ${error.message}`)
  return Object.fromEntries((data ?? []).map((r) => [r.exercise_id as string, r.reps_done as number]))
}

export async function upsertProgress(
  breed: Breed,
  date: string,
  dogId: string,
  exerciseId: string,
  repsDone: number
): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from('daily_progress')
    .upsert(
      { dog_id: dogId, breed, date, exercise_id: exerciseId, reps_done: repsDone },
      { onConflict: 'dog_id,breed,date,exercise_id' }
    )

  if (error) throw new Error(`Progress upsert failed: ${error.message}`)
}
