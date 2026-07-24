import { getSupabaseAdmin } from './client'

export interface ActiveProjectRow {
  id: string
  protocol_id: string
  started_at: string
}

export async function getActiveProject(dogId: string): Promise<ActiveProjectRow | null> {
  const { data, error } = await getSupabaseAdmin()
    .from('training_projects')
    .select('id, protocol_id, started_at')
    .eq('dog_id', dogId)
    .eq('status', 'active')
    .maybeSingle()
  if (error || !data) return null
  return data as ActiveProjectRow
}

/** Startar ett nytt projekt. Ett ev. pågående projekt avslutas först ('stopped'). */
export async function startProject(dogId: string, protocolId: string): Promise<ActiveProjectRow> {
  const admin = getSupabaseAdmin()
  const { error: stopError } = await admin
    .from('training_projects')
    .update({ status: 'stopped', ended_at: new Date().toISOString() })
    .eq('dog_id', dogId)
    .eq('status', 'active')
  if (stopError) throw new Error(`Project stop failed: ${stopError.message}`)

  const { data, error } = await admin
    .from('training_projects')
    .insert({ dog_id: dogId, protocol_id: protocolId })
    .select('id, protocol_id, started_at')
    .single()
  if (error || !data) throw new Error(`Project insert failed: ${error?.message}`)
  return data as ActiveProjectRow
}

export async function endActiveProject(
  dogId: string,
  status: 'completed' | 'stopped',
): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from('training_projects')
    .update({ status, ended_at: new Date().toISOString() })
    .eq('dog_id', dogId)
    .eq('status', 'active')
  if (error) throw new Error(`Project end failed: ${error.message}`)
}
