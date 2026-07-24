import type { WeekPlan } from '@/types'
import type { ExerciseProgressionDecision } from '@/lib/training/progression-rules'
import { allowedExerciseIdsForBreed } from '@/lib/training/allowed-exercises'
import { GOAL_EXERCISE_IDS } from '@/lib/training/goal-exercises'
import { focusExerciseIds } from '@/lib/training/weekly-focus'
import type { WeekPlanInput } from '@/lib/training/week-context'

const DAY_ORDER = ['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag', 'Söndag']
const OBEDIENCE_WITH_FRI = new Set(['sitt', 'ligg', 'stanna', 'plats'])
const REACTIVE_CALM_ONLY = new Set(['namn', 'hantering', 'fokus', 'plats', 'fri', 'marker'])

export type WeekPlanViolationCode =
  | 'day_count'
  | 'day_order'
  | 'rest_count'
  | 'rest_has_exercises'
  | 'exercise_count_per_day'
  | 'exercise_not_allowed'
  | 'exercise_reps_invalid'
  | 'missing_fri_pairing'
  | 'progression_regress_mismatch'
  | 'progression_advance_mismatch'
  | 'exercise_repetition_limit'
  | 'reactive_missing_lat'
  | 'reactive_day_after_lat_not_calm'

export interface WeekPlanViolation {
  code: WeekPlanViolationCode
  message: string
}

export interface WeekPlanValidationResult {
  ok: boolean
  violations: WeekPlanViolation[]
  reasons: string[]
}

export function validateWeekPlan(
  plan: WeekPlan,
  input: WeekPlanInput,
  decisions: ExerciseProgressionDecision[],
): WeekPlanValidationResult {
  const violations: WeekPlanViolation[] = []
  const pushViolation = (code: WeekPlanViolationCode, message: string) => {
    violations.push({ code, message })
  }

  if (plan.days.length !== 7) pushViolation('day_count', 'Plan must contain exactly 7 days')
  for (let i = 0; i < Math.min(plan.days.length, DAY_ORDER.length); i++) {
    if (plan.days[i]?.day !== DAY_ORDER[i]) pushViolation('day_order', `Day ${i + 1} should be ${DAY_ORDER[i]}`)
  }

  const restDays = plan.days.filter((day) => day.rest).length
  if (restDays < 1 || restDays > 2) pushViolation('rest_count', 'Plan must include 1-2 rest days')

  const allowedIds = allowedExerciseSet(input)
  const usage = new Map<string, number>()
  const decisionMap = new Map(decisions.map((d) => [d.exercise_id, d.decision] as const))
  const latDayIndexes: number[] = []

  for (let idx = 0; idx < plan.days.length; idx++) {
    const day = plan.days[idx]
    if (day.rest) {
      if (day.exercises && day.exercises.length > 0) pushViolation('rest_has_exercises', `Rest day ${day.day} should not include exercises`)
      continue
    }

    const exercises = day.exercises ?? []
    if (exercises.length < 2 || exercises.length > 3) pushViolation('exercise_count_per_day', `Training day ${day.day} should have 2-3 exercises`)
    let needsFri = false
    let hasFri = false
    for (const exercise of exercises) {
      if (!allowedIds.has(exercise.id)) pushViolation('exercise_not_allowed', `Exercise ${exercise.id} is not allowed`)
      usage.set(exercise.id, (usage.get(exercise.id) ?? 0) + 1)
      if (exercise.id === 'lat') latDayIndexes.push(idx)
      if (exercise.reps < 1 || exercise.reps > 5) pushViolation('exercise_reps_invalid', `Exercise ${exercise.id} has invalid reps`)
      if (OBEDIENCE_WITH_FRI.has(exercise.id)) needsFri = true
      if (exercise.id === 'fri') hasFri = true

      const decision = decisionMap.get(exercise.id)
      if (decision === 'regress' && !/\blätt|sänk|backa|kortare\b/i.test(exercise.desc)) {
        pushViolation('progression_regress_mismatch', `Exercise ${exercise.id} should describe regression`)
      }
      if (decision === 'advance' && !/\bhöj|öka|svårare\b/i.test(exercise.desc)) {
        pushViolation('progression_advance_mismatch', `Exercise ${exercise.id} should describe progression`)
      }
    }
    if (needsFri && !hasFri) pushViolation('missing_fri_pairing', `Day ${day.day} requires fri when obedience exercises are present`)
  }

  // Projektets primärövning har medveten dispens från variationsregeln —
  // den tränas som dagligt mikropass när ett projekt är aktivt.
  const projectPrimary = input.project?.primaryExerciseId ?? null
  for (const [id, count] of usage.entries()) {
    if (count > 2 && id !== projectPrimary) {
      pushViolation('exercise_repetition_limit', `Exercise ${id} appears too many times (${count})`)
    }
  }

  if (input.isReactive) {
    if (latDayIndexes.length < 2) pushViolation('reactive_missing_lat', 'Reactive plan must include LAT on at least 2 training days')
    for (const dayIndex of latDayIndexes) {
      const next = plan.days[dayIndex + 1]
      if (!next) continue
      if (next.rest) continue
      const nextExercises = next.exercises ?? []
      const hasUnsafeExercise = nextExercises.some((exercise) => !REACTIVE_CALM_ONLY.has(exercise.id))
      if (hasUnsafeExercise) {
        pushViolation('reactive_day_after_lat_not_calm', `Day after LAT (${next.day}) must be rest or calm-only exercises`)
      }
    }
  }

  return { ok: violations.length === 0, violations, reasons: violations.map((v) => v.message) }
}

function allowedExerciseSet(input: WeekPlanInput): Set<string> {
  const breedIds = allowedExerciseIdsForBreed(input.breed, input.ageWeeks)
  const goalIds = (input.goals ?? []).flatMap((goal) => GOAL_EXERCISE_IDS[goal] ?? [])
  const focusIds = focusExerciseIds(input.weeklyFocus ?? [])
  const priorityIds = input.priorityExercises ?? []
  const projectIds = input.project
    ? [input.project.primaryExerciseId, ...input.project.supportExerciseIds]
    : []
  const customIds = (input.customExercises ?? []).map((item) => item.exercise_id)
  const reactiveIds = input.isReactive
    ? ['lat']
    : []
  return new Set([...breedIds, ...goalIds, ...focusIds, ...priorityIds, ...projectIds, ...customIds, ...reactiveIds])
}
