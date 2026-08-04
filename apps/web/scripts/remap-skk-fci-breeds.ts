import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'
import { canonicalBreedFromFci } from './skk-canonical-map'

const SOURCE_PAGE_URL =
  'https://skk.se/skk-funktionar/utstallning/exteriordomare/rasstandarder'

const DRY_RUN = process.argv.includes('--dry-run')

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing env: ${name}`)
  return value
}

function parseFciFromFallbackBreed(breed: string): number | null {
  const match = breed.match(/^skk_fci_(\d{1,3})$/)
  if (!match) return null
  const value = Number(match[1])
  if (!Number.isFinite(value) || value < 1 || value > 400) return null
  return value
}

async function main() {
  const supabase = createClient(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
  )

  const { data, error } = await supabase
    .from('breed_chunks')
    .select('breed')
    .eq('source_url', SOURCE_PAGE_URL)
    .like('breed', 'skk_fci_%')

  if (error) throw new Error(`Read failed: ${error.message}`)

  const distinctFallbacks = new Set((data ?? []).map((row) => row.breed))
  const updates: Array<{ from: string; to: string }> = []

  for (const fallback of distinctFallbacks) {
    const fci = parseFciFromFallbackBreed(fallback)
    if (!fci) continue
    const canonical = canonicalBreedFromFci(fci)
    if (!canonical) continue
    updates.push({ from: fallback, to: canonical })
  }

  if (updates.length === 0) {
    console.log('No remaps available.')
    return
  }

  console.log(`Found ${updates.length} remap candidates.`)
  for (const update of updates.slice(0, 20)) {
    console.log(`- ${update.from} -> ${update.to}`)
  }
  if (updates.length > 20) {
    console.log(`... and ${updates.length - 20} more`)
  }

  if (DRY_RUN) return

  let touched = 0
  for (const update of updates) {
    const { count, error: countError } = await supabase
      .from('breed_chunks')
      .select('id', { count: 'exact', head: true })
      .eq('source_url', SOURCE_PAGE_URL)
      .eq('breed', update.from)

    if (countError) {
      throw new Error(`Count failed for ${update.from}: ${countError.message}`)
    }

    const { error: updateError } = await supabase
      .from('breed_chunks')
      .update({ breed: update.to })
      .eq('source_url', SOURCE_PAGE_URL)
      .eq('breed', update.from)

    if (updateError) {
      throw new Error(`Update failed for ${update.from}: ${updateError.message}`)
    }
    touched += count ?? 0
  }

  console.log(`Remap complete. Updated ${touched} rows.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
