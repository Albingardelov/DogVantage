import { describe, expect, it } from 'vitest'
import { buildDeterministicWeekPlan } from './deterministic-week-planner'
import { validateWeekPlan } from './week-plan-validator'
import type { WeekPlanInput } from './week-context'
import type { WeekPlan } from '@/types'

function makeInput(overrides: Partial<WeekPlanInput> = {}): WeekPlanInput {
  return {
    breed: 'labrador',
    trainingWeek: 5,
    ageWeeks: 40,
    ...overrides,
  }
}

describe('buildDeterministicWeekPlan', () => {
  it('builds a valid 7-day deterministic plan', () => {
    const input = makeInput({
      goals: ['everyday_obedience'],
      weeklyFocus: ['recall'],
      priorityExercises: ['inkallning'],
      progressionDecisions: [
        {
          exercise_id: 'inkallning',
          criteria_level_id: 'park_low',
          decision: 'regress',
          attempts: 14,
          success_rate: 0.42,
          reason: 'Regress test',
        },
      ],
    })

    const { plan } = buildDeterministicWeekPlan(input)
    const validation = validateWeekPlan(plan, input, input.progressionDecisions ?? [])

    expect(plan.days).toHaveLength(7)
    expect(validation.ok).toBe(true)
    expect(plan.days[1]?.rest).toBe(true)
    expect(plan.days[4]?.rest).toBe(true)

    const inkallning = plan.days
      .flatMap((day) => day.exercises ?? [])
      .find((exercise) => exercise.id === 'inkallning')
    expect(inkallning).toBeTruthy()
    expect(inkallning?.desc).toMatch(/Lättare idag/i)
  })

  it('validator flags a bad plan', () => {
    const input = makeInput()
    const invalidPlan = {
      days: [{ day: 'Måndag', rest: false, exercises: [{ id: 'unknown', label: 'Unknown', desc: 'Hej', reps: 9 }] }],
    }

    const validation = validateWeekPlan(invalidPlan as unknown as WeekPlan, input, [])
    expect(validation.ok).toBe(false)
    expect(validation.reasons.length).toBeGreaterThan(0)
  })

  it('enforces reactive LAT cadence and calm follow-up', () => {
    const input = makeInput({
      isReactive: true,
      goals: ['everyday_obedience'],
    })
    const { plan } = buildDeterministicWeekPlan(input)
    const validation = validateWeekPlan(plan, input, [])

    expect(validation.ok).toBe(true)
    const latDays = plan.days
      .map((day, idx) => ({ day, idx }))
      .filter(({ day }) => (day.exercises ?? []).some((exercise) => exercise.id === 'lat'))
    expect(latDays.length).toBeGreaterThanOrEqual(2)
  })
})
