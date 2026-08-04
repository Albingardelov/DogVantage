import { describe, it, expect } from 'vitest'
import { findEnvironmentGapInsight, formatInsightCopy } from './insights'
import type { DogStatePayload, DogStateEnvExerciseStat } from './dog-state'

function payloadWith(entries: DogStateEnvExerciseStat[]): DogStatePayload {
  return {
    version: 1,
    weakExercises: [],
    strongExercises: [],
    environmentDifficulty: {},
    environmentByExercise: entries,
    handler: { timing: null, consistency: null, reading: null, sampleSize: 0 },
    zoneSummary: { greenDays: 0, yellowDays: 0, redDays: 0, window: 14 },
    thresholdAdjustments: {},
  }
}

function stat(
  exerciseId: string,
  environment: DogStateEnvExerciseStat['environment'],
  successRate: number,
  attempts = 10,
): DogStateEnvExerciseStat {
  return { exerciseId, environment, successRate, attempts }
}

describe('findEnvironmentGapInsight', () => {
  it('returns null when the field is missing (old cached payload)', () => {
    const payload = payloadWith([])
    delete payload.environmentByExercise
    expect(findEnvironmentGapInsight(payload)).toBeNull()
  })

  it('finds a gap between an easy and a harder environment', () => {
    const insight = findEnvironmentGapInsight(payloadWith([
      stat('sitt', 'home', 0.9),
      stat('sitt', 'park', 0.4),
    ]))
    expect(insight).toEqual({
      exerciseId: 'sitt',
      easyEnv: 'home',
      hardEnv: 'park',
      easyRate: 0.9,
      hardRate: 0.4,
    })
  })

  it('requires easy >= 0.75 and hard <= 0.5', () => {
    expect(findEnvironmentGapInsight(payloadWith([
      stat('sitt', 'home', 0.74),
      stat('sitt', 'park', 0.4),
    ]))).toBeNull()
    expect(findEnvironmentGapInsight(payloadWith([
      stat('sitt', 'home', 0.9),
      stat('sitt', 'park', 0.51),
    ]))).toBeNull()
  })

  it('requires >= 8 attempts in both environments', () => {
    expect(findEnvironmentGapInsight(payloadWith([
      stat('sitt', 'home', 0.9, 7),
      stat('sitt', 'park', 0.4),
    ]))).toBeNull()
  })

  it('ignores mixed environment and inverted gaps', () => {
    expect(findEnvironmentGapInsight(payloadWith([
      stat('sitt', 'mixed', 0.9),
      stat('sitt', 'park', 0.4),
    ]))).toBeNull()
    expect(findEnvironmentGapInsight(payloadWith([
      stat('sitt', 'park', 0.9),
      stat('sitt', 'home', 0.4),
    ]))).toBeNull()
  })

  it('picks the largest gap among candidates', () => {
    const insight = findEnvironmentGapInsight(payloadWith([
      stat('sitt', 'home', 0.8),
      stat('sitt', 'outdoor', 0.5),
      stat('inkallning', 'home', 0.95),
      stat('inkallning', 'park', 0.3),
    ]))
    expect(insight?.exerciseId).toBe('inkallning')
  })
})

describe('formatInsightCopy', () => {
  it('builds swedish copy with label and percentages', () => {
    const copy = formatInsightCopy({
      exerciseId: 'sitt',
      easyEnv: 'home',
      hardEnv: 'park',
      easyRate: 0.9,
      hardRate: 0.4,
    })
    expect(copy.title).toBe('Sitt sitter hemma — men inte i parken')
    expect(copy.body).toContain('90 % hemma')
    expect(copy.body).toContain('40 % i parken')
    expect(copy.body).toContain('inte trots')
  })
})
