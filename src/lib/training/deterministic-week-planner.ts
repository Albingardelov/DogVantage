import type { DayPlan, Exercise, WeekPlan } from '@/types'
import { GOAL_EXERCISE_IDS } from '@/lib/training/goal-exercises'
import { focusExerciseIds } from '@/lib/training/weekly-focus'
import { allowedExerciseIdsForBreed } from '@/lib/training/allowed-exercises'
import { getExerciseSpec } from '@/lib/training/exercise-specs'
import { exerciseLabel } from '@/lib/training/exercise-label'
import type { WeekPlanInput } from '@/lib/training/week-context'
import type { ExerciseProgressionDecision } from '@/lib/training/progression-rules'

const DAYS = ['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag', 'Söndag']
const REST_DAY_INDEXES = new Set([1, 4]) // Tue + Fri
const REACTIVE_EXERCISE_IDS = new Set(['lat'])
const OBEDIENCE_REQUIRING_RELEASE = new Set(['sitt', 'ligg', 'stanna', 'plats'])
const CALM_REACTIVE_EXERCISES = new Set(['namn', 'hantering', 'fokus', 'plats', 'fri', 'marker'])

type ProgressionByExercise = Map<string, ExerciseProgressionDecision['decision']>

export interface DeterministicWeekPlanResult {
  plan: WeekPlan
  allowedIds: Set<string>
}

export function buildDeterministicWeekPlan(input: WeekPlanInput): DeterministicWeekPlanResult {
  const allowedSet = resolveAllowedExerciseIds(input)
  const isReactive = Boolean(input.isReactive)
  const progressionMap = buildProgressionMap(input.progressionDecisions ?? [])
  const prioritySet = new Set(input.priorityExercises ?? [])
  const goalSet = new Set((input.goals ?? []).flatMap((g) => GOAL_EXERCISE_IDS[g] ?? []))
  const focusSet = new Set(focusExerciseIds(input.weeklyFocus ?? []))
  const customLabels = new Map((input.customExercises ?? []).map((item) => [item.exercise_id, item.label]))
  const weeklyUsage = new Map<string, number>()
  let latDaysUsed = 0
  let previousDayHadLat = false

  const trainingDayIndexes = DAYS
    .map((_, idx) => idx)
    .filter((idx) => !REST_DAY_INDEXES.has(idx))

  const days: DayPlan[] = DAYS.map((day, idx) => {
    if (REST_DAY_INDEXES.has(idx)) {
      previousDayHadLat = false
      return { day, rest: true }
    }
    const trainingDayPosition = trainingDayIndexes.indexOf(idx)
    const trainingDaysRemaining = trainingDayIndexes.length - trainingDayPosition
    const neededLatDays = Math.max(0, 2 - latDaysUsed)
    const mustForceLat = isReactive && !previousDayHadLat && neededLatDays >= trainingDaysRemaining
    const calmOnly = isReactive && previousDayHadLat
    const exercises = pickExercisesForDay({
      allowedSet,
      weeklyUsage,
      progressionMap,
      prioritySet,
      goalSet,
      focusSet,
      customLabels,
      isReactive,
      calmOnly,
      forceLat: mustForceLat || (isReactive && latDaysUsed < 2 && idx === trainingDayIndexes[0]),
    })
    const hasLat = exercises.some((exercise) => exercise.id === 'lat')
    if (hasLat) latDaysUsed += 1
    previousDayHadLat = hasLat
    return { day, rest: false, exercises }
  })

  return {
    plan: { days },
    allowedIds: allowedSet,
  }
}

function resolveAllowedExerciseIds(input: WeekPlanInput): Set<string> {
  const breedIds = allowedExerciseIdsForBreed(input.breed, input.ageWeeks)
  const goalIds = (input.goals ?? []).flatMap((g) => GOAL_EXERCISE_IDS[g] ?? [])
  const focusIds = focusExerciseIds(input.weeklyFocus ?? [])
  const priorityIds = input.priorityExercises ?? []
  const customIds = (input.customExercises ?? []).map((exercise) => exercise.exercise_id)
  const reactiveIds = input.isReactive
    ? ['lat']
    : []
  return new Set([...breedIds, ...goalIds, ...focusIds, ...priorityIds, ...customIds, ...reactiveIds])
}

function buildProgressionMap(decisions: ExerciseProgressionDecision[]): ProgressionByExercise {
  const map = new Map<string, ExerciseProgressionDecision['decision']>()
  for (const decision of decisions) {
    if (!map.has(decision.exercise_id) || decision.decision === 'regress') {
      map.set(decision.exercise_id, decision.decision)
    }
  }
  return map
}

interface PickCtx {
  allowedSet: Set<string>
  weeklyUsage: Map<string, number>
  progressionMap: ProgressionByExercise
  prioritySet: Set<string>
  goalSet: Set<string>
  focusSet: Set<string>
  customLabels: Map<string, string>
  isReactive: boolean
  calmOnly: boolean
  forceLat: boolean
}

function pickExercisesForDay(ctx: PickCtx): Exercise[] {
  const selected: Exercise[] = []
  const selectedIds = new Set<string>()
  const candidates = [...ctx.allowedSet]
    .filter((id) => !ctx.calmOnly || CALM_REACTIVE_EXERCISES.has(id))
    .sort((a, b) => scoreExercise(b, ctx) - scoreExercise(a, ctx))

  if (ctx.forceLat && ctx.allowedSet.has('lat')) {
    selected.push(toExercise('lat', ctx))
    selectedIds.add('lat')
    ctx.weeklyUsage.set('lat', (ctx.weeklyUsage.get('lat') ?? 0) + 1)
  }

  for (const id of candidates) {
    if (selected.length >= 2) break
    if ((ctx.weeklyUsage.get(id) ?? 0) >= 2) continue
    if (selectedIds.has(id)) continue
    if (id === 'fri') continue
    if (ctx.calmOnly && !CALM_REACTIVE_EXERCISES.has(id)) continue
    selected.push(toExercise(id, ctx))
    selectedIds.add(id)
    ctx.weeklyUsage.set(id, (ctx.weeklyUsage.get(id) ?? 0) + 1)
  }

  if (selected.length === 0) {
    selected.push(toExercise('namn', ctx))
  }

  if (selected.some((exercise) => OBEDIENCE_REQUIRING_RELEASE.has(exercise.id)) && !selectedIds.has('fri') && ctx.allowedSet.has('fri')) {
    selected.push(toExercise('fri', ctx))
  }

  return selected.slice(0, 3)
}

function scoreExercise(id: string, ctx: PickCtx): number {
  let score = 0
  if (ctx.prioritySet.has(id)) score += 120
  if (ctx.focusSet.has(id)) score += 70
  if (ctx.goalSet.has(id)) score += 40
  const decision = ctx.progressionMap.get(id)
  if (decision === 'regress') score += 90
  if (decision === 'advance') score += 30
  if (decision === 'hold') score += 20
  if (ctx.isReactive && REACTIVE_EXERCISE_IDS.has(id)) score += 80
  score += 10 - (ctx.weeklyUsage.get(id) ?? 0) * 5
  return score
}

function toExercise(id: string, ctx: PickCtx): Exercise {
  const spec = getExerciseSpec(id)
  const label = ctx.customLabels.get(id) ?? exerciseLabel(id)
  const decision = ctx.progressionMap.get(id) ?? 'hold'
  return {
    id,
    label,
    desc: explanationForDecision(spec, decision),
    reps: decision === 'regress' ? 2 : decision === 'advance' ? 4 : 3,
  }
}

function explanationForDecision(
  spec: ReturnType<typeof getExerciseSpec>,
  decision: ExerciseProgressionDecision['decision'],
): string {
  const base = spec?.ladder[0]?.criteria ?? 'Korta reps med hög belöning'
  if (decision === 'regress') return `Lättare idag: ${base}`.slice(0, 120)
  if (decision === 'advance') return `Höj ett steg om stabilt: ${base}`.slice(0, 120)
  return `Håll nivån stabilt: ${base}`.slice(0, 120)
}
