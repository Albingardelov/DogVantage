// src/lib/ai/breed-profiles.test.ts
import { describe, it, expect } from 'vitest'
import { resolveBreedProfile } from './breed-profiles'

describe('resolveBreedProfile', () => {
  it('returns full profile for labrador', () => {
    const p = resolveBreedProfile('labrador')
    expect(p.name).toBe('Labrador Retriever')
    expect(p.sensitivity).toBe('medium')
  })

  it('returns full profile for italian_greyhound', () => {
    const p = resolveBreedProfile('italian_greyhound')
    expect(p.name).toBe('Italiensk Vinthund')
  })

  it('falls back to FCI group 8 profile for golden_retriever', () => {
    const p = resolveBreedProfile('golden_retriever')
    expect(p.suggestedGoals).toContain('hunting')
  })

  it('falls back to FCI group 1 profile for border_collie', () => {
    const p = resolveBreedProfile('border_collie')
    expect(p.suggestedGoals).toContain('herding')
  })

  it('falls back to group 9 (generic) for completely unknown slug', () => {
    const p = resolveBreedProfile('zzzunknown')
    expect(p).toBeDefined()
    expect(p.suggestedGoals).toContain('everyday_obedience')
  })
})
