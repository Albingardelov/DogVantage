import type { Breed } from './dog'

/**
 * 'general' is used for documents that apply to all breeds.
 * Not a user-selectable breed — only used internally for RAG indexing.
 */
export type BreedOrGeneral = Breed | 'general'

export interface ChunkMatch {
  id: string
  content: string
  source: string
  source_url: string
  doc_version: string
  page_ref: string
  similarity: number
  topic?: string
  life_stage?: string
  difficulty?: number
}

export interface ChunkSource {
  source: string
  doc_version: string
  page_ref: string
  source_url: string
}
