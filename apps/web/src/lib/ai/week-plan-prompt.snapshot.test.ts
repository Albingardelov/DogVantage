import { describe, expect, it } from 'vitest'
import { buildWeekPromptParts } from './week-plan-prompt'

describe('buildWeekPromptParts snapshots', () => {
  it('builds baseline puppy prompt', () => {
    const { systemPrompt } = buildWeekPromptParts({
      breed: 'labrador',
      trainingWeek: 1,
      ageWeeks: 12,
      goals: ['everyday_obedience'],
      onboardingContext: 'Miljö: Stad',
      householdPets: ['cats_indoor'],
    })
    expect(systemPrompt).toMatchSnapshot()
  })

  it('builds reactive adolescent prompt', () => {
    const { systemPrompt } = buildWeekPromptParts({
      breed: 'miniature_american_shepherd',
      trainingWeek: 6,
      ageWeeks: 40,
      onboardingContext: 'Drar hårt eller reagerar på andra hundar',
      dogSex: 'male',
      castrationStatus: 'intact',
      progressionRule: 'Progression: håll kriterier för inkallning.',
    })
    expect(systemPrompt).toMatchSnapshot()
  })

  it('builds in-heat focus prompt', () => {
    const { systemPrompt } = buildWeekPromptParts({
      breed: 'braque_francais',
      trainingWeek: 4,
      ageWeeks: 60,
      goals: ['hunting'],
      weeklyFocus: ['impulse_calm', 'attention'],
      isInHeat: true,
      householdPets: ['small_animals'],
      customExercises: [{ exercise_id: 'targetmatta', label: 'Targetmatta' }],
      performanceSummary: '• Inkallning gick bra förra veckan',
    })
    expect(systemPrompt).toMatchSnapshot()
  })
})
