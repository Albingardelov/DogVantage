import { getSupabaseAdmin } from './client'

export interface HeatCycle {
  id: string
  dog_id: string
  started_at: string
  ended_at: string | null
}

export async function getActiveHeatCycle(dogId: string): Promise<HeatCycle | null> {
  const { data, error } = await getSupabaseAdmin()
    .from('heat_cycles')
    .select('id, dog_id, started_at, ended_at')
    .eq('dog_id', dogId)
    .is('ended_at', null)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error || !data) return null
  return data as HeatCycle
}

export async function getLastEndedHeatCycle(dogId: string): Promise<HeatCycle | null> {
  const { data, error } = await getSupabaseAdmin()
    .from('heat_cycles')
    .select('id, dog_id, started_at, ended_at')
    .eq('dog_id', dogId)
    .not('ended_at', 'is', null)
    .order('ended_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error || !data) return null
  return data as HeatCycle
}

export async function startHeatCycle(dogId: string): Promise<HeatCycle> {
  const { data, error } = await getSupabaseAdmin()
    .from('heat_cycles')
    .insert({ dog_id: dogId, started_at: new Date().toISOString() })
    .select('id, dog_id, started_at, ended_at')
    .single()
  if (error) throw new Error(`Failed to start heat cycle: ${error.message}`)
  return data as HeatCycle
}

export async function endHeatCycle(dogId: string): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from('heat_cycles')
    .update({ ended_at: new Date().toISOString() })
    .eq('dog_id', dogId)
    .is('ended_at', null)
  if (error) throw new Error(`Failed to end heat cycle: ${error.message}`)
}

/** Returns true if the skenfas window is active (6–9 weeks after heat ended). */
export function isSkenfasActive(lastEnded: HeatCycle | null): boolean {
  if (!lastEnded?.ended_at) return false
  const endedMs = new Date(lastEnded.ended_at).getTime()
  const nowMs = Date.now()
  const weeksAgo = (nowMs - endedMs) / (7 * 24 * 60 * 60 * 1000)
  return weeksAgo >= 6 && weeksAgo <= 9
}
