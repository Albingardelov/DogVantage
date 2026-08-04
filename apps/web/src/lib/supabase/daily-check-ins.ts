import { getSupabaseAdmin } from './client'
import type { PuppyZone } from '@dogvantage/core'

export interface DayCheckInRow {
  zone: PuppyZone
  handler_energy: 'low' | 'ok' | 'high' | null
  minutes_available: number | null
}

export async function getCheckIn(dogId: string, date: string): Promise<DayCheckInRow | null> {
  const { data, error } = await getSupabaseAdmin()
    .from('daily_check_ins')
    .select('zone, handler_energy, minutes_available')
    .eq('dog_id', dogId)
    .eq('date', date)
    .maybeSingle()
  if (error || !data) return null
  return data as DayCheckInRow
}

export async function saveCheckIn(
  dogId: string,
  date: string,
  checkIn: {
    zone: PuppyZone
    handler_energy?: 'low' | 'ok' | 'high' | null
    minutes_available?: number | null
  },
): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from('daily_check_ins')
    .upsert({ dog_id: dogId, date, ...checkIn }, { onConflict: 'dog_id,date' })
  if (error) throw new Error(`Check-in upsert failed: ${error.message}`)
}

export async function getCheckIns(
  dogId: string,
  fromDate: string,
  toDate: string,
): Promise<Record<string, PuppyZone>> {
  const { data } = await getSupabaseAdmin()
    .from('daily_check_ins')
    .select('date, zone')
    .eq('dog_id', dogId)
    .gte('date', fromDate)
    .lte('date', toDate)
  return Object.fromEntries(
    (data ?? []).map((r) => [r.date as string, r.zone as PuppyZone]),
  )
}
