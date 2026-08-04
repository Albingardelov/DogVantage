import { describe, it, expect } from 'vitest'
import {
  computeHandlerStruggle,
  dampAdvances,
  type HandlerAverages,
} from './handler-state'
import type { ExerciseProgressionDecision } from '../../lib/training/progression-rules'

function handler(overrides: Partial<HandlerAverages> = {}): HandlerAverages {
  return { timing: null, consistency: null, reading: null, sampleSize: 0, ...overrides }
}

function decision(
  exerciseId: string,
  d: ExerciseProgressionDecision['decision'],
): ExerciseProgressionDecision {
  return {
    exercise_id: exerciseId,
    criteria_level_id: null,
    decision: d,
    attempts: 12,
    success_rate: 0.85,
    reason: 'ursprunglig anledning',
  }
}

describe('computeHandlerStruggle', () => {
  it('is not struggling without data', () => {
    const result = computeHandlerStruggle(handler(), null)
    expect(result.struggling).toBe(false)
    expect(result.dimensions).toEqual([])
    expect(result.reason).toBeNull()
  })

  it('flags a dimension below 3.0 with at least 3 samples', () => {
    const result = computeHandlerStruggle(handler({ timing: 2.4, sampleSize: 3 }), null)
    expect(result.struggling).toBe(true)
    expect(result.dimensions).toEqual(['timing'])
    expect(result.reason).toContain('timing')
  })

  it('ignores low dimensions with too few samples', () => {
    const result = computeHandlerStruggle(handler({ timing: 1.0, sampleSize: 2 }), null)
    expect(result.struggling).toBe(false)
  })

  it('collects multiple weak dimensions', () => {
    const result = computeHandlerStruggle(
      handler({ timing: 2.0, consistency: 2.5, reading: 4.0, sampleSize: 5 }),
      null,
    )
    expect(result.dimensions).toEqual(['timing', 'consistency'])
  })

  it('flags quiz accuracy below 50% with at least 5 answered', () => {
    const result = computeHandlerStruggle(handler(), { answered: 6, correct: 2 })
    expect(result.struggling).toBe(true)
    expect(result.dimensions).toEqual([])
    expect(result.reason).toContain('kursen')
  })

  it('ignores quiz accuracy with fewer than 5 answered', () => {
    const result = computeHandlerStruggle(handler(), { answered: 4, correct: 0 })
    expect(result.struggling).toBe(false)
  })

  it('exactly 50% quiz accuracy is not struggling', () => {
    const result = computeHandlerStruggle(handler(), { answered: 6, correct: 3 })
    expect(result.struggling).toBe(false)
  })
})

describe('dampAdvances', () => {
  it('returns decisions untouched when not struggling', () => {
    const decisions = [decision('sitt', 'advance'), decision('koppel', 'regress')]
    const result = dampAdvances(decisions, computeHandlerStruggle(handler(), null))
    expect(result).toEqual(decisions)
  })

  it('turns advance into hold with an explanatory reason when struggling', () => {
    const struggle = computeHandlerStruggle(handler({ timing: 2.0, sampleSize: 4 }), null)
    const result = dampAdvances([decision('sitt', 'advance')], struggle)
    expect(result[0].decision).toBe('hold')
    expect(result[0].reason).toContain('stabiliserar')
  })

  it('leaves hold and regress untouched when struggling', () => {
    const struggle = computeHandlerStruggle(handler({ timing: 2.0, sampleSize: 4 }), null)
    const result = dampAdvances(
      [decision('plats', 'hold'), decision('koppel', 'regress')],
      struggle,
    )
    expect(result[0].decision).toBe('hold')
    expect(result[0].reason).toBe('ursprunglig anledning')
    expect(result[1].decision).toBe('regress')
  })
})
