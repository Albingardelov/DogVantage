import { getSupabaseAdmin } from './client'

const TOPIC_WINDOW_DAYS = 14
const MAX_TOPICS = 3

export async function logChatTopic(dogId: string, topic: string): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from('chat_topics')
    .insert({ dog_id: dogId, topic })
  if (error) throw new Error(`chat topic insert failed: ${error.message}`)
}

export async function getRecentChatTopics(dogId: string): Promise<string[]> {
  const since = new Date()
  since.setUTCDate(since.getUTCDate() - TOPIC_WINDOW_DAYS)
  const { data, error } = await getSupabaseAdmin()
    .from('chat_topics')
    .select('topic, created_at')
    .eq('dog_id', dogId)
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: false })
    .limit(30)
  if (error || !data) return []
  const seen = new Set<string>()
  for (const row of data) {
    seen.add(row.topic)
    if (seen.size >= MAX_TOPICS) break
  }
  return [...seen]
}
