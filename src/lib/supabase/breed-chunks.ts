import { supabase } from './client'
import type { ChunkMatch, Breed } from '@/types'

export async function searchBreedChunks(
  queryEmbedding: number[],
  breed: Breed,
  matchCount = 5
): Promise<ChunkMatch[]> {
  const { data, error } = await supabase.rpc('match_breed_chunks', {
    query_embedding: queryEmbedding,
    match_breed: breed,
    match_count: matchCount,
  })

  if (error) throw new Error(`Chunk search failed: ${error.message}`)

  return (data as ChunkMatch[]) ?? []
}
