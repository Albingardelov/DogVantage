import { describe, it, expect } from 'vitest'
import { isValidBreed, getBreedEntry, BREED_REGISTRY } from './registry'

describe('isValidBreed', () => {
  it('returns true for the 4 legacy slugs', () => {
    expect(isValidBreed('labrador')).toBe(true)
    expect(isValidBreed('italian_greyhound')).toBe(true)
    expect(isValidBreed('braque_francais')).toBe(true)
    expect(isValidBreed('miniature_american_shepherd')).toBe(true)
  })

  it('returns true for new breeds', () => {
    expect(isValidBreed('golden_retriever')).toBe(true)
    expect(isValidBreed('border_collie')).toBe(true)
  })

  it('returns false for unknown slugs', () => {
    expect(isValidBreed('fake_breed')).toBe(false)
    expect(isValidBreed('')).toBe(false)
  })
})

describe('getBreedEntry', () => {
  it('returns the correct entry for labrador', () => {
    const entry = getBreedEntry('labrador')
    expect(entry).toBeDefined()
    expect(entry!.fciGroup).toBe(8)
    expect(entry!.fciNumber).toBe(122)
    expect(entry!.nameSv).toBe('Labrador Retriever')
  })

  it('returns undefined for unknown slug', () => {
    expect(getBreedEntry('not_a_breed')).toBeUndefined()
  })
})

describe('BREED_REGISTRY', () => {
  it('covers all 10 FCI groups', () => {
    const groups = new Set(BREED_REGISTRY.map((b) => b.fciGroup))
    expect(groups.size).toBe(10)
    for (let g = 1; g <= 10; g++) {
      expect(groups.has(g as 1)).toBe(true)
    }
  })

  it('has no duplicate slugs', () => {
    const slugs = BREED_REGISTRY.map((b) => b.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })
})
