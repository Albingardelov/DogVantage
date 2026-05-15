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
} from '@/types'
import { isGoal } from '@/types/dog'
import { isValidBreed } from '@/lib/breeds/registry'
import { buildBehaviorContextFromDb } from '@/lib/dog/build-behavior-context'
import { householdPetNotes, HOUSEHOLD_PET_LABELS } from '@/lib/dog/behavior'
import { detectBehaviorEmergency, BEHAVIOR_RESPONSE } from '@/lib/ai/safety-guards'
import { getRecentLogs, formatLogsForPrompt } from '@/lib/supabase/session-logs'
import { getActiveCustomExercises } from '@/lib/supabase/custom-exercises'
import { currentIsoWeek, type WeeklyFocusArea } from '@/lib/training/weekly-focus'
import { getWeeklyFocus } from '@/lib/supabase/weekly-focus'
import { getActiveHeatCycle, getLastEndedHeatCycle, isSkenfasActive } from '@/lib/supabase/heat-cycles'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import { computeProgressionDecisions, formatProgressionRule, type ProgressionMetricRow } from '@/lib/training/progression-rules'
import { getHomecomeWeekPlan } from '@/lib/training/homecoming-plan'
import { generateWeekPlan, PLAN_VERSION } from '@/lib/ai/week-plan'
import type { WeekPlanInput } from '@/lib/training/week-context'
import { getCachedWeekPlan, setCachedWeekPlan } from '@/lib/supabase/training-cache'

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
  isHomecomeWeek: boolean
  hasCats: boolean
}

export async function buildWeekContextFromRequest(
  req: NextRequest,
  dog: DogAuthContext,
  supabase: SupabaseClient<Database>,
): Promise<WeekOrchestratorContext> {
  const p = req.nextUrl.searchParams
  const breed = p.get('breed') as Breed | null
  const weekStr = p.get('week')
  const trainingWeek = weekStr ? Number(weekStr) : NaN
  const ageWeeksStr = p.get('ageWeeks')
  const ageWeeks = ageWeeksStr != null ? Number(ageWeeksStr) : undefined
  const goalsStr = p.get('goals')
  const goals = goalsStr ? goalsStr.split(',').filter((g): g is TrainingGoal => isGoal(g)) : undefined
  if (!breed || Number.isNaN(trainingWeek) || !isValidBreed(breed)) {
    throw new Error('breed and week required')
  }

  const pets = parsePets(p)
  const { data: dogProfile } = await supabase
    .from('dog_profiles')
    .select('sex, castration_status')
    .eq('id', dog.id)
    .single()
  const dogSex = (dogProfile as { sex: string | null } | null)?.sex as DogSex | undefined ?? undefined
  const castrationStatus = (dogProfile as { castration_status: string | null } | null)?.castration_status as CastrationStatus | undefined ?? undefined
  const serverBehaviorContext = await buildBehaviorContextFromDb(supabase, dog.id)
  const baseOnboardingContext = buildOnboardingContext(p, pets, serverBehaviorContext)
  if (detectBehaviorEmergency(baseOnboardingContext)) {
    throw new BehaviorEmergencyError(BEHAVIOR_RESPONSE.content)
  }

  const isoWeek = currentIsoWeek()
  const needsHeatData = dogSex === 'female' && castrationStatus === 'intact'
  const sevenDaysAgo = (() => {
    const d = new Date()
    d.setUTCDate(d.getUTCDate() - 7)
    return d.toISOString().slice(0, 10)
  })()

  const [recentLogs, customRows, focusAreas, activeHeat, lastEnded, recentMetrics] = await Promise.all([
    getRecentLogs(dog.id, trainingWeek, 3).catch(() => []),
    getActiveCustomExercises(dog.id).catch(() => []),
    getWeeklyFocus(dog.id, isoWeek).catch(() => []),
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
  ])

  const isInHeat = Boolean(activeHeat)
  const skenfasActive = isSkenfasActive(lastEnded)
  const sexLines: string[] = []
  if (dogSex) sexLines.push(`Kön: ${dogSex === 'female' ? 'Tik' : 'Hane'}`)
  if (castrationStatus) sexLines.push(`Kastration: ${castrationStatus === 'intact' ? 'Intakt' : castrationStatus === 'castrated' ? 'Kastrerad' : 'Okänt'}`)
  if (isInHeat) sexLines.push('Status: Löper just nu')
  if (skenfasActive) sexLines.push('Status: Skenfas-fönster aktivt (6–9 v efter löp)')
  const onboardingContext = sexLines.length > 0
    ? [baseOnboardingContext, sexLines.join('\n')].filter(Boolean).join('\n')
    : baseOnboardingContext

  const performanceSummary = formatPerformanceSummary(formatLogsForPrompt(recentLogs))
  const customExercises = customRows.map((r: { exercise_id: string; label: string }) => ({
    exercise_id: r.exercise_id,
    label: r.label,
  }))
  const progressionDecisions = computeProgressionDecisions(recentMetrics)
  const progressionRule = formatProgressionRule(
    progressionDecisions,
    Object.fromEntries(customExercises.map((e: { exercise_id: string; label: string }) => [e.exercise_id, e.label])),
  )
  const cacheKey = performanceSummary || focusAreas.length > 0 ? isoWeekKey() : undefined
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
      dogSex,
      castrationStatus,
      isInHeat,
      skenfasActive,
      progressionRule,
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
    isHomecomeWeek,
    hasCats,
  }
}

export async function getOrGenerateWeekPlan(ctx: WeekOrchestratorContext): Promise<WeekPlan> {
  if (ctx.isHomecomeWeek) return getHomecomeWeekPlan(ctx.hasCats)

  let cached: WeekPlan | null = null
  try {
    cached = await getCachedWeekPlan(
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
    )
  } catch (e) {
    console.error('[GET /api/training/week] cache read failed:', e)
  }
  if (cached) return cached

  const plan = await generateWeekPlan(ctx.input)
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
  ).catch((e) => {
    console.error('[GET /api/training/week] cache write failed:', e)
  })
  return plan
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
