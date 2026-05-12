import { getSupabaseAdmin } from './client'

export const DAILY_CHAT_LIMIT = 50

function todayUtc(): string {
  return new Date().toISOString().split('T')[0]
}

export async function getTodayChatCount(userId: string): Promise<number> {
  const { data } = await getSupabaseAdmin()
    .from('chat_usage')
    .select('count')
    .eq('user_id', userId)
    .eq('date', todayUtc())
    .maybeSingle()

  return data?.count ?? 0
}

export async function incrementChatCount(userId: string): Promise<void> {
  const date = todayUtc()
  const admin = getSupabaseAdmin()

  const { data } = await admin
    .from('chat_usage')
    .select('count')
    .eq('user_id', userId)
    .eq('date', date)
    .maybeSingle()

  const next = (data?.count ?? 0) + 1

  await admin
    .from('chat_usage')
    .upsert({ user_id: userId, date, count: next }, { onConflict: 'user_id,date' })
}
