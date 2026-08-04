/**
 * Ingests free, officially published behaviour & welfare documents that fill the
 * knowledge-base gaps: loose-leash walking, cooperative care / muzzle handling,
 * resource guarding, noise & storm phobia, separation anxiety, adolescent dogs,
 * body language / stress signals, enrichment, senior / cognitive decline and a
 * beginner nose work intro.
 *
 * All tagged breed = 'general' so the content surfaces for every breed in chat;
 * per-chunk topic/life_stage/difficulty is assigned automatically at ingest.
 *
 * Sources are free, citable publications (SPCA/humane societies, RSPCA, ASPCA,
 * Dogs Trust, veterinary clinics) — same credibility level as the existing set.
 *
 * Usage: npx tsx scripts/ingest-behavior-welfare-docs.ts
 */
import { config } from 'dotenv'
config({ path: '.env.local' })

import { readFileSync } from 'fs'
import { join } from 'path'
import { ingestPDF } from '../src/lib/ai/ingest'

const FILES: Array<{
  path: string
  breed: import('../src/types').Breed
  sourceUrl: string
  docVersion: string
}> = [
  // ── Topic holes: loose-leash, cooperative care / handling, nose work ──
  {
    path: 'docs/louisianaspca-loose-leash-walking.pdf',
    breed: 'general',
    sourceUrl: 'https://www.louisianaspca.org/wp-content/uploads/2020/09/Loose-Leash-Walking.pdf',
    docVersion: '2020',
  },
  {
    path: 'docs/edmonton-humane-muzzle-cooperative-care.pdf',
    breed: 'general',
    sourceUrl: 'https://www.edmontonhumanesociety.com/wp-content/uploads/2024/05/2023-Muzzle-Use-Training-EHS-Resources.pdf',
    docVersion: '2023',
  },
  {
    path: 'docs/spca-teaching-dog-wear-muzzle.pdf',
    breed: 'general',
    sourceUrl: 'https://spca.org/wp-content/uploads/2023/12/Teaching-a-dog-to-wear-a-muzzle.pdf',
    docVersion: '2023',
  },
  {
    path: 'docs/berkeleyhumane-scentwork-intro.pdf',
    breed: 'general',
    sourceUrl: 'https://berkeleyhumane.org/wp-content/uploads/2021/05/Scentwork-1-E-Book-Combo-1.pdf',
    docVersion: '2021',
  },

  // ── Behaviour problems (general — relevant to all breeds) ──
  {
    path: 'docs/sfspca-food-resource-guarding.pdf',
    breed: 'general',
    sourceUrl: 'https://www.sfspca.org/wp-content/uploads/2023/02/dog_behavior_food-and-resource-guarding.pdf',
    docVersion: '2023',
  },
  {
    path: 'docs/rspca-sa-noise-storm-phobia.pdf',
    breed: 'general',
    sourceUrl: 'https://www.rspcasa.org.au/wp-content/uploads/2020/11/RSPCA-SA-Customer-Advice-Noise-and-Storm-Phobia.pdf',
    docVersion: '2020',
  },
  {
    path: 'docs/aspca-preventing-separation-anxiety.pdf',
    breed: 'general',
    sourceUrl: 'https://aspcapro.org/sites/default/files/behavior-2020-preventing-anxiety.pdf',
    docVersion: '2020',
  },
  {
    path: 'docs/aspca-treating-separation-anxiety.pdf',
    breed: 'general',
    sourceUrl: 'https://aspcapro.org/sites/default/files/behavior-2020-treating-anxiety.pdf',
    docVersion: '2020',
  },

  // ── Adolescent life stage ──
  {
    path: 'docs/dogstrust-teenage-trouble-adolescent.pdf',
    breed: 'general',
    sourceUrl: 'https://assets.ctfassets.net/2t8dhn7s97w9/39h5qX6CVhhevVfprxThAh/f5f6fde8b98af4a9a70ce3c09f1db4e4/Teenage_Trouble-_Bonding_with_Your_Adolescent_Dog.pdf',
    docVersion: '2023',
  },

  // ── Quality of life: body language, enrichment, senior / cognition ──
  {
    path: 'docs/reading-body-language-in-pets.pdf',
    breed: 'general',
    sourceUrl: 'https://creeksidepetvet.com/wp-content/uploads/2022/04/Reading-Body-Language-in-Pets.pdf',
    docVersion: '2022',
  },
  {
    path: 'docs/eastbayspca-canine-enrichment.pdf',
    breed: 'general',
    sourceUrl: 'https://eastbayspca.org/wp-content/uploads/2024/05/Canine-Enrichment-Handout.pdf',
    docVersion: '2024',
  },
  {
    path: 'docs/southfields-canine-cognitive-dysfunction.pdf',
    breed: 'general',
    sourceUrl: 'https://southfields.co.uk/wp-content/uploads/2024/05/S-017-Canine_cognitive_dysfunction_fact_sheet.pdf',
    docVersion: '2024',
  },
]

async function main() {
  let total = 0
  for (const file of FILES) {
    const fullPath = join(process.cwd(), file.path)
    console.log(`\nIngesting: ${file.path} (${file.breed})`)
    const buffer = readFileSync(fullPath)
    const { chunksInserted } = await ingestPDF(buffer, {
      breed: file.breed,
      filename: file.path.split('/').pop()!,
      sourceUrl: file.sourceUrl,
      docVersion: file.docVersion,
    })
    console.log(`  ${chunksInserted} chunks inserted`)
    total += chunksInserted
  }
  console.log(`\nDone! Total chunks inserted: ${total}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
