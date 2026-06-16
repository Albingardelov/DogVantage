import { describe, it, expect } from 'vitest'
import { microLessonCacheKey, struggleAdviceCacheKey } from './doc-learning'

describe('doc-learning cache keys include locale', () => {
  it('micro-lesson key differs per locale', () => {
    expect(microLessonCacheKey('en', 'labrador', 'puppy', 'sitt'))
      .not.toBe(microLessonCacheKey('sv', 'labrador', 'puppy', 'sitt'))
  })
  it('struggle-advice key differs per locale', () => {
    expect(struggleAdviceCacheKey('en', 'labrador', 'sitt'))
      .not.toBe(struggleAdviceCacheKey('sv', 'labrador', 'sitt'))
  })
})
