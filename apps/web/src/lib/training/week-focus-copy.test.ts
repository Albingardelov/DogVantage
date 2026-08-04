import { describe, it, expect } from 'vitest'
import { buildWeekFocusCopy } from './week-focus-copy'

describe('buildWeekFocusCopy', () => {
  it('includes program week, breed and goals in why line', () => {
    const c = buildWeekFocusCopy({
      breed: 'labrador',
      ageWeeks: 20,
      trainingWeek: 2,
      goals: ['everyday_obedience'],
    })
    expect(c.whyLine).toContain('Programvecka 2')
    expect(c.whyLine).toContain('Labrador Retriever')
    expect(c.whyLine).toContain('Vardagslydnad')
    expect(c.subGoalBullets.length).toBeGreaterThan(0)
  })

  it('provides fallback bullets when no goals', () => {
    const c = buildWeekFocusCopy({
      breed: 'italian_greyhound',
      ageWeeks: 10,
      trainingWeek: 1,
    })
    expect(c.subGoalBullets.length).toBeGreaterThan(0)
    expect(c.qualityMeasurementHint).toContain('Utfall')
  })
})
