import { config } from 'dotenv'
config({ path: '.env.local' })

import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import { basename, extname, join } from 'path'
import { spawnSync } from 'child_process'
import { ingestPDF } from '../src/lib/ai/ingest'
import type { Breed } from '../src/types'
import { canonicalBreedFromFci } from './skk-canonical-map'

const SKK_ZIP_URLS: string[] = [
  'https://skk.se/globalassets/media---funktionar/utstallning---funktionar/rasstandarder-gruppvis-zip-filer/rasstandarder-grupp-1.zip',
  'https://skk.se/globalassets/media---funktionar/utstallning---funktionar/rasstandarder-gruppvis-zip-filer/rasstandarder-grupp-2.zip',
  'https://skk.se/globalassets/media---funktionar/utstallning---funktionar/rasstandarder-gruppvis-zip-filer/rasstandarder-grupp-3.zip',
  'https://skk.se/globalassets/media---funktionar/utstallning---funktionar/rasstandarder-gruppvis-zip-filer/rasstandarder-grupp-4.zip',
  'https://skk.se/globalassets/media---funktionar/utstallning---funktionar/rasstandarder-gruppvis-zip-filer/rasstandarder-grupp-5.zip',
  'https://skk.se/globalassets/media---funktionar/utstallning---funktionar/rasstandarder-gruppvis-zip-filer/rasstandarder-grupp-6.zip',
  'https://skk.se/globalassets/media---funktionar/utstallning---funktionar/rasstandarder-gruppvis-zip-filer/rasstandarder-grupp-7.zip',
  'https://skk.se/globalassets/media---funktionar/utstallning---funktionar/rasstandarder-gruppvis-zip-filer/rasstandarder-grupp-8.zip',
  'https://skk.se/globalassets/media---funktionar/utstallning---funktionar/rasstandarder-gruppvis-zip-filer/rasstandarder-grupp-9.zip',
  'https://skk.se/globalassets/media---funktionar/utstallning---funktionar/rasstandarder-gruppvis-zip-filer/rasstandarder-grupp-10.zip',
]

const SOURCE_PAGE_URL =
  'https://skk.se/skk-funktionar/utstallning/exteriordomare/rasstandarder'

const DRY_RUN = process.argv.includes('--dry-run')
const DOWNLOAD_ONLY = process.argv.includes('--download-only')
const KEEP_TMP = process.argv.includes('--keep-tmp')
const MAX_FILES = (() => {
  const idx = process.argv.indexOf('--max-files')
  if (idx === -1) return null
  const raw = Number(process.argv[idx + 1])
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : null
})()

function runCommand(command: string, args: string[]) {
  const result = spawnSync(command, args, { stdio: 'inherit' })
  if (result.status !== 0) {
    throw new Error(`${command} failed with exit code ${result.status ?? 'unknown'}`)
  }
}

function extractFciNumber(filename: string): number | null {
  // Strict mode: only accept explicit FCI markers in filename.
  // This prevents accidental matches like "skk10", "skk14", etc.
  const lower = filename.toLowerCase()
  const fciMatch = lower.match(/(?:^|[^a-z0-9])fci[-_ ]?0*(\d{1,3})(?:[^0-9]|$)/)
  if (!fciMatch) return null
  const value = Number(fciMatch[1])
  if (!Number.isFinite(value) || value < 1 || value > 400) return null
  return value
}

function normalizeText(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function fallbackBreedSlug(filename: string, fciNumber: number | null): Breed {
  if (fciNumber) return `skk_fci_${fciNumber}`
  const base = basename(filename, extname(filename))
  const normalized = normalizeText(base)
  const slug = normalized.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
  return (`skk_${slug || 'unknown'}`) as Breed
}

function listPdfFilesRecursive(dir: string): string[] {
  const out: string[] = []
  const stack = [dir]

  while (stack.length > 0) {
    const current = stack.pop()
    if (!current) continue
    const entries = readdirSync(current, { withFileTypes: true })
    for (const entry of entries) {
      const full = join(current, entry.name)
      if (entry.isDirectory()) {
        stack.push(full)
      } else if (entry.isFile() && extname(entry.name).toLowerCase() === '.pdf') {
        out.push(full)
      }
    }
  }

  return out
}

async function main() {
  const workDir = mkdtempSync(join(tmpdir(), 'dogvantage-skk-'))
  const zipDir = join(workDir, 'zip')
  const pdfDir = join(workDir, 'pdf')

  runCommand('mkdir', ['-p', zipDir, pdfDir])

  console.log(`Using temp dir: ${workDir}`)
  console.log(`Downloading ${SKK_ZIP_URLS.length} SKK zip files...`)

  for (const [index, url] of SKK_ZIP_URLS.entries()) {
    const zipPath = join(zipDir, `grupp-${index + 1}.zip`)
    runCommand('curl', ['-L', '--fail', '--silent', '--show-error', url, '-o', zipPath])
    runCommand('unzip', ['-o', zipPath, '-d', pdfDir])
  }

  const allPdfs = listPdfFilesRecursive(pdfDir).sort((a, b) => a.localeCompare(b))
  const limitedPdfs = MAX_FILES ? allPdfs.slice(0, MAX_FILES) : allPdfs

  console.log(`Found ${allPdfs.length} PDF files${MAX_FILES ? ` (processing first ${limitedPdfs.length})` : ''}.`)

  let matched = 0
  let fallbackMatched = 0
  let insertedChunks = 0

  for (const pdfPath of limitedPdfs) {
    const filename = basename(pdfPath)
    const fciNumber = extractFciNumber(filename)
    const mappedBreed = fciNumber ? canonicalBreedFromFci(fciNumber) : null
    const breed = mappedBreed ?? fallbackBreedSlug(filename, fciNumber)

    if (mappedBreed) {
      matched++
    } else {
      fallbackMatched++
    }
    if (DRY_RUN || DOWNLOAD_ONLY) {
      console.log(`- match: ${filename} -> ${breed}${fciNumber ? ` (FCI ${fciNumber})` : ''}`)
      continue
    }

    const buffer = readFileSync(pdfPath)
    const result = await ingestPDF(buffer, {
      breed,
      filename,
      sourceUrl: SOURCE_PAGE_URL,
      docVersion: `SKK FCI ${fciNumber}`,
    })
    insertedChunks += result.chunksInserted
    console.log(`- ingested: ${filename} -> ${breed} (${result.chunksInserted} chunks)`)
  }

  console.log('\nDone.')
  console.log(`Mapped to known breeds: ${matched}`)
  console.log(`Mapped to fallback breeds: ${fallbackMatched}`)
  console.log(`Total PDFs processed: ${matched + fallbackMatched}`)
  if (!DRY_RUN && !DOWNLOAD_ONLY) {
    console.log(`Chunks inserted: ${insertedChunks}`)
  }

  if (!KEEP_TMP) {
    rmSync(workDir, { recursive: true, force: true })
  } else {
    console.log(`Temp files kept at: ${workDir}`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
