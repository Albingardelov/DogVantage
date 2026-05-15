import { getSupabaseAdmin } from './client'
import type { ChunkMatch, Breed } from '@/types'

/**
 * Search for chunks matching the query embedding.
 * Returns results for the specific breed AND general documents (breed = 'general'),
 * sorted by similarity.
 */
export async function searchBreedChunks(
  queryEmbedding: number[],
  breed: Breed,
  matchCount = 6
): Promise<ChunkMatch[]> {
  // pgvector accepts number[] at runtime but generated types say string — cast at the boundary
  const embeddingArg = queryEmbedding as unknown as string

  // Generated DB types can lag behind latest migration; use a narrow cast at this boundary.
  const { data, error } = await (getSupabaseAdmin() as unknown as {
    rpc: (name: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>
  }).rpc('match_breed_and_general_chunks', {
    match_breed: breed,
    query_embedding: embeddingArg,
    match_count: matchCount,
  })
  if (error) throw new Error(`Chunk search failed: ${error.message}`)
  return ((data as ChunkMatch[] | null) ?? []).slice(0, matchCount)
}
