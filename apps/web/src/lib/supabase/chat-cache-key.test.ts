import { describe, it, expect } from 'vitest'
import { chatCacheKey } from './training-cache'

describe('chatCacheKey', () => {
  it('produces different keys per locale for the same query', () => {
    expect(chatCacheKey('Hur lär jag sitt?', 'labrador', 'sv', 20))
      .not.toBe(chatCacheKey('Hur lär jag sitt?', 'labrador', 'en', 20))
  })
  it('is stable for the same inputs', () => {
    expect(chatCacheKey('q', 'labrador', 'en', 20)).toBe(chatCacheKey('q', 'labrador', 'en', 20))
  })
  it('uses the v2 namespace', () => {
    expect(chatCacheKey('q', 'labrador', 'en', 20)).toMatch(/^chatcache_v2_/)
  })
})
