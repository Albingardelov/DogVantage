import { getSupabaseAdmin } from './client'

export const DAILY_CHAT_LIMIT = 50

export async function incrementChatCount(userId: string): Promise<number> {
  // Database types may lag behind latest migration; call RPC via a narrow cast.
  const { data, error } = await (getSupabaseAdmin() as unknown as {
    rpc: (name: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>
  }).rpc('increment_chat_usage', { p_user_id: userId })
  if (error) throw new Error(error.message)
  return typeof data === 'number' ? data : 0
}
