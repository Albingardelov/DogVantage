import { embedText } from '@/lib/ai/embed'
import { searchBreedChunks } from '@/lib/supabase/breed-chunks'
import type { Breed, ChunkMatch } from '@dogvantage/core'
import type { ChunkTopic, LifeStageFilter } from '@/lib/learning/chunk-metadata'

const MIN_SIMILARITY = 0.66

export interface RetrievalFilters {
  topic?: ChunkTopic
  lifeStage?: LifeStageFilter
}

export async function retrieveDocumentChunks(
  breed: Breed,
  query: string,
  count: number,
  filters?: RetrievalFilters,
): Promise<ChunkMatch[]> {
  try {
    const embedding = await embedText(query)
    const retrieved = await searchBreedChunks(embedding, breed, count * 2, {
      lifeStage: filters?.lifeStage,
      topic: filters?.topic,
    })
    return retrieved
      .filter((c) => Number.isFinite(c.similarity) && c.similarity >= MIN_SIMILARITY)
      .slice(0, count)
  } catch (err) {
    console.error('[doc-retrieval] failed:', err instanceof Error ? err.message : String(err))
    return []
  }
}

export function formatChunksForPrompt(chunks: ChunkMatch[]): string {
  return chunks
    .map((c) => {
      const meta = [c.topic, c.life_stage].filter(Boolean).join(', ')
      return `${c.content}\n[Källa: ${c.source}${meta ? ` (${meta})` : ''}${c.source_url ? ` — ${c.source_url}` : ''}]`
    })
    .join('\n\n')
}
