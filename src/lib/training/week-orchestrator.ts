import { NextRequest } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import {
  type Breed,
  type CastrationStatus,
  type DogSex,
  type HouseholdPet,
  type TrainingEnvironment,
  type RewardPreference,
  type TrainingGoal,
  type WeekPlan,
  type ExerciseSummary,
} from '@/types'
import { isGoal } from '@/types/dog'
import { isValidBreed } from '@/lib/breeds/registry'
import { getBehaviorContextPayloadFromDb } from '@/lib/dog/build-behavior-context'
import { householdPetNotes, HOUSEHOLD_PET_LABELS } from '@/lib/dog/behavior'
import { detectBehaviorEmergency, behaviorResponse } from '@/lib/ai/safety-guards'
import { DEFAULT_LOCALE } from '@/i18n/config'
import { getRecentLogs, formatLogsForPrompt } from '@/lib/supabase/session-logs'
import { getActiveCustomExercises } from '@/lib/supabase/custom-exercises'
import { currentIsoWeek, type WeeklyFocusArea } from '@/lib/training/weekly-focus'
import { getWeeklyFocusPreferences } from '@/lib/supabase/weekly-focus'
import { getActiveHeatCycle, getLastEndedHeatCycle, isSkenfasActive } from '@/lib/supabase/heat-cycles'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import { computeProgressionDecisions, formatProgressionRule, type ProgressionMetricRow } from '@/lib/training/progression-rules'
import { computeHandlerStruggle, dampAdvances, type HandlerStruggle } from '@/lib/training/handler-state'
import { getDogState, updateThresholdAdjustments } from '@/lib/supabase/dog-state'
import { evaluateDecisions, computeThresholdAdjustments } from '@/lib/training/decision-calibration'
import {
  getPendingDecisions,
  getRecentAdvanceOutcomes,
  logProgressionDecisions,
  markDecisionsEvaluated,
} from '@/lib/supabase/progression-decision-log'
import { getRecentQuizStats } from '@/lib/supabase/learning-progress'
import { getRecentChatTopics } from '@/lib/supabase/chat-topics'
import { getHomecomeWeekPlan } from '@/lib/training/homecoming-plan'
import { generateWeekPlan, PLAN_VERSION } from '@/lib/ai/week-plan'
import { buildDeterministicWeekPlan } from '@/lib/training/deterministic-week-planner'
import type { WeekPlanInput } from '@/lib/training/week-context'
import { getCachedWeekPlan, setCachedWeekPlan } from '@/lib/supabase/training-cache'
import { tryAcquireGenerationLock, releaseGenerationLock } from '@/lib/supabase/generation-lock'
import { trackTelemetry } from '@/lib/telemetry'

const ENV_LABELS: Record<TrainingEnvironment, string> = {
  city: 'Stad (mycket folk och hundar)',
  suburb: 'Förort / blandat',
  rural: 'Land / natur',
}

const REWARD_LABELS: Record<RewardPreference, string> = {
  food: 'Mat',
  toy: 'Leksak',
  social: 'Socialt (beröm/lek)',
  mixed: 'Blandat',
}

const VALID_PETS = ['cats_indoor', 'cats_outdoor', 'dogs', 'small_animals', 'livestock'] as const

type DogAuthContext = { id: string; breed: string; user_id: string }

export class BehaviorEmergencyError extends Error {
  referral: string
  constructor(referral: string) {
    super('behavior_referral')
    this.referral = referral
  }
}

export interface WeekOrchestratorContext {
  input: WeekPlanInput
  breed: Breed
  trainingWeek: number
  ageWeeks?: number
  goals?: TrainingGoal[]
  cacheKey?: string
  dogId: string
  onboardingContext?: string
  customIds: string[]
  focusAreas: WeeklyFocusArea[]
  priorityExercises: string[]
  isHomecomeWeek: boolean
  hasCats: boolean
}

export async function buildWeekContextFromRequest(
  req: NextRequest,
  dog: DogAuthContext,
  supabase: SupabaseClient<Database>,
): Promise<WeekOrchestratorContext> {
  const p = req.nextUrl.searchParams
  const breed = dog.breed as Breed
  const requestedBreed = p.get('breed')
  const weekStr = p.get('week')
  const trainingWeek = weekStr ? Number(weekStr) : NaN
  const ageWeeksStr = p.get('ageWeeks')
  const parsedAgeWeeks = ageWeeksStr != null ? Number(ageWeeksStr) : undefined
  const ageWeeks = typeof parsedAgeWeeks === 'number' && Number.isFinite(parsedAgeWeeks)
    ? parsedAgeWeeks
    : undefined
  const goalsStr = p.get('goals')
  const goals = goalsStr ? goalsStr.split(',').filter((g): g is TrainingGoal => isGoal(g)) : undefined
  if (Number.isNaN(trainingWeek)) {
    throw new Error('week required')
  }
  if (!isValidBreed(breed)) {
    throw new Error('invalid dog breed profile')
  }
  if (requestedBreed && requestedBreed !== breed) {
    console.warn(`[GET /api/training/week] ignored mismatched breed query="${requestedBreed}" for dog=${dog.id}`)
  }

  const pets = parsePets(p)
  const { data: dogProfile } = await supabase
    .from('dog_profiles')
    .select('sex, castration_status')
    .eq('id', dog.id)
    .single()
  const dogSex = (dogProfile as { sex: string | null } | null)?.sex as DogSex | undefined ?? undefined
  const castrationStatus = (dogProfile as { castration_status: string | null } | null)?.castration_status as CastrationStatus | undefined ?? undefined
  const behaviorPayload = await getBehaviorContextPayloadFromDb(supabase, dog.id)
  const serverBehaviorContext = behaviorPayload.context
  const behaviorProfile = behaviorPayload.behaviorProfile
  const isReactiveProfile = Boolean(
    behaviorProfile && (
      behaviorProfile.leashBehavior === 'pulls_hard_reactive' ||
      behaviorProfile.newEnvironmentReaction === 'avoidant' ||
      behaviorProfile.triggers.length > 0
    ),
  )
  const baseOnboardingContext = buildOnboardingContext(p, pets, serverBehaviorContext)
  if (detectBehaviorEmergency(baseOnboardingContext)) {
    throw new BehaviorEmergencyError(behaviorResponse(DEFAULT_LOCALE).content)
  }

  const isoWeek = currentIsoWeek()
  const needsHeatData = dogSex === 'female' && castrationStatus === 'intact'
  const sevenDaysAgo = (() => {
    const d = new Date()
    d.setUTCDate(d.getUTCDate() - 7)
    return d.toISOString().slice(0, 10)
  })()

  const sevenDaysAgoIso = `${sevenDaysAgo}T00:00:00Z`

  const [recentLogs, customRows, weeklyPrefs, activeHeat, lastEnded, recentMetrics, recentSessions] = await Promise.all([
    getRecentLogs(dog.id, trainingWeek, 3).catch(() => []),
    getActiveCustomExercises(dog.id).catch(() => []),
    getWeeklyFocusPreferences(dog.id, isoWeek).catch(() => ({ areas: [], priorityExerciseIds: [] })),
    needsHeatData ? getActiveHeatCycle(dog.id).catch(() => null) : Promise.resolve(null),
    needsHeatData ? getLastEndedHeatCycle(dog.id).catch(() => null) : Promise.resolve(null),
    (async (): Promise<ProgressionMetricRow[]> => {
      try {
        const { data } = await getSupabaseAdmin()
          .from('daily_exercise_metrics')
          .select('exercise_id, date, success_count, fail_count, latency_bucket, criteria_level_id')
          .eq('dog_id', dog.id)
          .gte('date', sevenDaysAgo)
        return (data ?? []) as ProgressionMetricRow[]
      } catch {
        return []
      }
    })(),
    (async () => {
      try {
        const { data } = await supabase
          .from('session_logs')
          .select('created_at, exercises')
          .eq('dog_id', dog.id)
          .gte('created_at', sevenDaysAgoIso)
          .order('created_at', { ascending: false })
          .limit(80)
        return data ?? []
      } catch {
        return []
      }
    })(),
  ])

  const isInHeat = Boolean(activeHeat)
  const skenfasActive = isSkenfasActive(lastEnded)
  const sexLines: string[] = []
  if (dogSex) sexLines.push(`Kön: ${dogSex === 'female' ? 'Tik' : 'Hane'}`)
  if (castrationStatus) sexLines.push(`Kastration: ${castrationStatus === 'intact' ? 'Intakt' : castrationStatus === 'castrated' ? 'Kastrerad' : 'Okänt'}`)
  if (isInHeat) sexLines.push('Status: Löper just nu')
  if (skenfasActive) sexLines.push('Status: Skenfas-fönster aktivt (6–9 v efter löp)')
  const recentTopics = await getRecentChatTopics(dog.id).catch(() => [] as string[])
  const topicLine = recentTopics.length > 0
    ? `Föraren har nyligen frågat AI-coachen om: ${recentTopics.join(', ')}`
    : null
  const onboardingContext = [baseOnboardingContext, sexLines.length > 0 ? sexLines.join('\n') : null, topicLine]
    .filter(Boolean)
    .join('\n')

  const performanceSummary = formatPerformanceSummary(formatLogsForPrompt(recentLogs))
  const customExercises = customRows.map((r: { exercise_id: string; label: string }) => ({
    exercise_id: r.exercise_id,
    label: r.label,
  }))
  const sessionRows = recentSessions.flatMap((session) => {
    const createdAt = (session as { created_at?: string | null }).created_at
    if (!createdAt) return []
    const date = createdAt.slice(0, 10)
    const exercises = ((session as { exercises?: ExerciseSummary[] | null }).exercises ?? [])
    return exercises.map((exercise) => ({
      exercise_id: exercise.id,
      criteria_level_id: exercise.criteria_level_id ?? null,
      date,
    }))
  })
  const adaptiveContext = await (async () => {
    try {
      const [dogState, quizStats] = await Promise.all([
        getDogState(dog.id),
        getRecentQuizStats(dog.user_id, dog.id),
      ])
      return { dogState, quizStats }
    } catch {
      return null
    }
  })()

  let thresholdOverrides = adaptiveContext?.dogState.thresholdAdjustments ?? {}
  if (adaptiveContext) {
    try {
      const pending = await getPendingDecisions(dog.id)
      if (pending.length > 0) {
        const observed = computeProgressionDecisions(recentMetrics, { sessionRows })
        const evaluations = evaluateDecisions(
          pending,
          observed.map((d) => ({
            exercise_id: d.exercise_id,
            decision: d.decision,
            success_rate: d.success_rate,
          })),
        )
        if (evaluations.length > 0) {
          await markDecisionsEvaluated(evaluations)
          const outcomes = await getRecentAdvanceOutcomes(dog.id)
          thresholdOverrides = computeThresholdAdjustments(thresholdOverrides, outcomes)
          await updateThresholdAdjustments(dog.id, thresholdOverrides)
          trackTelemetry('progression_decision_evaluated', {
            dogId: dog.id,
            evaluated: evaluations.length,
            bad: evaluations.filter((e) => e.outcome === 'bad').length,
            good: evaluations.filter((e) => e.outcome === 'good').length,
          })
        }
      }
    } catch (e) {
      // Kalibrering får aldrig blockera planeringen.
      console.warn('[week-orchestrator] calibration skipped:', e instanceof Error ? e.message : String(e))
    }
  }

  const rawProgressionDecisions = computeProgressionDecisions(recentMetrics, {
    sessionRows,
    thresholdOverrides,
  })
  const handlerStruggle = adaptiveContext
    ? computeHandlerStruggle(adaptiveContext.dogState.handler, adaptiveContext.quizStats)
    : { struggling: false, dimensions: [], reason: null } satisfies HandlerStruggle
  const progressionDecisions = dampAdvances(rawProgressionDecisions, handlerStruggle)
  if (handlerStruggle.struggling) {
    trackTelemetry('handler_struggle_damping', {
      dogId: dog.id,
      dimensions: handlerStruggle.dimensions,
      dampedCount: rawProgressionDecisions.filter((d) => d.decision === 'advance').length,
    })
  }
  const progressionRule = formatProgressionRule(
    progressionDecisions,
    Object.fromEntries(customExercises.map((e: { exercise_id: string; label: string }) => [e.exercise_id, e.label])),
  )
  const focusAreas = weeklyPrefs.areas
  const priorityExercises = weeklyPrefs.priorityExerciseIds
  const cacheKey = performanceSummary || focusAreas.length > 0 || priorityExercises.length > 0 ? isoWeekKey() : undefined
  const customIds = customExercises.map((e: { exercise_id: string; label: string }) => e.exercise_id)
  const isHomecomeWeek = trainingWeek === 1 && typeof ageWeeks === 'number' && ageWeeks < 14
  const hasCats = pets.some((pet) => pet === 'cats_indoor' || pet === 'cats_outdoor')

  return {
    input: {
      breed,
      trainingWeek,
      ageWeeks,
      goals,
      onboardingContext,
      performanceSummary,
      customExercises,
      householdPets: pets,
      weeklyFocus: focusAreas,
      priorityExercises,
      dogSex,
      castrationStatus,
      isInHeat,
      skenfasActive,
      progressionRule,
      progressionDecisions,
      isReactive: isReactiveProfile,
    },
    breed,
    trainingWeek,
    ageWeeks,
    goals,
    cacheKey,
    dogId: dog.id,
    onboardingContext,
    customIds,
    focusAreas,
    priorityExercises,
    isHomecomeWeek,
    hasCats,
  }
}

const LOCK_WAIT_ATTEMPTS = 5
const LOCK_WAIT_INTERVAL_MS = 1500

export async function getOrGenerateWeekPlan(ctx: WeekOrchestratorContext): Promise<WeekPlan> {
  if (ctx.isHomecomeWeek) return getHomecomeWeekPlan(ctx.hasCats)

  const baseTelemetry = {
    dogId: ctx.dogId,
    breed: ctx.breed,
    trainingWeek: ctx.trainingWeek,
    ageWeeks: ctx.ageWeeks ?? null,
    planVersion: PLAN_VERSION,
    hasFocusAreas: ctx.focusAreas.length > 0,
    hasPriorities: ctx.priorityExercises.length > 0,
    hasProgressionRule: Boolean(ctx.input.progressionRule),
    cacheScope: ctx.cacheKey ?? null,
  }

  const cached = await readCachedPlan(ctx)
  if (cached) {
    trackTelemetry('week-plan-api', { ...baseTelemetry, source: 'cache', cacheHit: true })
    return cached
  }

  // Singleflight: only one concurrent generation per dog+week. Parallel
  // requests (dashboard + calendar, double-clicks, cache invalidation after a
  // PLAN_VERSION bump) would otherwise each trigger their own AI generation.
  const lockKey = `weekplan:${ctx.dogId}:${ctx.trainingWeek}:${PLAN_VERSION}`
  const lockAcquired = await tryAcquireGenerationLock(lockKey)

  if (!lockAcquired) {
    // Someone else is generating — wait briefly for their cache write.
    for (let i = 0; i < LOCK_WAIT_ATTEMPTS; i++) {
      await sleep(LOCK_WAIT_INTERVAL_MS)
      const plan = await readCachedPlan(ctx)
      if (plan) {
        trackTelemetry('week-plan-api', { ...baseTelemetry, source: 'cache-wait', cacheHit: true })
        return plan
      }
    }
    // Still nothing: serve the deterministic plan without AI polish rather
    // than piling on another AI generation. Not cached — the lock holder's
    // full plan will land in cache for the next request.
    trackTelemetry('week-plan-api', { ...baseTelemetry, source: 'deterministic-singleflight', cacheHit: false })
    return buildDeterministicWeekPlan(ctx.input).plan
  }

  try {
    const plan = await generateWeekPlan(ctx.input)
    trackTelemetry('week-plan-api', { ...baseTelemetry, source: 'generated', cacheHit: false })
    logProgressionDecisions(ctx.dogId, ctx.input.progressionDecisions ?? []).catch((e) => {
      console.warn('[week-orchestrator] decision log failed:', e instanceof Error ? e.message : String(e))
    })
    await setCachedWeekPlan(
      ctx.breed,
      ctx.trainingWeek,
      plan,
      ctx.ageWeeks,
      ctx.goals,
      ctx.cacheKey,
      ctx.dogId,
      ctx.onboardingContext,
      ctx.customIds,
      PLAN_VERSION,
      ctx.focusAreas,
      ctx.priorityExercises,
      ctx.input.progressionRule,
    ).catch((e) => {
      console.error('[GET /api/training/week] cache write failed:', e)
      trackTelemetry('week-plan-api', {
        ...baseTelemetry,
        source: 'generated',
        cacheHit: false,
        cacheWriteFailed: true,
      })
    })
    return plan
  } finally {
    await releaseGenerationLock(lockKey)
  }
}

async function readCachedPlan(ctx: WeekOrchestratorContext): Promise<WeekPlan | null> {
  try {
    return await getCachedWeekPlan(
      ctx.breed,
      ctx.trainingWeek,
      ctx.ageWeeks,
      ctx.goals,
      ctx.cacheKey,
      ctx.dogId,
      ctx.onboardingContext,
      ctx.customIds,
      PLAN_VERSION,
      ctx.focusAreas,
      ctx.priorityExercises,
      ctx.input.progressionRule,
    )
  } catch (e) {
    console.error('[GET /api/training/week] cache read failed:', e)
    return null
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function parsePets(params: URLSearchParams): HouseholdPet[] {
  const raw = params.get('householdPets')
  if (!raw) return []
  return raw.split(',').filter((p): p is HouseholdPet => VALID_PETS.includes(p as HouseholdPet))
}

function buildOnboardingContext(
  params: URLSearchParams,
  pets: HouseholdPet[],
  behaviorContext?: string | null,
): string | undefined {
  const environment = params.get('environment') as TrainingEnvironment | null
  const rewardPreference = params.get('rewardPreference') as RewardPreference | null
  const takesRewardsOutdoors = params.get('takesRewardsOutdoors')
  const lines: string[] = []
  if (environment && ENV_LABELS[environment]) lines.push(`Miljö: ${ENV_LABELS[environment]}`)
  if (rewardPreference && REWARD_LABELS[rewardPreference]) lines.push(`Belöning som funkar bäst: ${REWARD_LABELS[rewardPreference]}`)
  if (takesRewardsOutdoors != null) {
    lines.push(`Tar belöning utomhus: ${takesRewardsOutdoors === 'true' ? 'Ja' : 'Nej — träna inne eller med extra hög-värde belöning ute'}`)
  }
  if (pets.length > 0 && !behaviorContext?.includes('HUSDJUR')) {
    lines.push('', '=== HUSDJUR I HEMMET ===', `Husdjur: ${pets.map((p) => HOUSEHOLD_PET_LABELS[p]).join(', ')}`)
    for (const note of householdPetNotes(pets)) lines.push(note)
  }
  if (behaviorContext) lines.push('', behaviorContext)
  return lines.length > 0 ? lines.join('\n') : undefined
}

function formatPerformanceSummary(logStrings: string[]): string | undefined {
  if (logStrings.length === 0) return undefined
  return logStrings.map((l) => `• ${l}`).join('\n')
}

function isoWeekKey(): string {
  const now = new Date()
  const d = new Date(now)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7))
  const week1 = new Date(d.getFullYear(), 0, 4)
  const week = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7)
  return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`
}
