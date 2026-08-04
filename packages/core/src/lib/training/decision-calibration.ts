export interface PendingDecisionRow {
  id: string
  exercise_id: string
  decision: 'advance' | 'hold' | 'regress'
  created_at: string
}

export interface CurrentExerciseState {
  exercise_id: string
  decision: 'advance' | 'hold' | 'regress'
  success_rate: number
}

export type DecisionOutcome = 'good' | 'bad' | 'neutral'

export interface DecisionEvaluation {
  id: string
  outcome: DecisionOutcome
}

export interface AdvanceOutcomeRow {
  exercise_id: string
  outcome: DecisionOutcome
  created_at: string
}

const EVAL_MIN_AGE_DAYS = 7
const ATTRIBUTION_WINDOW_DAYS = 14
const ADVANCE_THRESHOLD = 0.8
const ADJUSTMENT_STEP = 0.05
const MAX_ADJUSTMENT = 0.1
const BAD_COUNT_FOR_RAISE = 2
const GOOD_STREAK_FOR_RESET = 5
const HISTORY_WINDOW = 10

function ageInDays(createdAt: string, now: Date): number {
  return (now.getTime() - new Date(createdAt).getTime()) / 86_400_000
}

export function evaluateDecisions(
  pending: PendingDecisionRow[],
  current: CurrentExerciseState[],
  now: Date = new Date(),
): DecisionEvaluation[] {
  const byExercise = new Map(current.map((c) => [c.exercise_id, c]))
  const evaluations: DecisionEvaluation[] = []

  for (const row of pending) {
    const age = ageInDays(row.created_at, now)
    if (age < EVAL_MIN_AGE_DAYS) continue

    if (row.decision !== 'advance') {
      evaluations.push({ id: row.id, outcome: 'neutral' })
      continue
    }

    const state = byExercise.get(row.exercise_id)
    if (!state) {
      evaluations.push({ id: row.id, outcome: 'neutral' })
      continue
    }
    if (state.decision === 'regress' && age <= ATTRIBUTION_WINDOW_DAYS) {
      evaluations.push({ id: row.id, outcome: 'bad' })
      continue
    }
    if (state.decision !== 'regress' && state.success_rate >= ADVANCE_THRESHOLD) {
      evaluations.push({ id: row.id, outcome: 'good' })
      continue
    }
    evaluations.push({ id: row.id, outcome: 'neutral' })
  }

  return evaluations
}

export function computeThresholdAdjustments(
  previous: Record<string, number>,
  history: AdvanceOutcomeRow[],
): Record<string, number> {
  const byExercise = new Map<string, AdvanceOutcomeRow[]>()
  for (const row of history) {
    const list = byExercise.get(row.exercise_id) ?? []
    list.push(row)
    byExercise.set(row.exercise_id, list)
  }

  const result: Record<string, number> = { ...previous }

  for (const [exerciseId, rows] of byExercise) {
    const recent = rows
      .slice()
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, HISTORY_WINDOW)

    const goodStreak = recent.findIndex((r) => r.outcome !== 'good')
    const consecutiveGood = goodStreak === -1 ? recent.length : goodStreak
    if (consecutiveGood >= GOOD_STREAK_FOR_RESET) {
      delete result[exerciseId]
      continue
    }

    const badCount = recent.filter((r) => r.outcome === 'bad').length
    if (badCount >= BAD_COUNT_FOR_RAISE) {
      result[exerciseId] = Math.min((previous[exerciseId] ?? 0) + ADJUSTMENT_STEP, MAX_ADJUSTMENT)
    }
  }

  return result
}
