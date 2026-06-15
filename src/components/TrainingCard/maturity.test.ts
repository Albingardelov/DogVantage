import { describe, it, expect } from 'vitest'
import { exerciseMaturity } from './maturity'

describe('exerciseMaturity', () => {
  it('is "practiced" when the id is in the practiced set', () => {
    expect(exerciseMaturity('sitt', new Set(['sitt']))).toBe('practiced')
  })

  it('is "new" when the id is not in the set', () => {
    expect(exerciseMaturity('ligg', new Set(['sitt']))).toBe('new')
  })

  it('is "new" for any id when the set is empty (e.g. history failed to load)', () => {
    expect(exerciseMaturity('sitt', new Set())).toBe('new')
  })
})
