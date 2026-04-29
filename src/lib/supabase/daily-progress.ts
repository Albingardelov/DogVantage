// src/lib/supabase/daily-progress.ts
import { supabaseAdmin } from './client'
import type { Breed } from '@/types'

export async function getProgress(
  breed: Breed,
  date: string
): Promise<Record<string, number>> {
  const { data, error } = await supabaseAdmin
    .from('daily_progress')
    .select('exercise_id, reps_done')
    .eq('breed', breed)
    .eq('date', date)

  if (error) throw new Error(`Progress fetch failed: ${error.message}`)
  return Object.fromEntries((data ?? []).map((r) => [r.exercise_id as string, r.reps_done as number]))
}

export async function upsertProgress(
  breed: Breed,
  date: string,
  exerciseId: string,
  repsDone: number
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('daily_progress')
    .upsert(
      { breed, date, exercise_id: exerciseId, reps_done: repsDone },
      { onConflict: 'breed,date,exercise_id' }
    )

  if (error) throw new Error(`Progress upsert failed: ${error.message}`)
}
