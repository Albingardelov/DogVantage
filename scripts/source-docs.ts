/**
 * Syncs the third-party PDFs used by the ingest scripts with a private
 * Supabase Storage bucket. The PDFs are not committed: docs/source-documents.json
 * lists each file's repo path, checksum and original source URL, and the bucket
 * stores the files under their sha256.
 *
 * Usage:
 *   npx tsx scripts/source-docs.ts pull   # download missing/changed files into docs/
 *   npx tsx scripts/source-docs.ts push   # upload local files listed in the manifest
 *   npx tsx scripts/source-docs.ts add <file.pdf> [sourceUrl]   # add a new file to the manifest
 *
 * Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (e.g. in .env.local).
 */
import { config } from 'dotenv'
import { createHash } from 'crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, relative, resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })
config()

const BUCKET = 'source-documents'
const MANIFEST_PATH = 'docs/source-documents.json'

interface SourceDocument {
  path: string
  bytes: number
  sha256: string
  sourceUrl: string | null
}

function readManifest(): SourceDocument[] {
  return JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')) as SourceDocument[]
}

function writeManifest(docs: SourceDocument[]): void {
  const sorted = [...docs].sort((a, b) => a.path.localeCompare(b.path))
  writeFileSync(MANIFEST_PATH, `${JSON.stringify(sorted, null, 2)}\n`)
}

function sha256(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex')
}

function objectKey(doc: SourceDocument): string {
  return `${doc.sha256}.pdf`
}

function storage() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  return createClient(url, key, { auth: { persistSession: false } }).storage
}

function localMatches(doc: SourceDocument): boolean {
  return existsSync(doc.path) && sha256(readFileSync(doc.path)) === doc.sha256
}

async function pull(): Promise<void> {
  const bucket = storage().from(BUCKET)
  let downloaded = 0
  for (const doc of readManifest()) {
    if (localMatches(doc)) continue
    const { data, error } = await bucket.download(objectKey(doc))
    if (error || !data) throw new Error(`Download failed for ${doc.path}: ${error?.message ?? 'no data'}`)
    const buffer = Buffer.from(await data.arrayBuffer())
    if (sha256(buffer) !== doc.sha256) throw new Error(`Checksum mismatch for ${doc.path}`)
    mkdirSync(dirname(doc.path), { recursive: true })
    writeFileSync(doc.path, buffer)
    downloaded += 1
    console.log(`  ↓ ${doc.path}`)
  }
  console.log(`Done: ${downloaded} downloaded, everything else already up to date.`)
}

async function ensureBucket(): Promise<void> {
  const client = storage()
  const { data } = await client.getBucket(BUCKET)
  if (data) {
    if (data.public) throw new Error(`Bucket ${BUCKET} is public; it must be private`)
    return
  }
  const { error } = await client.createBucket(BUCKET, { public: false })
  if (error) throw new Error(`Could not create bucket ${BUCKET}: ${error.message}`)
  console.log(`Created private bucket ${BUCKET}`)
}

async function push(): Promise<void> {
  await ensureBucket()
  const bucket = storage().from(BUCKET)
  let uploaded = 0
  for (const doc of readManifest()) {
    if (!localMatches(doc)) {
      console.warn(`  skip ${doc.path}: missing locally or checksum differs`)
      continue
    }
    const { error } = await bucket.upload(objectKey(doc), readFileSync(doc.path), {
      contentType: 'application/pdf',
      upsert: false,
    })
    if (error && !/already exists|Duplicate/i.test(error.message)) {
      throw new Error(`Upload failed for ${doc.path}: ${error.message}`)
    }
    if (!error) {
      uploaded += 1
      console.log(`  ↑ ${doc.path}`)
    }
  }
  console.log(`Done: ${uploaded} uploaded, the rest were already in the bucket.`)
}

function add(file: string | undefined, sourceUrl: string | undefined): void {
  if (!file || !existsSync(file)) throw new Error('Usage: add <file.pdf> [sourceUrl]')
  const path = relative(process.cwd(), resolve(file))
  const buffer = readFileSync(path)
  const docs = readManifest().filter((d) => d.path !== path)
  docs.push({ path, bytes: buffer.length, sha256: sha256(buffer), sourceUrl: sourceUrl ?? null })
  writeManifest(docs)
  console.log(`Added ${path}. Run "push" to upload it.`)
}

async function main(): Promise<void> {
  const [command, ...args] = process.argv.slice(2)
  if (command === 'pull') return pull()
  if (command === 'push') return push()
  if (command === 'add') return add(args[0], args[1])
  throw new Error('Usage: source-docs.ts pull | push | add <file.pdf> [sourceUrl]')
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
