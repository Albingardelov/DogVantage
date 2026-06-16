import { describe, it, expect, vi, beforeEach } from 'vitest'

const createMock = vi.fn()
vi.mock('@/lib/ai/client', () => ({
  getGroqClient: () => ({ chat: { completions: { create: createMock } } }),
  GROQ_MODEL: 'test-model',
  AI_TIMEOUTS: { chat: 1000 },
}))
vi.mock('@/lib/ai/embed', () => ({ embedText: vi.fn().mockRejectedValue(new Error('no embed in test')) }))

import { queryRAG } from './rag'

beforeEach(() => {
  createMock.mockReset()
  createMock.mockResolvedValue({ choices: [{ message: { content: 'ok' } }], usage: null })
})

describe('queryRAG locale', () => {
  it('injects the English directive into the system prompt when locale=en', async () => {
    await queryRAG('how do I teach sit', 'labrador', [], 20, [], undefined, { locale: 'en' })
    const systemMsg = createMock.mock.calls[0][0].messages[0].content as string
    expect(systemMsg).toContain('Always answer in English.')
  })

  it('returns the English vet response for a health query without calling the LLM', async () => {
    const res = await queryRAG('min hund behöver en veterinär', 'labrador', [], 20, [], undefined, { locale: 'en' })
    expect(res.content).toContain('veterinarian')
    expect(createMock).not.toHaveBeenCalled()
  })
})
