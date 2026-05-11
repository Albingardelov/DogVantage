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
  const supabase = getSupabaseAdmin()
  // pgvector accepts number[] at runtime but generated types say string — cast at the boundary
  const embeddingArg = queryEmbedding as unknown as string

  // Fetch breed-specific chunks
  const { data: breedData, error: breedError } = await supabase.rpc('match_breed_chunks', {
    query_embedding: embeddingArg,
    match_breed: breed,
    match_count: matchCount,
  })
  if (breedError) throw new Error(`Chunk search failed: ${breedError.message}`)

  // Fetch general training chunks (not breed-specific)
  const { data: generalData } = await supabase.rpc('match_breed_chunks', {
    query_embedding: embeddingArg,
    match_breed: 'general',
    match_count: matchCount,
  })

  const combined: ChunkMatch[] = [
    ...((breedData as ChunkMatch[]) ?? []),
    ...((generalData as ChunkMatch[]) ?? []),
  ]

  // De-duplicate by id and sort by similarity (highest first), keep top matchCount
  const seen = new Set<string>()
  return combined
    .filter((c) => {
      if (seen.has(c.id)) return false
      seen.add(c.id)
      return true
    })
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, matchCount)
}
