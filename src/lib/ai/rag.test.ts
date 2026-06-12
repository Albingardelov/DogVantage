import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ChunkMatch, TrainingResult } from '@/types'

vi.mock('@/lib/ai/embed', () => ({
  embedText: vi.fn().mockResolvedValue(new Array(1536).fill(0.1)),
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
  const create = vi.fn().mockResolvedValue({
    choices: [
      {
        message: {
          content: 'Vecka 8: Träna grundläggande lydnad i lugn miljö 10 min/dag.',
        },
      },
    ],
  })

  const client = { chat: { completions: { create } } }

  return {
    getGroqClient: () => client,
    GROQ_MODEL: 'llama-3.3-70b-versatile',
    AI_TIMEOUTS: { embed: 10_000, chat: 25_000, weekPlan: 20_000 },
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
    const { getGroqClient } = await import('@/lib/ai/client')
    const client = getGroqClient()
    const { queryRAG } = await import('./rag')
    await queryRAG('Vad ska jag träna?', 'labrador')
    const call = vi.mocked(client.chat.completions.create).mock.calls[0][0] as { messages: { role: string; content: string }[] }
    const systemMsg = call.messages.find((m) => m.role === 'system')?.content ?? ''
    expect(systemMsg).toContain('labrador')
  })

  it('includes session logs in prompt when provided', async () => {
    const { getGroqClient } = await import('@/lib/ai/client')
    const client = getGroqClient()
    const { queryRAG } = await import('./rag')
    await queryRAG('Vad ska jag träna?', 'labrador', [
      'Vecka 7: tappade fokus efter 15 min',
    ])
    const call = vi.mocked(client.chat.completions.create).mock.calls[0][0] as { messages: { role: string; content: string }[] }
    const systemMsg = call.messages.find((m) => m.role === 'system')?.content ?? ''
    expect(systemMsg).toContain('tappade fokus efter 15 min')
  })

  it('returns vet guardrail message for health keywords without calling Groq', async () => {
    const { getGroqClient } = await import('@/lib/ai/client')
    const client = getGroqClient()
    const { queryRAG } = await import('./rag')
    const result = await queryRAG('hunden haltar efter träning', 'labrador')
    expect(result.content).toContain('veterinär')
    expect(vi.mocked(client.chat.completions.create)).not.toHaveBeenCalled()
  })

  it('fetches a wider candidate set for foundational obedience questions', async () => {
    const { searchBreedChunks } = await import('@/lib/supabase/breed-chunks')
    const { queryRAG } = await import('./rag')
    await queryRAG('Hur tränar jag sitt och stanna bäst?', 'labrador')
    expect(vi.mocked(searchBreedChunks)).toHaveBeenCalledWith(
      expect.any(Array),
      'labrador',
      12
    )
  })

  it('prioritizes curated obedience sources when query is obedience-focused', async () => {
    const { searchBreedChunks } = await import('@/lib/supabase/breed-chunks')
    vi.mocked(searchBreedChunks).mockResolvedValueOnce([
      {
        id: 'generic-top',
        content: 'Allmän rastext.',
        source: 'standard-labrador.pdf',
        source_url: 'https://skk.se',
        doc_version: '2024',
        page_ref: 's.1',
        similarity: 0.95,
      },
      {
        id: 'obedience-priority',
        content: 'Stegvis sitt/stanna med belöning.',
        source: 'rspca-basic-commands.pdf',
        source_url: 'https://www.rspca.org.uk/documents/example.pdf',
        doc_version: 'RSPCA 2.0',
        page_ref: 's.2',
        similarity: 0.8,
      },
    ] satisfies ChunkMatch[])

    const { queryRAG } = await import('./rag')
    const result = await queryRAG('Hur lär jag valpen sitt?', 'labrador')
    expect(result.source).toContain('rspca-basic-commands.pdf')
  })

  it('falls back to general methodology with attribution note when no document chunks match', async () => {
    const { searchBreedChunks } = await import('@/lib/supabase/breed-chunks')
    vi.mocked(searchBreedChunks).mockResolvedValueOnce([])
    const { getGroqClient } = await import('@/lib/ai/client')
    const client = getGroqClient()
    const { queryRAG } = await import('./rag')
    const result = await queryRAG('Hur tränar jag plats?', 'labrador')
    expect(result.attributionNote).toContain('dokument')
    expect(result.sources).toBeUndefined()
    expect(vi.mocked(client.chat.completions.create)).toHaveBeenCalledTimes(1)
  })

  it('excludes low-similarity chunks and answers from general methodology instead', async () => {
    const { searchBreedChunks } = await import('@/lib/supabase/breed-chunks')
    vi.mocked(searchBreedChunks).mockResolvedValueOnce([
      {
        id: 'low-sim',
        content: 'Svag träff.',
        source: 'some-source.pdf',
        source_url: 'https://example.com/some-source.pdf',
        doc_version: '1',
        page_ref: 's.1',
        similarity: 0.2,
      },
    ] satisfies ChunkMatch[])
    const { getGroqClient } = await import('@/lib/ai/client')
    const client = getGroqClient()
    const { queryRAG } = await import('./rag')
    const result = await queryRAG('Hur tränar jag sitt?', 'labrador')
    expect(result.attributionNote).toContain('dokument')
    expect(result.sources).toBeUndefined()
    const callArgs = vi.mocked(client.chat.completions.create).mock.calls[0][0] as {
      messages: Array<{ content: string }>
    }
    expect(callArgs.messages[0].content).not.toContain('Svag träff.')
  })

  it('includes prior conversation turns as chat messages', async () => {
    const { getGroqClient } = await import('@/lib/ai/client')
    const client = getGroqClient()
    const { queryRAG } = await import('./rag')
    await queryRAG('Och hur går jag vidare?', 'labrador', [], 12, [], undefined, {
      history: [
        { role: 'user', content: 'Hur tränar jag inkallning?' },
        { role: 'assistant', content: 'Börja inomhus med kort avstånd.' },
      ],
    })
    const call = vi.mocked(client.chat.completions.create).mock.calls[0][0] as { messages: { role: string; content: string }[] }
    expect(call.messages).toHaveLength(4)
    expect(call.messages[1]).toEqual({ role: 'user', content: 'Hur tränar jag inkallning?' })
    expect(call.messages[2]).toEqual({ role: 'assistant', content: 'Börja inomhus med kort avstånd.' })
    expect(call.messages[3]).toEqual({ role: 'user', content: 'Och hur går jag vidare?' })
  })

  it('includes dog state section in system prompt when provided', async () => {
    const { getGroqClient } = await import('@/lib/ai/client')
    const client = getGroqClient()
    const { queryRAG } = await import('./rag')
    await queryRAG('Hur går vi vidare med sitt?', 'labrador', [], 12, [], undefined, {
      dogStateContext: 'Svaga övningar (senaste 28 d): Inkallning 40 % (20 försök)',
    })
    const call = vi.mocked(client.chat.completions.create).mock.calls[0][0] as { messages: { role: string; content: string }[] }
    const systemMsg = call.messages.find((m) => m.role === 'system')?.content ?? ''
    expect(systemMsg).toContain('=== HUNDPROFIL (DATA) ===')
    expect(systemMsg).toContain('Inkallning 40 % (20 försök)')
  })

  it('omits dog state section without context', async () => {
    const { getGroqClient } = await import('@/lib/ai/client')
    const client = getGroqClient()
    const { queryRAG } = await import('./rag')
    await queryRAG('Hur går vi vidare med sitt?', 'labrador', [], 12, [])
    const call = vi.mocked(client.chat.completions.create).mock.calls[0][0] as { messages: { role: string; content: string }[] }
    const systemMsg = call.messages.find((m) => m.role === 'system')?.content ?? ''
    expect(systemMsg).not.toContain('HUNDPROFIL')
  })
})
