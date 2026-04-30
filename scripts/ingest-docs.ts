/**
 * Batch ingest script for training documents.
 *
 * Usage:
 *   npx tsx scripts/ingest-docs.ts
 *
 * Reads docs/ and docs/training-guides/, embeds them with Google Gemini,
 * and stores chunks in Supabase.
 *
 * Requires .env.local with:
 *   GOOGLE_AI_API_KEY
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { config } from 'dotenv'
// Next.js projects use .env.local — load it explicitly
config({ path: '.env.local' })
import * as fs from 'fs'
import * as path from 'path'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@supabase/supabase-js'
import { PDFParse } from 'pdf-parse'
import type { BreedOrGeneral } from '../src/types'

const CHUNK_SIZE = 2000
const CHUNK_OVERLAP = 200
const BATCH_DELAY_MS = 1200   // 1.2s between calls → ~50 RPM (Google free tier limit)
const MAX_RETRIES = 5

interface DocSpec {
  file: string
  breed: BreedOrGeneral
  sourceUrl?: string
  docVersion?: string
}

// ─── Configure which documents to ingest ─────────────────────────────────────
const DOCS: DocSpec[] = [
  // Swedish SKK puppy guide — applies to all breeds
  {
    file: 'docs/valkommen-valp-m54.pdf',
    breed: 'general',
    sourceUrl: 'https://www.skk.se',
    docVersion: 'M54',
  },
  // SKK BPH behavior description — general
  {
    file: 'docs/bph_informationsbroschyr_a36-komprimerad.pdf',
    breed: 'general',
    sourceUrl: 'https://www.skk.se',
    docVersion: 'A36',
  },
  // Dr. Ian Dunbar — Before You Get Your Puppy
  {
    file: 'docs/training-guides/dunbar-before-puppy.pdf',
    breed: 'general',
    sourceUrl: 'https://dunbaracademy.com',
    docVersion: '2024',
  },
  // Dr. Ian Dunbar — After You Get Your Puppy
  {
    file: 'docs/training-guides/dunbar-after-puppy.pdf',
    breed: 'general',
    sourceUrl: 'https://dunbaracademy.com',
    docVersion: '2024',
  },
  // Toronto Humane Society Puppy Training Manual
  {
    file: 'docs/training-guides/toronto-puppy-training-manual.pdf',
    breed: 'general',
    sourceUrl: 'https://www.torontohumanesociety.com',
    docVersion: '2023',
  },
  // Note: dog-training-101.pdf (18 MB ≈ 9000 chunks) is intentionally excluded
  // — too large for the free embedding tier. Add if you upgrade the API plan.
  // Braque Français — FCI standard (French)
  {
    file: 'docs/134g07-fr.pdf',
    breed: 'braque_francais',
    sourceUrl: 'https://www.fci.be',
    docVersion: 'FCI-134 2023',
  },
  // Braque Français — Swedish SKK standard
  {
    file: 'docs/rasstandard-braque-francais-type-pyrenees-fci-134.pdf',
    breed: 'braque_francais',
    sourceUrl: 'https://www.skk.se',
    docVersion: 'SKK 2009',
  },
  // Braque Français — UKC standard (English)
  {
    file: 'docs/braque-francais-de-petite-taille.pdf',
    breed: 'braque_francais',
    sourceUrl: 'https://www.ukcdogs.com',
    docVersion: 'UKC 2006',
  },
  // Italian Greyhound — AKC/IGCA guide
  {
    file: 'docs/training-guides/akc-italian-greyhound.pdf',
    breed: 'italian_greyhound',
    sourceUrl: 'https://www.akc.org',
    docVersion: '2019',
  },
  // NAVHDA Versatile Hunting Dog — general pointing dog methodology
  // Relevant for Braque Français, but also general gun dog content
  {
    file: 'docs/training-guides/navhda-versatile-hunting-dog.pdf',
    breed: 'braque_francais',
    sourceUrl: 'https://www.navhda.org',
    docVersion: '2022',
  },
  // Miniature American Shepherd — AKC official breed standard
  {
    file: 'docs/mas-akc-breed-standard.pdf',
    breed: 'miniature_american_shepherd',
    sourceUrl: 'https://images.akc.org/pdf/breeds/standards/MiniatureAmericanShepherd.pdf',
    docVersion: 'AKC 2015',
  },
  // Miniature American Shepherd — FCI standard nr 367 (English)
  {
    file: 'docs/mas-fci-367-en.pdf',
    breed: 'miniature_american_shepherd',
    sourceUrl: 'https://www.fci.be/Nomenclature/Standards/367g01-en.pdf',
    docVersion: 'FCI-367 2023',
  },
  // Miniature American Shepherd — UKC breed standard
  {
    file: 'docs/mas-ukc-breed-standard.pdf',
    breed: 'miniature_american_shepherd',
    sourceUrl: 'https://www.ukcdogs.com/docs/breeds/miniature-american-shepherd.pdf',
    docVersion: 'UKC 2024',
  },
  // Miniature American Shepherd — MASCUSA breed standard seminar (rasstandard med bildmaterial)
  {
    file: 'docs/mas-mascusa-breed-standard-seminar.pdf',
    breed: 'miniature_american_shepherd',
    sourceUrl: 'https://mascusa.org/wp-content/uploads/docs/bsee/breed-standard-seminar.pdf',
    docVersion: 'MASCUSA 2026',
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function chunkText(text: string): string[] {
  const chunks: string[] = []
  let start = 0
  while (start < text.length) {
    const end = Math.min(start + CHUNK_SIZE, text.length)
    const chunk = text.slice(start, end).trim()
    if (chunk.length > 80) chunks.push(chunk)
    start += CHUNK_SIZE - CHUNK_OVERLAP
  }
  return chunks
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

async function embedWithRetry(
  embedModel: ReturnType<InstanceType<typeof GoogleGenerativeAI>['getGenerativeModel']>,
  text: string
): Promise<number[]> {
  let lastError: unknown
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const result = await embedModel.embedContent(text)
      return result.embedding.values
    } catch (err) {
      lastError = err
      const isRateLimit =
        String(err).includes('429') || String(err).includes('Too Many Requests')
      if (!isRateLimit) throw err
      const waitMs = Math.pow(2, attempt) * 5000  // 5s, 10s, 20s, 40s, 80s
      console.warn(`\n  ⏳ Rate limited — retrying in ${waitMs / 1000}s (attempt ${attempt + 1}/${MAX_RETRIES})`)
      await sleep(waitMs)
    }
  }
  throw lastError
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const googleKey = process.env.GOOGLE_AI_API_KEY

  if (!supabaseUrl || !supabaseKey || !googleKey) {
    console.error('❌ Missing env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GOOGLE_AI_API_KEY')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey)
  const genAI = new GoogleGenerativeAI(googleKey)
  const embedModel = genAI.getGenerativeModel({ model: 'gemini-embedding-001' })

  // --resume: skip files already present in the database
  const resumeMode = process.argv.includes('--resume')
  let alreadyIngested = new Set<string>()
  if (resumeMode) {
    const { data } = await supabase
      .from('breed_chunks')
      .select('source')
    alreadyIngested = new Set((data ?? []).map((r: { source: string }) => r.source))
    console.log(`Resume mode: ${alreadyIngested.size > 0 ? [...alreadyIngested].join(', ') : 'nothing ingested yet'}`)
  }

  let totalInserted = 0

  for (const doc of DOCS) {
    const filePath = path.resolve(doc.file)
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️  Skipping missing file: ${doc.file}`)
      continue
    }

    const basename = path.basename(doc.file)
    if (resumeMode && alreadyIngested.has(basename)) {
      console.log(`\n⏭️  Skipping already ingested: ${basename}`)
      continue
    }

    console.log(`\n📄 Ingesting: ${doc.file} (breed: ${doc.breed})`)

    const buffer = fs.readFileSync(filePath)
    let text: string
    try {
      const parser = new PDFParse({ data: new Uint8Array(buffer) })
      const parsed = await parser.getText()
      text = parsed.text ?? ''
    } catch (err) {
      console.error(`  ❌ PDF parse failed: ${err}`)
      continue
    }

    const chunks = chunkText(text)
    console.log(`  → ${chunks.length} chunks`)

    for (let i = 0; i < chunks.length; i++) {
      const content = chunks[i]
      try {
        const embedding = await embedWithRetry(embedModel, content)

        const { error } = await supabase.from('breed_chunks').insert({
          breed: doc.breed,
          source: path.basename(doc.file),
          source_url: doc.sourceUrl ?? '',
          doc_version: doc.docVersion ?? '',
          page_ref: '',
          content,
          embedding,
        })

        if (error) {
          console.error(`  ❌ Insert error chunk ${i}: ${error.message}`)
        } else {
          process.stdout.write('.')
          totalInserted++
        }
      } catch (err) {
        console.error(`  ❌ Embed error chunk ${i}: ${err}`)
      }

      // Rate-limit: Gemini free tier ~1500 req/min
      await sleep(BATCH_DELAY_MS)
    }

    console.log(` ✅`)
  }

  console.log(`\n✅ Done — inserted ${totalInserted} chunks total.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
