import { PDFParse } from 'pdf-parse'
import { embedText } from './embed'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import type { Breed } from '@/types'

const CHUNK_SIZE = 2000    // chars ≈ 500 tokens
const CHUNK_OVERLAP = 200  // chars ≈ 50 tokens overlap

function chunkText(text: string): string[] {
  const chunks: string[] = []
  let start = 0
  while (start < text.length) {
    const end = Math.min(start + CHUNK_SIZE, text.length)
    chunks.push(text.slice(start, end).trim())
    start += CHUNK_SIZE - CHUNK_OVERLAP
  }
  return chunks.filter((c) => c.length > 50)
}

export interface IngestOptions {
  breed: Breed
  filename: string
  sourceUrl?: string
  docVersion?: string
}

export async function ingestPDF(
  buffer: Buffer,
  options: IngestOptions
): Promise<{ chunksInserted: number }> {
  const { breed, filename, sourceUrl = '', docVersion = '' } = options
  const parser = new PDFParse({ data: new Uint8Array(buffer) })
  const result = await parser.getText()
  const chunks = chunkText(result.text)

  let inserted = 0
  for (const content of chunks) {
    const embedding = await embedText(content)
    const { error } = await getSupabaseAdmin().from('breed_chunks').insert({
      breed,
      source: filename,
      source_url: sourceUrl,
      doc_version: docVersion,
      page_ref: '',
      content,
      embedding,
    })
    if (error) throw new Error(`Insert failed: ${error.message}`)
    inserted++
  }

  return { chunksInserted: inserted }
}
