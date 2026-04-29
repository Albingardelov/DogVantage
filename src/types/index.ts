export type Breed = 'labrador' | 'italian_greyhound' | 'braque_francais'

export interface DogProfile {
  name: string
  breed: Breed
  birthdate: string // ISO 8601, e.g. "2024-10-15"
}

export interface ChunkMatch {
  id: string
  content: string
  source: string
  source_url: string
  doc_version: string
  page_ref: string
  similarity: number
}

export interface TrainingResult {
  content: string
  source: string
  source_url: string // empty string if unknown — used for "Läs originalet" link
}

export interface ChatMessage {
  role: 'user' | 'model'
  content: string
}

export type QuickRating = 'good' | 'mixed' | 'bad'

export interface SessionLog {
  id: string
  breed: Breed
  week_number: number
  quick_rating: QuickRating
  focus: number      // 1–5
  obedience: number  // 1–5
  notes?: string     // valfri fritext
  created_at: string
}

export interface ChunkSource {
  source: string
  doc_version: string
  page_ref: string
  source_url: string
}
