import { getSupabaseAdmin } from './client'

const LOCK_TTL_SECONDS = 30

type RpcClient = {
  rpc: (
    name: string,
    args: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: { message: string } | null }>
}

export async function tryAcquireGenerationLock(key: string): Promise<boolean> {
  const { data, error } = await (getSupabaseAdmin() as unknown as RpcClient).rpc(
    'try_acquire_generation_lock',
    { p_key: key, p_ttl_seconds: LOCK_TTL_SECONDS },
  )
  if (error) {
    // Fail open: a broken lock table must not stop plan generation entirely.
    console.error('[generation-lock] acquire failed:', error.message)
    return true
  }
  return data === true
}

export async function releaseGenerationLock(key: string): Promise<void> {
  const { error } = await (getSupabaseAdmin() as unknown as RpcClient).rpc(
    'release_generation_lock',
    { p_key: key },
  )
  if (error) {
    console.error('[generation-lock] release failed:', error.message)
  }
}
