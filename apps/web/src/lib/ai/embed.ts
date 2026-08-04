import { AI_TIMEOUTS, getEmbedModel } from './client'

// gemini-embedding-001 returns 3072 dims, but pgvector cannot index more than
// 2000 dims (HNSW/IVFFlat). Gemini embeddings are MRL-trained (Matryoshka), so
// truncating to the first 1536 dims and re-normalizing is the supported way to
// get a smaller, indexable vector. Must match vector(1536) in the DB schema.
export const EMBEDDING_DIMENSIONS = 1536

export async function embedText(text: string): Promise<number[]> {
  const result = await getEmbedModel().embedContent(text, { timeout: AI_TIMEOUTS.embed })
  return truncateAndNormalize(result.embedding.values, EMBEDDING_DIMENSIONS)
}

function truncateAndNormalize(values: number[], dimensions: number): number[] {
  const truncated = values.slice(0, dimensions)
  let norm = 0
  for (const v of truncated) norm += v * v
  norm = Math.sqrt(norm)
  if (norm === 0) return truncated
  return truncated.map((v) => v / norm)
}
