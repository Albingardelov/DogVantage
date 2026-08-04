import { describe, expect, it } from 'vitest'
import { buildDeterministicWeekPlan } from './deterministic-week-planner'
import { validateWeekPlan } from './week-plan-validator'
import type { WeekPlanInput } from './week-context'
import type { WeekPlan } from '../..'

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

  it('grounds desc in the dog actual criteria rung, not the first ladder step', () => {
    const input = makeInput({
      priorityExercises: ['inkallning'],
      progressionDecisions: [
        {
          exercise_id: 'inkallning',
          criteria_level_id: 'park_low',
          decision: 'hold',
          attempts: 14,
          success_rate: 0.7,
          reason: 'Hold test',
        },
      ],
    })

    const { plan } = buildDeterministicWeekPlan(input)
    const inkallning = plan.days
      .flatMap((day) => day.exercises ?? [])
      .find((exercise) => exercise.id === 'inkallning')

    expect(inkallning?.desc).toContain('Korta avstånd')
    expect(inkallning?.desc).not.toContain('redan är nära')
  })

  it('regress steps one rung below the current criteria level', () => {
    const input = makeInput({
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
    const inkallning = plan.days
      .flatMap((day) => day.exercises ?? [])
      .find((exercise) => exercise.id === 'inkallning')

    expect(inkallning?.desc).toMatch(/Lättare idag/i)
    expect(inkallning?.desc).toMatch(/5–10 m|tom gård/i)
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

  it('schedules the project primary exercise every training day', () => {
    const input = makeInput({
      goals: ['everyday_obedience'],
      project: {
        protocolId: 'recall',
        label: 'Pålitlig inkallning',
        primaryExerciseId: 'inkallning',
        supportExerciseIds: ['namn', 'stoppsignal'],
      },
    })

    const { plan } = buildDeterministicWeekPlan(input)
    const validation = validateWeekPlan(plan, input, [])

    expect(validation.ok).toBe(true)
    const trainingDays = plan.days.filter((day) => !day.rest)
    for (const day of trainingDays) {
      expect((day.exercises ?? []).some((e) => e.id === 'inkallning'), day.day).toBe(true)
    }
  })

  it('rejects >2 repetitions without a project but allows them for the project primary', () => {
    const project = {
      protocolId: 'recall',
      label: 'Pålitlig inkallning',
      primaryExerciseId: 'inkallning',
      supportExerciseIds: ['namn'],
    }
    const { plan } = buildDeterministicWeekPlan(makeInput({ goals: ['everyday_obedience'], project }))

    const withProject = validateWeekPlan(plan, makeInput({ goals: ['everyday_obedience'], project }), [])
    expect(withProject.ok).toBe(true)

    const withoutProject = validateWeekPlan(plan, makeInput({ goals: ['everyday_obedience'] }), [])
    expect(withoutProject.violations.some((v) => v.code === 'exercise_repetition_limit')).toBe(true)
  })

  it('down-weights recently skipped exercises', () => {
    const base = makeInput({ goals: ['everyday_obedience'] })
    const { plan: planBefore } = buildDeterministicWeekPlan(base)
    const countBefore = planBefore.days
      .flatMap((day) => day.exercises ?? [])
      .filter((e) => e.id === 'koppel').length
    expect(countBefore).toBeGreaterThan(0)

    const { plan: planAfter } = buildDeterministicWeekPlan(
      makeInput({ goals: ['everyday_obedience'], recentSkips: { koppel: 2 } }),
    )
    const countAfter = planAfter.days
      .flatMap((day) => day.exercises ?? [])
      .filter((e) => e.id === 'koppel').length
    expect(countAfter).toBeLessThan(countBefore)
  })

  it('respects calm-only days after LAT even with an active project', () => {
    const input = makeInput({
      isReactive: true,
      goals: ['everyday_obedience'],
      project: {
        protocolId: 'recall',
        label: 'Pålitlig inkallning',
        primaryExerciseId: 'inkallning',
        supportExerciseIds: ['namn'],
      },
    })
    const { plan } = buildDeterministicWeekPlan(input)
    const validation = validateWeekPlan(plan, input, [])
    expect(validation.ok).toBe(true)
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
