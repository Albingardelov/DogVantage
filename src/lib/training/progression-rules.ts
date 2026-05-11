/**
 * Deterministic progression rules — replaces "prompt-prayer".
 *
 * Given recent `daily_exercise_metrics` rows for a dog, decide whether each
 * exercise should advance to the next criteria rung, hold the current rung,
 * or regress to an easier one. These decisions are then injected as hard
 * rules into the AI prompt rather than left to the model to infer from prose.
 *
 * Thresholds follow the R+ convention used in the existing exercise specs:
 *   - ≥ 80% success rate → advance
 *   - ≤ 60% success rate → regress
 *   - in between → hold
 *
 * Latency is treated as a tiebreaker: fast latency on a borderline rate
 * pushes toward advance, slow latency pushes toward regress.
 */

import type { LatencyBucket } from '@/types'

export interface ProgressionMetricRow {
  exercise_id: string
  date: string
  success_count: number
  fail_count: number
  latency_bucket: LatencyBucket | null
  criteria_level_id: string | null
}

export type ProgressionDecision = 'advance' | 'hold' | 'regress'

export interface ExerciseProgressionDecision {
  exercise_id: string
  criteria_level_id: string | null
  decision: ProgressionDecision
  attempts: number
  success_rate: number
  reason: string
}

const MIN_ATTEMPTS = 10
const ADVANCE_THRESHOLD = 0.80
const REGRESS_THRESHOLD = 0.60

function latencyWeight(bucket: LatencyBucket | null): number {
  if (bucket === 'lt1s') return 0.05
  if (bucket === 'gt3s') return -0.05
  return 0
}

/**
 * Aggregate metric rows by (exercise_id, criteria_level_id) over the window
 * and compute a deterministic decision per exercise.
 *
 * Only rows from `windowDays` back from `now` count. Dates that are
 * lexicographically >= cutoff (YYYY-MM-DD) are kept — same convention as
 * the rest of the codebase.
 */
export function computeProgressionDecisions(
  rows: ProgressionMetricRow[],
  options: { windowDays?: number; now?: Date } = {},
): ExerciseProgressionDecision[] {
  const windowDays = options.windowDays ?? 7
  const now = options.now ?? new Date()
  const cutoff = new Date(now)
  cutoff.setUTCDate(cutoff.getUTCDate() - windowDays)
  const cutoffStr = cutoff.toISOString().slice(0, 10)

  // Group by exercise_id; track the latest criteria_level_id within the
  // window so the decision refers to the rung the dog is actually working on.
  type Accum = {
    success: number
    fail: number
    latencyScore: number
    latencyCount: number
    latestDate: string
    latestCriteriaId: string | null
  }
  const byExercise: Record<string, Accum> = {}

  for (const row of rows) {
    if (row.date < cutoffStr) continue
    const acc = byExercise[row.exercise_id] ??= {
      success: 0,
      fail: 0,
      latencyScore: 0,
      latencyCount: 0,
      latestDate: '',
      latestCriteriaId: null,
    }
    acc.success += row.success_count
    acc.fail += row.fail_count
    if (row.latency_bucket) {
      acc.latencyScore += latencyWeight(row.latency_bucket)
      acc.latencyCount += 1
    }
    if (row.criteria_level_id && row.date >= acc.latestDate) {
      acc.latestDate = row.date
      acc.latestCriteriaId = row.criteria_level_id
    }
  }

  const decisions: ExerciseProgressionDecision[] = []
  for (const [exerciseId, acc] of Object.entries(byExercise)) {
    const attempts = acc.success + acc.fail
    if (attempts === 0) continue

    const rawRate = acc.success / attempts
    const latencyAdjust = acc.latencyCount > 0 ? acc.latencyScore / acc.latencyCount : 0
    const adjustedRate = rawRate + latencyAdjust

    let decision: ProgressionDecision
    let reason: string
    if (attempts < MIN_ATTEMPTS) {
      decision = 'hold'
      reason = `${attempts} reps på fönstret — för få datapunkter, håll nuvarande nivå`
    } else if (adjustedRate >= ADVANCE_THRESHOLD) {
      decision = 'advance'
      reason = `${Math.round(rawRate * 100)}% lyckade över ${attempts} reps — höj kriteriet ett steg`
    } else if (adjustedRate <= REGRESS_THRESHOLD) {
      decision = 'regress'
      reason = `${Math.round(rawRate * 100)}% lyckade över ${attempts} reps — sänk kriteriet ett steg`
    } else {
      decision = 'hold'
      reason = `${Math.round(rawRate * 100)}% lyckade över ${attempts} reps — fortsätt på nuvarande nivå`
    }

    decisions.push({
      exercise_id: exerciseId,
      criteria_level_id: acc.latestCriteriaId,
      decision,
      attempts,
      success_rate: rawRate,
      reason,
    })
  }

  // Sort: regressions first (most urgent), then advances, then holds.
  // Within each group, more attempts ranked higher.
  const order: Record<ProgressionDecision, number> = { regress: 0, advance: 1, hold: 2 }
  decisions.sort((a, b) => {
    if (order[a.decision] !== order[b.decision]) return order[a.decision] - order[b.decision]
    return b.attempts - a.attempts
  })

  return decisions
}

/**
 * Format the decisions as a prompt section the AI can act on as a hard rule.
 * Returns null if there are no actionable decisions.
 */
export function formatProgressionRule(
  decisions: ExerciseProgressionDecision[],
  exerciseLabels: Record<string, string> = {},
): string | null {
  const actionable = decisions.filter((d) => d.decision !== 'hold')
  if (actionable.length === 0) return null

  const lines = actionable.map((d) => {
    const label = exerciseLabels[d.exercise_id] ?? d.exercise_id
    const rung = d.criteria_level_id ? ` (rung "${d.criteria_level_id}")` : ''
    const verb = d.decision === 'advance' ? 'HÖJ' : 'SÄNK'
    return `- ${label}${rung}: ${verb} kriteriet — ${d.reason}`
  })

  return `Progression (deterministisk, baserad på loggade reps senaste 7 dagarna):\n${lines.join('\n')}\nFölj dessa beslut i desc-fältet ("öka avstånd", "tillbaka till lättare nivå", etc.).`
}
