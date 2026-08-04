import { getSupabaseAdmin } from './client'
import type { ChunkMatch, Breed } from '@dogvantage/core'
import type { ChunkTopic, LifeStageFilter } from '@/lib/learning/chunk-metadata'

export interface ChunkSearchFilters {
  lifeStage?: LifeStageFilter
  topic?: ChunkTopic
}

/**
 * Search for chunks matching the query embedding.
 * Returns results for the specific breed AND general documents (breed = 'general'),
 * sorted by similarity with optional metadata boosts.
 */
export async function searchBreedChunks(
  queryEmbedding: number[],
  breed: Breed,
  matchCount = 6,
  filters?: ChunkSearchFilters,
): Promise<ChunkMatch[]> {
  const embeddingArg = queryEmbedding as unknown as string

  const { data, error } = await (getSupabaseAdmin() as unknown as {
    rpc: (name: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>
  }).rpc('match_breed_and_general_chunks', {
    match_breed: breed,
    query_embedding: embeddingArg,
    match_count: matchCount,
    p_life_stage: filters?.lifeStage ?? null,
    p_topic: filters?.topic ?? null,
  })
  if (error) throw new Error(`Chunk search failed: ${error.message}`)
  return ((data as ChunkMatch[] | null) ?? []).slice(0, matchCount)
}
