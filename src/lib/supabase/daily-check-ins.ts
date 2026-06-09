import { getSupabaseAdmin } from './client'
import type { PuppyZone } from '@/lib/training/puppy-zone'

export async function getCheckIn(dogId: string, date: string): Promise<PuppyZone | null> {
  const { data, error } = await getSupabaseAdmin()
    .from('daily_check_ins')
    .select('zone')
    .eq('dog_id', dogId)
    .eq('date', date)
    .maybeSingle()
  if (error || !data) return null
  return data.zone as PuppyZone
}

export async function saveCheckIn(dogId: string, date: string, zone: PuppyZone): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from('daily_check_ins')
    .upsert({ dog_id: dogId, date, zone }, { onConflict: 'dog_id,date' })
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
