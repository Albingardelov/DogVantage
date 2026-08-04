import { getSupabaseAdmin } from './client'
import {
  sanitizeFocusAreas,
  sanitizePriorityExerciseIds,
  type WeeklyFocusArea,
  type WeeklyPlanningPreferences,
} from '@dogvantage/core'

export async function getWeeklyFocusPreferences(
  dogId: string,
  isoWeek: string
): Promise<WeeklyPlanningPreferences> {
  const { data, error } = await getSupabaseAdmin()
    .from('weekly_focus')
    .select('focus_areas, priority_exercise_ids')
    .eq('dog_id', dogId)
    .eq('iso_week', isoWeek)
    .maybeSingle()
  if (error || !data) return { areas: [], priorityExerciseIds: [] }
  return {
    areas: sanitizeFocusAreas(data.focus_areas),
    priorityExerciseIds: sanitizePriorityExerciseIds((data as { priority_exercise_ids?: unknown }).priority_exercise_ids ?? []),
  }
}

export async function setWeeklyFocusPreferences(
  dogId: string,
  isoWeek: string,
  areas: WeeklyFocusArea[],
  priorityExerciseIds: string[]
): Promise<void> {
  const sanitized = sanitizeFocusAreas(areas)
  const sanitizedPriorityIds = sanitizePriorityExerciseIds(priorityExerciseIds)
  const { error } = await getSupabaseAdmin()
    .from('weekly_focus')
    .upsert(
      {
        dog_id: dogId,
        iso_week: isoWeek,
        focus_areas: sanitized,
        priority_exercise_ids: sanitizedPriorityIds,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'dog_id,iso_week' }
    )
  if (error) throw new Error(`Weekly focus upsert failed: ${error.message}`)
}
