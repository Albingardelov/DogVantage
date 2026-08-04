import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@dogvantage/core'

export interface ChatHistoryRow {
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export async function getChatMessages(
  supabase: SupabaseClient<Database>,
  dogId: string,
  limit: number,
): Promise<ChatHistoryRow[]> {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('role, content, created_at')
    .eq('dog_id', dogId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error || !data) return []
  return (data as ChatHistoryRow[]).reverse()
}

export async function appendChatExchange(
  supabase: SupabaseClient<Database>,
  dogId: string,
  query: string,
  answer: string,
): Promise<void> {
  const userInsert = await supabase
    .from('chat_messages')
    .insert({ dog_id: dogId, role: 'user', content: query })
  if (userInsert.error) throw new Error(`chat message insert failed: ${userInsert.error.message}`)

  // Two sequential inserts instead of one batch: created_at defaults to now() per row,
  // so a batch would assign identical timestamps making user/assistant order undefined.
  const assistantInsert = await supabase
    .from('chat_messages')
    .insert({ dog_id: dogId, role: 'assistant', content: answer })
  if (assistantInsert.error) throw new Error(`chat message insert failed: ${assistantInsert.error.message}`)
}
