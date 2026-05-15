import { describe, expect, it } from 'vitest'
import { markerRule } from './marker'
import { puppyRule } from './puppy'
import { goalRule } from './goal'
import { petRule } from './pet'
import { sexRule } from './sex'
import { reactiveRule } from './reactive'
import { composeRules } from './index'
import type { WeekPlanContext } from './types'

function baseContext(overrides: Partial<WeekPlanContext> = {}): WeekPlanContext {
  return {
    breed: 'labrador',
    trainingWeek: 1,
    ageWeeks: 12,
    lifeStage: 'puppy',
    goals: [],
    onboardingContext: undefined,
    performanceSummary: undefined,
    customExercises: [],
    householdPets: [],
    weeklyFocus: [],
    dogSex: undefined,
    castrationStatus: undefined,
    isInHeat: false,
    skenfasActive: false,
    progressionRule: null,
    isReactive: false,
    hasCats: false,
    hasOutdoorCats: false,
    hasSmallAnimals: false,
    hasLivestock: false,
    isMasAdult: false,
    isIntactMaleAdolescent: false,
    ...overrides,
  }
}

describe('week rules', () => {
  it('markerRule is enabled for week <= 3', () => {
    const out = markerRule(baseContext({ trainingWeek: 2 }))
    expect(out).toContain('marker')
  })

  it('puppyRule is enabled only in puppy stage', () => {
    expect(puppyRule(baseContext({ lifeStage: 'puppy' }))).toBeTruthy()
    expect(puppyRule(baseContext({ lifeStage: 'adult' }))).toBeNull()
  })

  it('goalRule includes selected goal labels', () => {
    const out = goalRule(baseContext({ goals: ['sport'] }))
    expect(out).toContain('Sport')
  })

  it('petRule includes cat-specific guidance', () => {
    const out = petRule(baseContext({ hasCats: true }))
    expect(out).toContain('katter i hemmet')
  })

  it('sexRule prioritizes in-heat behavior', () => {
    const out = sexRule(baseContext({ isInHeat: true }))
    expect(out).toContain('tik i löp')
  })

  it('reactiveRule only activates for reactive dogs', () => {
    expect(reactiveRule(baseContext({ isReactive: false }))).toBeNull()
    expect(reactiveRule(baseContext({ isReactive: true }))).toContain('Reaktivitetsregel')
  })

  it('composeRules joins non-null rules', () => {
    const out = composeRules(baseContext(), [
      () => 'A',
      () => null,
      () => 'B',
    ])
    expect(out).toBe('A\nB')
  })
})
