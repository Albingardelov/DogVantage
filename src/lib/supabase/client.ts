import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

let _supabaseAdmin: SupabaseClient<Database> | null = null

function requireEnv(name: string, value: string | undefined): string {
  if (value && value.length > 0) return value
  throw new Error(`${name} is required.`)
}

export function getSupabaseAdmin(): SupabaseClient<Database> {
  if (_supabaseAdmin) return _supabaseAdmin
  const url = requireEnv('supabaseUrl', process.env.NEXT_PUBLIC_SUPABASE_URL)
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const anonKey = requireEnv('supabaseAnonKey', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  _supabaseAdmin = createClient<Database>(url, serviceKey ?? anonKey)
  return _supabaseAdmin
}
