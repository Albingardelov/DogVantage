/**
 * Ingests free, officially published breed-agnostic training methodology
 * (manners, recall, leash, handling, fear) — complements ingest-training-docs.ts.
 * Usage: npx tsx scripts/ingest-general-methodology.ts
 */
import 'dotenv/config'
import { readFileSync } from 'fs'
import { join } from 'path'
import { ingestPDF } from '../src/lib/ai/ingest'

const FILES: Array<{
  path: string
  breed: import('../src/types').Breed
  sourceUrl: string
  docVersion: string
}> = [
  {
    path: 'docs/akc-cgc-10-essential-skills.pdf',
    breed: 'general',
    sourceUrl: 'http://images.akc.org/pdf/ebook/CGC2.pdf',
    docVersion: '2020',
  },
  {
    path: 'docs/akc-cgc-participants-handbook.pdf',
    breed: 'general',
    sourceUrl: 'https://images.akc.org/pdf/cgc/GK9GC2.pdf',
    docVersion: '2020',
  },
  {
    path: 'docs/akc-urban-cgc-brochure.pdf',
    breed: 'general',
    sourceUrl: 'https://images.akc.org/pdf/cgc/urban_cgc_brochure.pdf',
    docVersion: '2020',
  },
  {
    path: 'docs/ddfl-fearful-dog.pdf',
    breed: 'general',
    sourceUrl: 'https://upaws.org/wp-content/uploads/2014/12/fearful-dog_0.pdf',
    docVersion: '2014',
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
