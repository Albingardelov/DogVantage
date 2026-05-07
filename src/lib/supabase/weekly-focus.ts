import { getSupabaseAdmin } from './client'
import { sanitizeFocusAreas, type WeeklyFocusArea } from '@/lib/training/weekly-focus'

export async function getWeeklyFocus(
  dogId: string,
  isoWeek: string
): Promise<WeeklyFocusArea[]> {
  const { data, error } = await getSupabaseAdmin()
    .from('weekly_focus')
    .select('focus_areas')
    .eq('dog_id', dogId)
    .eq('iso_week', isoWeek)
    .maybeSingle()
  if (error || !data) return []
  return sanitizeFocusAreas(data.focus_areas)
}

export async function setWeeklyFocus(
  dogId: string,
  isoWeek: string,
  areas: WeeklyFocusArea[]
): Promise<void> {
  const sanitized = sanitizeFocusAreas(areas)
  const { error } = await getSupabaseAdmin()
    .from('weekly_focus')
    .upsert(
      {
        dog_id: dogId,
        iso_week: isoWeek,
        focus_areas: sanitized,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'dog_id,iso_week' }
    )
  if (error) throw new Error(`Weekly focus upsert failed: ${error.message}`)
}
