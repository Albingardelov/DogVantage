import { describe, it, expect } from 'vitest'
import {
  evaluateDecisions,
  computeThresholdAdjustments,
  type PendingDecisionRow,
  type CurrentExerciseState,
  type AdvanceOutcomeRow,
} from './decision-calibration'

const NOW = new Date('2026-06-11T12:00:00Z')

function pending(
  id: string,
  exerciseId: string,
  decision: PendingDecisionRow['decision'],
  daysAgo: number,
): PendingDecisionRow {
  const d = new Date(NOW)
  d.setUTCDate(d.getUTCDate() - daysAgo)
  return { id, exercise_id: exerciseId, decision, created_at: d.toISOString() }
}

function current(
  exerciseId: string,
  decision: CurrentExerciseState['decision'],
  successRate: number,
): CurrentExerciseState {
  return { exercise_id: exerciseId, decision, success_rate: successRate }
}

function outcome(exerciseId: string, o: AdvanceOutcomeRow['outcome'], daysAgo: number): AdvanceOutcomeRow {
  const d = new Date(NOW)
  d.setUTCDate(d.getUTCDate() - daysAgo)
  return { exercise_id: exerciseId, outcome: o, created_at: d.toISOString() }
}

describe('evaluateDecisions', () => {
  it('skips decisions younger than 7 days', () => {
    const result = evaluateDecisions(
      [pending('1', 'sitt', 'advance', 3)],
      [current('sitt', 'regress', 0.4)],
      NOW,
    )
    expect(result).toEqual([])
  })

  it('marks advance as bad when the exercise has regressed within 14 days', () => {
    const result = evaluateDecisions(
      [pending('1', 'sitt', 'advance', 8)],
      [current('sitt', 'regress', 0.4)],
      NOW,
    )
    expect(result).toEqual([{ id: '1', outcome: 'bad' }])
  })

  it('marks advance as good when the exercise still meets the advance bar', () => {
    const result = evaluateDecisions(
      [pending('1', 'inkallning', 'advance', 9)],
      [current('inkallning', 'advance', 0.85)],
      NOW,
    )
    expect(result).toEqual([{ id: '1', outcome: 'good' }])
  })

  it('marks advance as neutral when the rate is in between', () => {
    const result = evaluateDecisions(
      [pending('1', 'koppel', 'advance', 10)],
      [current('koppel', 'hold', 0.7)],
      NOW,
    )
    expect(result).toEqual([{ id: '1', outcome: 'neutral' }])
  })

  it('marks advance as neutral when the exercise has no current data', () => {
    const result = evaluateDecisions([pending('1', 'plats', 'advance', 9)], [], NOW)
    expect(result).toEqual([{ id: '1', outcome: 'neutral' }])
  })

  it('regress within 14 days counts as bad, but older advances with regress become neutral', () => {
    const result = evaluateDecisions(
      [pending('1', 'sitt', 'advance', 16)],
      [current('sitt', 'regress', 0.4)],
      NOW,
    )
    expect(result).toEqual([{ id: '1', outcome: 'neutral' }])
  })

  it('hold and regress decisions evaluate to neutral', () => {
    const result = evaluateDecisions(
      [pending('1', 'sitt', 'hold', 9), pending('2', 'koppel', 'regress', 9)],
      [current('sitt', 'advance', 0.9), current('koppel', 'regress', 0.3)],
      NOW,
    )
    expect(result).toEqual([
      { id: '1', outcome: 'neutral' },
      { id: '2', outcome: 'neutral' },
    ])
  })
})

describe('computeThresholdAdjustments', () => {
  it('returns previous adjustments untouched without history', () => {
    expect(computeThresholdAdjustments({ sitt: 0.05 }, [])).toEqual({ sitt: 0.05 })
  })

  it('raises the adjustment by 0.05 after two bad advances', () => {
    const result = computeThresholdAdjustments({}, [
      outcome('sitt', 'bad', 1),
      outcome('sitt', 'bad', 8),
      outcome('sitt', 'good', 15),
    ])
    expect(result.sitt).toBeCloseTo(0.05)
  })

  it('caps the adjustment at 0.10', () => {
    const result = computeThresholdAdjustments({ sitt: 0.1 }, [
      outcome('sitt', 'bad', 1),
      outcome('sitt', 'bad', 2),
    ])
    expect(result.sitt).toBeCloseTo(0.1)
  })

  it('resets the adjustment after five consecutive good outcomes', () => {
    const result = computeThresholdAdjustments({ sitt: 0.1 }, [
      outcome('sitt', 'good', 1),
      outcome('sitt', 'good', 2),
      outcome('sitt', 'good', 3),
      outcome('sitt', 'good', 4),
      outcome('sitt', 'good', 5),
      outcome('sitt', 'bad', 20),
    ])
    expect(result.sitt).toBeUndefined()
  })

  it('only considers the 10 most recent outcomes per exercise', () => {
    const old = [outcome('sitt', 'bad', 30), outcome('sitt', 'bad', 31)]
    const recent = Array.from({ length: 10 }, (_, i) => outcome('sitt', 'neutral', i + 1))
    const result = computeThresholdAdjustments({}, [...recent, ...old])
    expect(result.sitt).toBeUndefined()
  })

  it('handles multiple exercises independently', () => {
    const result = computeThresholdAdjustments({}, [
      outcome('sitt', 'bad', 1),
      outcome('sitt', 'bad', 2),
      outcome('koppel', 'good', 1),
    ])
    expect(result.sitt).toBeCloseTo(0.05)
    expect(result.koppel).toBeUndefined()
  })
})
