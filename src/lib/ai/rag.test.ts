import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ChunkMatch, TrainingResult } from '@/types'

vi.mock('@/lib/ai/embed', () => ({
  embedText: vi.fn().mockResolvedValue(new Array(3072).fill(0.1)),
}))

vi.mock('@/lib/supabase/breed-chunks', () => ({
  searchBreedChunks: vi.fn().mockResolvedValue([
    {
      id: 'abc',
      content: 'Labradors bör tränas dagligen med positiv förstärkning.',
      source: 'RAS_labrador_2023.pdf',
      source_url: 'https://lab-klubb.se/ras.pdf',
      doc_version: '2023',
      page_ref: 's. 12',
      similarity: 0.92,
    },
  ] satisfies ChunkMatch[]),
}))

vi.mock('@/lib/ai/client', () => {
  const generateContent = vi.fn().mockResolvedValue({
    response: {
      text: () => 'Vecka 8: Träna grundläggande lydnad i lugn miljö 10 min/dag.',
    },
  })

  const model = { generateContent }

  return {
    getGeminiTextModel: () => model,
    GEMINI_TEXT_MODEL: 'gemini-2.0-flash',
  }
})

describe('queryRAG', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns content and source', async () => {
    const { queryRAG } = await import('./rag')
    const result: TrainingResult = await queryRAG(
      'Vad ska jag träna vecka 8?',
      'labrador'
    )
    expect(result.content).toBe(
      'Vecka 8: Träna grundläggande lydnad i lugn miljö 10 min/dag.'
    )
    expect(result.source).toContain('RAS_labrador_2023.pdf')
  })

  it('returns source_url from primary chunk', async () => {
    const { queryRAG } = await import('./rag')
    const result = await queryRAG('Vad ska jag träna?', 'labrador')
    expect(result.source_url).toBe('https://lab-klubb.se/ras.pdf')
  })

  it('returns sources array for chat UI and omits attribution when documents match', async () => {
    const { queryRAG } = await import('./rag')
    const result = await queryRAG('Vad ska jag träna?', 'labrador')
    expect(result.sources).toBeDefined()
    expect(result.sources).toHaveLength(1)
    expect(result.sources![0].source).toContain('RAS_labrador')
    expect(result.attributionNote).toBeUndefined()
  })

  it('includes breed in system prompt', async () => {
    const { getGeminiTextModel } = await import('@/lib/ai/client')
    const model = getGeminiTextModel()
    const { queryRAG } = await import('./rag')
    await queryRAG('Vad ska jag träna?', 'labrador')
    const call = vi.mocked(model.generateContent).mock.calls[0][0] as { systemInstruction?: string }
    expect(call.systemInstruction).toContain('labrador')
  })

  it('includes session logs in prompt when provided', async () => {
    const { getGeminiTextModel } = await import('@/lib/ai/client')
    const model = getGeminiTextModel()
    const { queryRAG } = await import('./rag')
    await queryRAG('Vad ska jag träna?', 'labrador', [
      'Vecka 7: tappade fokus efter 15 min',
    ])
    const call = vi.mocked(model.generateContent).mock.calls[0][0] as { systemInstruction?: string }
    expect(call.systemInstruction).toContain('tappade fokus efter 15 min')
  })

  it('returns vet guardrail message for health keywords without calling Gemini', async () => {
    const { getGeminiTextModel } = await import('@/lib/ai/client')
    const model = getGeminiTextModel()
    const { queryRAG } = await import('./rag')
    const result = await queryRAG('hunden haltar efter träning', 'labrador')
    expect(result.content).toContain('veterinär')
    expect(vi.mocked(model.generateContent)).not.toHaveBeenCalled()
  })
})
