export interface TrainingSourceRef {
  source: string
  source_url: string
  doc_version: string
  page_ref: string
}

export interface TrainingResult {
  content: string
  source: string
  source_url: string
  sources?: TrainingSourceRef[]
  attributionNote?: string
}

export interface ChatMessage {
  role: 'user' | 'model'
  content: string
  sources?: TrainingSourceRef[]
  attributionNote?: string
  retryQuery?: string
}
