import { config } from 'dotenv'
config({ path: '.env.local' })

import { writeFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

const SOURCE_PAGE_URL =
  'https://skk.se/skk-funktionar/utstallning/exteriordomare/rasstandarder'

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing env: ${name}`)
  return value
}

function toTitleCase(value: string): string {
  return value
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function parseDisplayNameFromSource(source: string): string {
  const base = source.replace(/\.pdf$/i, '')
  const normalized = base.normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
  const withoutPrefix = normalized
    .replace(/^rasstandard[-_ ]?/i, '')
    .replace(/^standard[-_ ]?/i, '')
  const withoutFci = withoutPrefix
    .replace(/[-_ ]?fci[-_ ]?\d{1,3}[a-z0-9-_\s]*$/i, '')
    .replace(/[-_ ]?skk\d+[a-z0-9-_\s]*$/i, '')
  const cleaned = withoutFci
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return cleaned ? toTitleCase(cleaned) : ''
}

function fallbackNameFromSlug(slug: string): string {
  const fciMatch = slug.match(/^skk_fci_(\d{1,3})$/)
  if (fciMatch) return `SKK FCI ${fciMatch[1]}`
  return toTitleCase(slug.replace(/^skk_/, '').replace(/_/g, ' '))
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
    .like('breed', 'skk_%')

  if (countError) throw new Error(`Count failed: ${countError.message}`)
  const total = count ?? 0

  const rows: Array<{ breed: string; source: string }> = []
  for (let from = 0; from < total; from += 1000) {
    const to = from + 999
    const { data, error } = await supabase
      .from('breed_chunks')
      .select('breed, source')
      .eq('source_url', SOURCE_PAGE_URL)
      .like('breed', 'skk_%')
      .range(from, to)

    if (error) throw new Error(`Fetch failed: ${error.message}`)
    rows.push(...((data ?? []) as Array<{ breed: string; source: string }>))
  }

  const sourceByBreed = new Map<string, string>()
  for (const row of rows) {
    const existing = sourceByBreed.get(row.breed)
    if (!existing || row.source.localeCompare(existing) < 0) {
      sourceByBreed.set(row.breed, row.source)
    }
  }

  const slugs = [...sourceByBreed.keys()].sort((a, b) => a.localeCompare(b))
  const entries = slugs.map((slug) => {
    const source = sourceByBreed.get(slug) ?? ''
    const parsedName = source ? parseDisplayNameFromSource(source) : ''
    const displayName = parsedName || fallbackNameFromSlug(slug)
    return {
      slug,
      nameSv: displayName,
      nameEn: displayName,
    }
  })

  const output = `export interface SupplementalBreedOption {
  slug: string
  nameSv: string
  nameEn: string
}

export const SKK_SUPPLEMENTAL_BREEDS: SupplementalBreedOption[] = ${JSON.stringify(entries, null, 2)} as const
`

  writeFileSync('src/lib/breeds/supplemental.generated.ts', output, 'utf8')
  console.log(`Generated ${entries.length} supplemental SKK breed options.`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
