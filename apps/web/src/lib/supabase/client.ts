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
  // Fail fast instead of silently falling back to the anon key — an "admin"
  // client with anon permissions makes RPCs and admin queries fail quietly.
  const serviceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SERVICE_ROLE_KEY)
  _supabaseAdmin = createClient<Database>(url, serviceKey)
  return _supabaseAdmin
}
