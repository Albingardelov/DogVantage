import type { LatencyBucket } from '@/types'

export type ProgressionDecision = 'advance' | 'hold' | 'regress'
export type ProgressionHorizon = 'session' | 'week' | 'project'

export const ADVANCE_THRESHOLD = 0.80
export const REGRESS_THRESHOLD = 0.60
export const MAX_ADVANCE_THRESHOLD = 0.90
export const PUPPY_SESSION_ADVANCE_THRESHOLD = 2 / 3

export function horizonMinAttempts(horizon: ProgressionHorizon, isPuppy = false): number {
  if (horizon === 'session') return isPuppy ? 3 : 5
  if (horizon === 'project') return 6
  return 10 // week
}

export function horizonMinSessions(horizon: ProgressionHorizon): number {
  if (horizon === 'week') return 2
  return 1
}

function latencyWeight(bucket: LatencyBucket | null | undefined): number {
  if (bucket === 'lt1s') return 0.05
  if (bucket === 'gt3s') return -0.05
  return 0
}

export interface EvaluateRateInput {
  success: number
  fail: number
  latencyBucket?: LatencyBucket | null
  horizon: ProgressionHorizon
  isPuppy?: boolean
  advanceThresholdDelta?: number
  sessionCount?: number
}

export interface EvaluateRateResult {
  decision: ProgressionDecision
  reason: string
  rate: number
  attempts: number
}

export function evaluateRate(input: EvaluateRateInput): EvaluateRateResult {
  const attempts = input.success + input.fail
  const rate = attempts > 0 ? input.success / attempts : 0
  const minAttempts = horizonMinAttempts(input.horizon, input.isPuppy)
  const minSessions = horizonMinSessions(input.horizon)
  const sessionCount = input.sessionCount ?? 1

  const adjustedRate = rate + latencyWeight(input.latencyBucket)
  const baseAdvanceThreshold =
    input.horizon === 'session' && input.isPuppy
      ? PUPPY_SESSION_ADVANCE_THRESHOLD
      : ADVANCE_THRESHOLD
  const advanceThreshold = Math.min(
    baseAdvanceThreshold + (input.advanceThresholdDelta ?? 0),
    MAX_ADVANCE_THRESHOLD,
  )

  if (sessionCount < minSessions) {
    return {
      decision: 'hold',
      reason: `${sessionCount} pass på nivån — kör minst ${minSessions} pass innan nivåbeslut`,
      rate,
      attempts,
    }
  }
  if (attempts < minAttempts) {
    return {
      decision: 'hold',
      reason: `${attempts} reps — för få datapunkter, håll nuvarande nivå`,
      rate,
      attempts,
    }
  }
  if (adjustedRate >= advanceThreshold) {
    return {
      decision: 'advance',
      reason: `${Math.round(rate * 100)}% lyckade över ${attempts} reps — höj kriteriet ett steg`,
      rate,
      attempts,
    }
  }
  if (adjustedRate <= REGRESS_THRESHOLD) {
    return {
      decision: 'regress',
      reason: `${Math.round(rate * 100)}% lyckade över ${attempts} reps — sänk kriteriet ett steg (≤${Math.round(REGRESS_THRESHOLD * 100)}%)`,
      rate,
      attempts,
    }
  }
  return {
    decision: 'hold',
    reason: `${Math.round(rate * 100)}% lyckade över ${attempts} reps — fortsätt på nuvarande nivå`,
    rate,
    attempts,
  }
}

export interface ProgressionMetricRow {
  exercise_id: string
  date: string
  success_count: number
  fail_count: number
  latency_bucket?: LatencyBucket | null
  criteria_level_id: string | null
}

export interface ProgressionSessionRow {
  exercise_id: string
  criteria_level_id: string | null
  date: string
}

export interface ResolveProgressionStateInput {
  rows: ProgressionMetricRow[]
  exerciseId: string
  criteriaLevelId?: string | null
  horizon: ProgressionHorizon
  now?: Date
  windowDays?: number
  isPuppy?: boolean
  advanceThresholdDelta?: number
  sessionRows?: ProgressionSessionRow[]
}

export interface ResolveProgressionStateResult {
  rungId: string | null
  rate: number
  attempts: number
  decision: ProgressionDecision
  reason: string
}

export function resolveProgressionState(
  input: ResolveProgressionStateInput,
): ResolveProgressionStateResult {
  const windowDays = input.windowDays ?? 7
  const now = input.now ?? new Date()
  const cutoff = new Date(now)
  cutoff.setUTCDate(cutoff.getUTCDate() - windowDays)
  const cutoffStr = cutoff.toISOString().slice(0, 10)

  let success = 0
  let fail = 0
  let latencyScore = 0
  let latencyCount = 0
  const sessionDays = new Set<string>()

  for (const row of input.rows) {
    if (row.date < cutoffStr) continue
    if (row.exercise_id !== input.exerciseId) continue
    if (
      input.criteriaLevelId !== undefined &&
      row.criteria_level_id !== input.criteriaLevelId
    ) {
      continue
    }
    success += row.success_count
    fail += row.fail_count
    if (row.latency_bucket) {
      latencyScore += latencyWeight(row.latency_bucket)
      latencyCount += 1
    }
  }

  for (const row of input.sessionRows ?? []) {
    if (row.date < cutoffStr) continue
    if (row.exercise_id !== input.exerciseId) continue
    if (
      input.criteriaLevelId !== undefined &&
      row.criteria_level_id !== input.criteriaLevelId
    ) {
      continue
    }
    sessionDays.add(row.date)
  }

  let latencyBucket: LatencyBucket | null = null
  if (latencyCount > 0) {
    const avg = latencyScore / latencyCount
    if (avg > 0) latencyBucket = 'lt1s'
    else if (avg < 0) latencyBucket = 'gt3s'
    else latencyBucket = '1to3s'
  }

  const sessionCount =
    input.horizon === 'week'
      ? sessionDays.size
      : Math.max(sessionDays.size, 1)

  const evaluated = evaluateRate({
    success,
    fail,
    latencyBucket,
    horizon: input.horizon,
    isPuppy: input.isPuppy,
    advanceThresholdDelta: input.advanceThresholdDelta,
    sessionCount,
  })

  return {
    rungId: input.criteriaLevelId ?? null,
    rate: evaluated.rate,
    attempts: evaluated.attempts,
    decision: evaluated.decision,
    reason: evaluated.reason,
  }
}
