import { PDFParse } from 'pdf-parse'
import { embedText } from './embed'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import { classifyChunkContent } from '@/lib/learning/chunk-metadata'
import type { Breed } from '@dogvantage/core'

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
    const meta = classifyChunkContent(content)
    const embedding = await embedText(content)
    const { error } = await (getSupabaseAdmin().from('breed_chunks') as unknown as {
      insert: (row: Record<string, unknown>) => Promise<{ error: { message: string } | null }>
    }).insert({
      breed,
      source: filename,
      source_url: sourceUrl,
      doc_version: docVersion,
      page_ref: '',
      content,
      topic: meta.topic,
      life_stage: meta.lifeStage,
      difficulty: meta.difficulty,
      embedding: embedding as unknown as string,
    })
    if (error) throw new Error(`Insert failed: ${error.message}`)
    inserted++
  }

  return { chunksInserted: inserted }
}
