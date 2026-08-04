import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'

const SOURCE_PAGE_URL =
  'https://skk.se/skk-funktionar/utstallning/exteriordomare/rasstandarder'

const DRY_RUN = process.argv.includes('--dry-run')

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing env: ${name}`)
  return value
}

async function main() {
  const supabase = createClient(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
  )

  const { count, error: countError } = await supabase
    .from('breed_chunks')
    .select('id', { count: 'exact', head: true })
    .eq('source_url', SOURCE_PAGE_URL)

  if (countError) throw new Error(`Count failed: ${countError.message}`)
  const total = count ?? 0

  if (DRY_RUN) {
    console.log(`Would delete ${total} rows from breed_chunks.`)
    return
  }

  const { error: deleteError } = await supabase
    .from('breed_chunks')
    .delete()
    .eq('source_url', SOURCE_PAGE_URL)

  if (deleteError) throw new Error(`Delete failed: ${deleteError.message}`)
  console.log(`Deleted ${total} rows from breed_chunks.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
