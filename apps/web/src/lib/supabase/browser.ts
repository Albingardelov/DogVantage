import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

let _client: SupabaseClient<Database> | null = null

/**
 * Browser-only Supabase client. Lazy so importing this module during `next build`
 * does not require env vars until the client is actually used in the browser.
 */
export function getSupabaseBrowser(): SupabaseClient<Database> {
  if (_client) return _client
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    throw new Error(
      'Supabase env missing: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
    )
  }
  _client = createBrowserClient<Database>(url, key)
  return _client
}
