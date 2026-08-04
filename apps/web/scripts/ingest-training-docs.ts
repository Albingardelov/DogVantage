/**
 * Ingests free, officially published training-method documents (apportering,
 * jakt/fältarbete, vallning) — runs directly against Supabase like ingest-local.ts.
 * Usage: npx tsx scripts/ingest-training-docs.ts
 */
import 'dotenv/config'
import { readFileSync } from 'fs'
import { join } from 'path'
import { ingestPDF } from '../src/lib/ai/ingest'

const FILES: Array<{
  path: string
  breed: import('@dogvantage/core').Breed
  sourceUrl: string
  docVersion: string
}> = [
  // Apportering / dummyträning
  {
    path: 'docs/anvisningar-working-test-retriever-2024.pdf',
    breed: 'general',
    sourceUrl: 'https://ssrk.se/wp-content/uploads/2023/03/anvisningar-working-test-retriever-2024.pdf',
    docVersion: '2024',
  },
  // Jakt / stående fågelhund
  {
    path: 'docs/navhda-vhd-training-issue-2022.pdf',
    breed: 'braque_francais',
    sourceUrl: 'https://www.navhda.org/wp-content/uploads/2022/05/VHDTrainingIssue22WEB.pdf',
    docVersion: '2022',
  },
  {
    path: 'docs/navhda-rules-book-2024.pdf',
    breed: 'braque_francais',
    sourceUrl: 'https://www.navhda.org/wp-content/uploads/2018/11/RulesBook_rev_2024_0313.pdf',
    docVersion: '2024',
  },
  {
    path: 'docs/navhda-gun-dog-test-aims-rules.pdf',
    breed: 'braque_francais',
    sourceUrl: 'https://www.navhda.org/wp-content/uploads/2025/02/Gun-Dog-Test-Aims-Rules.pdf',
    docVersion: '2025',
  },
  {
    path: 'docs/navhda-utility-training-intro-whalen.pdf',
    breed: 'braque_francais',
    sourceUrl: 'https://mnnavhda.org/wp-content/uploads/2019/10/Utility-Training-Intro-by-Mark-Whalen.pdf',
    docVersion: '2018',
  },
  {
    path: 'docs/fa-jaktprovsregler-2017.pdf',
    breed: 'general',
    sourceUrl: 'https://fa-avance.se/wp-content/uploads/2020/12/jaktprovsregler_2017_A4.pdf',
    docVersion: '2017',
  },
  // Vallning
  {
    path: 'docs/svak-regelbok-vallhundsprov.pdf',
    breed: 'general',
    sourceUrl: 'https://www.vallhundsringen.se/ws/media-library/3b40e32999214b8bbc7f7808a240531a/svak-regelbok2017-2021.pdf',
    docVersion: '2017',
  },
  {
    path: 'docs/svak-tavlingsanvisningar-2024-2025.pdf',
    breed: 'general',
    sourceUrl: 'https://www.vallhundsringen.se/ws/media-library/ac39fc30e95a4ef3bab4e699d2011d1e/tavlingsanvisningar-2024-2025.pdf',
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
