/**
 * Ingests free official documents for nose work, viltspår and retriever
 * function description (FB-R) — fills the scent/tracking/retrieve methodology gaps.
 * Usage: npx tsx scripts/ingest-scentwork-docs.ts
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
  {
    path: 'docs/snwk-regelverk-nosework-2022.pdf',
    breed: 'general',
    sourceUrl: 'https://brukshundklubben.se/media/tcjh5y1t/snwk-slutligt-regelverk-nosework-2022_rev2-docx.pdf',
    docVersion: '2022',
  },
  {
    path: 'docs/skk-regler-viltsparprov-t36.pdf',
    breed: 'general',
    sourceUrl: 'https://www.skk.se/globalassets/globala-filer/regler/regler-for-viltsparprov-t36.pdf',
    docVersion: '2022',
  },
  {
    path: 'docs/ssrk-fbr-anvisningar-2023.pdf',
    breed: 'general',
    sourceUrl: 'https://ssrk.se/wp-content/uploads/2019/11/fb-r-anvisningar-2023.pdf',
    docVersion: '2023',
  },
  {
    path: 'docs/ssrk-vad-ar-fbr.pdf',
    breed: 'general',
    sourceUrl: 'https://ssrk.se/wp-content/uploads/2020/01/vad_ar_fb-r.pdf',
    docVersion: '2020',
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
