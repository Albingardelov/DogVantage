import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let _supabaseAdmin: SupabaseClient<any> | null = null

function requireEnv(name: string, value: string | undefined): string {
  if (value && value.length > 0) return value
  throw new Error(`${name} is required.`)
}

export function getSupabaseAdmin() {
  if (_supabaseAdmin) return _supabaseAdmin
  const url = requireEnv('supabaseUrl', process.env.NEXT_PUBLIC_SUPABASE_URL)
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const anonKey = requireEnv('supabaseAnonKey', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  _supabaseAdmin = createClient<any>(url, serviceKey ?? anonKey)
  return _supabaseAdmin
}
