// scripts/ingest-breed-profiles.ts
/**
 * Ingest BreedProfiles from breed-profiles.ts as RAG chunks into breed_chunks.
 *
 * Usage:
 *   npx tsx scripts/ingest-breed-profiles.ts [--breed labrador] [--dry-run]
 *
 * Requires .env.local:
 *   GOOGLE_AI_API_KEY
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@supabase/supabase-js'
import { BREED_PROFILES } from '../src/lib/ai/breed-profiles'

const BATCH_DELAY_MS = 1200
const DRY_RUN = process.argv.includes('--dry-run')
const ONLY_BREED = process.argv.includes('--breed')
  ? process.argv[process.argv.indexOf('--breed') + 1]
  : null

function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing env: ${name}`)
  return v
}

const genAI = new GoogleGenerativeAI(requireEnv('GOOGLE_AI_API_KEY'))
const embedModel = genAI.getGenerativeModel({ model: 'gemini-embedding-001' })
const supabase = createClient(requireEnv('SUPABASE_URL'), requireEnv('SUPABASE_SERVICE_ROLE_KEY'))

async function embedText(text: string): Promise<number[]> {
  const result = await embedModel.embedContent(text)
  return result.embedding.values
}

function chunksFromProfile(slug: string): { content: string; section: string }[] {
  const p = BREED_PROFILES[slug]
  if (!p) return []

  const chunks: { content: string; section: string }[] = []

  chunks.push({
    section: 'overview',
    content: `RAS: ${p.name}\nÄndamål: ${p.purpose}\nKänslighet: ${p.sensitivity}`,
  })

  chunks.push({
    section: 'temperament',
    content: `RAS: ${p.name} — Temperament & träningsprofil\n${p.temperament.map((t) => `• ${t}`).join('\n')}\n\nVarningar:\n${p.trainingCautions.map((c) => `• ${c}`).join('\n')}`,
  })

  if (p.breedSkills.length > 0) {
    chunks.push({
      section: 'breed_skills',
      content: `RAS: ${p.name} — Rasspecifika färdigheter\n${p.breedSkills.map((s) => `• ${s.name}: ${s.description}`).join('\n')}`,
    })
  }

  chunks.push({
    section: 'activity_guidelines',
    content: `RAS: ${p.name} — Aktivitetsriktlinjer\nValp (8–16v): ${p.activityGuidelines.puppy}\nJunior (4–9mån): ${p.activityGuidelines.junior}\nUngdjur (9–18mån): ${p.activityGuidelines.adolescent}`,
  })

  return chunks
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

async function ingestBreed(slug: string) {
  const chunks = chunksFromProfile(slug)
  if (chunks.length === 0) {
    console.log(`  ⚠️  No profile for ${slug} — skipping`)
    return
  }
  console.log(`  → ${slug}: ${chunks.length} chunks`)

  if (!DRY_RUN) {
    // Delete existing profile chunks so re-runs are safe
    await supabase.from('breed_chunks')
      .delete()
      .eq('breed', slug)
      .like('source', `breed-profile:${slug}:%`)
  }

  for (const { content, section } of chunks) {
    if (DRY_RUN) {
      console.log(`    [dry-run] ${section}: ${content.slice(0, 60)}…`)
      continue
    }

    const embedding = await embedText(content)
    const { error } = await supabase.from('breed_chunks').insert({
      breed: slug,
      source: `breed-profile:${slug}:${section}`,
      source_url: '',
      doc_version: '1.0',
      page_ref: section,
      content,
      embedding: embedding as unknown as string,
    })

    if (error) throw new Error(`Insert failed for ${slug}/${section}: ${error.message}`)
    await sleep(BATCH_DELAY_MS)
  }
}

async function main() {
  const slugs = ONLY_BREED ? [ONLY_BREED] : Object.keys(BREED_PROFILES)
  console.log(`Ingesting ${slugs.length} breed profiles${DRY_RUN ? ' (dry-run)' : ''}…`)

  for (const slug of slugs) {
    await ingestBreed(slug)
  }

  console.log('Done.')
}

main().catch((e) => { console.error(e); process.exit(1) })
