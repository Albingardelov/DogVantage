import { getSupabaseBrowser } from './browser'

export async function getActiveDogId(): Promise<string | null> {
  const { data } = await getSupabaseBrowser()
    .from('user_settings')
    .select('active_dog_id')
    .single()
  return data?.active_dog_id ?? null
}

export async function setActiveDogId(userId: string, dogId: string): Promise<void> {
  const { error } = await getSupabaseBrowser()
    .from('user_settings')
    .upsert({ user_id: userId, active_dog_id: dogId, updated_at: new Date().toISOString() })
  if (error) throw new Error(`setActiveDogId failed: ${error.message}`)
}
