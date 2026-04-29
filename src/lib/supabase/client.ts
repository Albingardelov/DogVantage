import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// We don't ship a generated Supabase Database type yet; use `any` to avoid `never` tables.
let _supabase: SupabaseClient<any> | null = null
let _supabaseAdmin: SupabaseClient<any> | null = null

function requireEnv(name: string, value: string | undefined): string {
  if (value && value.length > 0) return value
  throw new Error(`${name} is required.`)
}

export function getSupabase() {
  if (_supabase) return _supabase
  const url = requireEnv('supabaseUrl', process.env.NEXT_PUBLIC_SUPABASE_URL)
  const anonKey = requireEnv('supabaseAnonKey', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  _supabase = createClient<any>(url, anonKey)
  return _supabase
}

// Server-side only — never expose service key to client
export function getSupabaseAdmin() {
  if (_supabaseAdmin) return _supabaseAdmin
  const url = requireEnv('supabaseUrl', process.env.NEXT_PUBLIC_SUPABASE_URL)
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  _supabaseAdmin = serviceKey ? createClient<any>(url, serviceKey) : getSupabase()
  return _supabaseAdmin
}
