/**
 * Local ingestion script — runs directly against Supabase without going via the API route.
 * Usage: npx tsx scripts/ingest-local.ts
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
    path: 'docs/rasstandard-braque-francais-type-pyrenees-fci-134.pdf',
    breed: 'braque_francais',
    sourceUrl: 'https://www.skk.se/contentassets/d622812e31cc48359e33006304392719/rasstandard-braque-francais-type-pyrenees-fci-134.pdf',
    docVersion: '2023',
  },
  {
    path: 'docs/134g07-fr.pdf',
    breed: 'braque_francais',
    sourceUrl: 'https://www.fci.be/Nomenclature/Standards/134g07-fr.pdf',
    docVersion: '2023',
  },
  {
    path: 'docs/braque-francais-de-petite-taille.pdf',
    breed: 'braque_francais',
    sourceUrl: 'https://www.ukcdogs.com/docs/breeds/braque-francais-de-petite-taille.pdf',
    docVersion: '2024',
  },
  {
    path: 'docs/134g07-PRE-en.pdf',
    breed: 'braque_francais',
    sourceUrl: 'https://www.fci.be/Nomenclature/Education/134g07-PRE-en.pdf',
    docVersion: '2023',
  },
  // Labrador Retriever
  {
    path: 'docs/rasstandard-labrador-retriever-fci-122.pdf',
    breed: 'labrador',
    sourceUrl: 'https://www.skk.se/contentassets/215ded01c7884b748cc03a4065deaa3c/rasstandard-labrador-retriever-fci-122.pdf',
    docVersion: '2023',
  },
  {
    path: 'docs/ras-labrador-retriever-skk.pdf',
    breed: 'labrador',
    sourceUrl: 'https://www.skk.se/contentassets/215ded01c7884b748cc03a4065deaa3c/ras-labrador-retriever.pdf',
    docVersion: '2024',
  },
  {
    path: 'docs/domarkompendium-labrador-retriever-skk.pdf',
    breed: 'labrador',
    sourceUrl: 'https://www.skk.se/contentassets/215ded01c7884b748cc03a4065deaa3c/domarkompendium-labrador-retriever.pdf',
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
    console.log(`  ✓ ${chunksInserted} chunks inserted`)
    total += chunksInserted
  }
  console.log(`\nDone! Total chunks inserted: ${total}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
