import type { SessionLog } from '@/types'
import type { PuppyZone } from '@/lib/training/puppy-zone'
import { inferEnvironment, type SkillEnvironment } from '@/lib/training/skill-progress'
import { statsFor } from '@/lib/training/handler-feedback'

export interface DogStateMetricRow {
  exercise_id: string
  date: string
  success_count: number
  fail_count: number
  criteria_level_id: string | null
}

export interface DogStateExerciseStat {
  exerciseId: string
  successRate: number
  attempts: number
}

export interface DogStateEnvExerciseStat {
  exerciseId: string
  environment: SkillEnvironment
  successRate: number
  attempts: number
}

export interface DogStatePayload {
  version: 1
  weakExercises: DogStateExerciseStat[]
  strongExercises: DogStateExerciseStat[]
  environmentDifficulty: Partial<Record<SkillEnvironment, number>>
  environmentByExercise?: DogStateEnvExerciseStat[]
  handler: {
    timing: number | null
    consistency: number | null
    reading: number | null
    sampleSize: number
  }
  zoneSummary: { greenDays: number; yellowDays: number; redDays: number; window: 14 }
  thresholdAdjustments: Record<string, number>
}

export interface DogStateInputs {
  /** daily_exercise_metrics-rader, senaste 28 dagarna */
  metrics: DogStateMetricRow[]
  /** session_logs, 10 senaste */
  sessionLogs: SessionLog[]
  /** daily_check_ins som datum → zon, senaste 14 dagarna */
  checkIns: Record<string, PuppyZone>
}

const MIN_ATTEMPTS = 10
const WEAK_THRESHOLD = 0.6
const STRONG_THRESHOLD = 0.8
const MAX_LISTED = 3
const MIN_ENV_ATTEMPTS = 8

export function computeDogState(inputs: DogStateInputs): DogStatePayload {
  const byExercise = new Map<string, { success: number; attempts: number }>()
  const byEnvironment = new Map<SkillEnvironment, { success: number; attempts: number }>()
  const byExerciseEnv = new Map<string, { exerciseId: string; environment: SkillEnvironment; success: number; attempts: number }>()

  for (const row of inputs.metrics) {
    const attempts = row.success_count + row.fail_count
    if (attempts === 0) continue

    const ex = byExercise.get(row.exercise_id) ?? { success: 0, attempts: 0 }
    ex.success += row.success_count
    ex.attempts += attempts
    byExercise.set(row.exercise_id, ex)

    const env = inferEnvironment(row.criteria_level_id)
    const envAgg = byEnvironment.get(env) ?? { success: 0, attempts: 0 }
    envAgg.success += row.success_count
    envAgg.attempts += attempts
    byEnvironment.set(env, envAgg)

    const pairKey = `${row.exercise_id}|${env}`
    const pair = byExerciseEnv.get(pairKey) ?? { exerciseId: row.exercise_id, environment: env, success: 0, attempts: 0 }
    pair.success += row.success_count
    pair.attempts += attempts
    byExerciseEnv.set(pairKey, pair)
  }

  const rated: DogStateExerciseStat[] = [...byExercise.entries()]
    .filter(([, agg]) => agg.attempts >= MIN_ATTEMPTS)
    .map(([exerciseId, agg]) => ({
      exerciseId,
      successRate: agg.success / agg.attempts,
      attempts: agg.attempts,
    }))

  const weakExercises = rated
    .filter((e) => e.successRate <= WEAK_THRESHOLD)
    .sort((a, b) => a.successRate - b.successRate)
    .slice(0, MAX_LISTED)

  const strongExercises = rated
    .filter((e) => e.successRate >= STRONG_THRESHOLD)
    .sort((a, b) => b.successRate - a.successRate)
    .slice(0, MAX_LISTED)

  const environmentDifficulty: Partial<Record<SkillEnvironment, number>> = {}
  for (const [env, agg] of byEnvironment) {
    environmentDifficulty[env] = agg.success / agg.attempts
  }

  const timing = statsFor(inputs.sessionLogs, (l) => l.handler_timing)
  const consistency = statsFor(inputs.sessionLogs, (l) => l.handler_consistency)
  const reading = statsFor(inputs.sessionLogs, (l) => l.handler_reading)

  let greenDays = 0
  let yellowDays = 0
  let redDays = 0
  for (const zone of Object.values(inputs.checkIns)) {
    if (zone === 'green') greenDays += 1
    else if (zone === 'yellow') yellowDays += 1
    else if (zone === 'red') redDays += 1
  }

  const environmentByExercise: DogStateEnvExerciseStat[] = [...byExerciseEnv.values()]
    .filter((e) => e.attempts >= MIN_ENV_ATTEMPTS)
    .map((e) => ({
      exerciseId: e.exerciseId,
      environment: e.environment,
      successRate: e.success / e.attempts,
      attempts: e.attempts,
    }))
    .sort((a, b) => a.exerciseId.localeCompare(b.exerciseId) || a.environment.localeCompare(b.environment))

  return {
    version: 1,
    weakExercises,
    strongExercises,
    environmentDifficulty,
    environmentByExercise,
    handler: {
      timing: timing?.avg ?? null,
      consistency: consistency?.avg ?? null,
      reading: reading?.avg ?? null,
      sampleSize: inputs.sessionLogs.length,
    },
    zoneSummary: { greenDays, yellowDays, redDays, window: 14 },
    thresholdAdjustments: {},
  }
}
