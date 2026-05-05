import { NextRequest, NextResponse } from 'next/server'
import { generateWeekPlan } from '@/lib/ai/week-plan'
import { getCachedWeekPlan, setCachedWeekPlan } from '@/lib/supabase/training-cache'
import { getRecentLogs, formatLogsForPrompt } from '@/lib/supabase/session-logs'
import { getActiveCustomExercises } from '@/lib/supabase/custom-exercises'
import { createSupabaseServer } from '@/lib/supabase/server'
import type { Breed, TrainingGoal, TrainingEnvironment, RewardPreference } from '@/types'

const VALID_GOALS: TrainingGoal[] = [
  'everyday_obedience', 'sport', 'hunting', 'herding', 'impulse_control', 'nosework', 'problem_solving',
]

const VALID_BREEDS: Breed[] = [
  'labrador', 'italian_greyhound', 'braque_francais', 'miniature_american_shepherd',
]

const ENV_LABELS: Record<TrainingEnvironment, string> = {
  city:    'Stad (mycket folk och hundar)',
  suburb:  'Förort / blandat',
  rural:   'Land / natur',
}

const REWARD_LABELS: Record<RewardPreference, string> = {
  food:    'Mat',
  toy:     'Leksak',
  social:  'Socialt (beröm/lek)',
  mixed:   'Blandat',
}

function buildOnboardingContext(params: URLSearchParams): string | undefined {
  const environment = params.get('environment') as TrainingEnvironment | null
  const rewardPreference = params.get('rewardPreference') as RewardPreference | null
  const takesRewardsOutdoors = params.get('takesRewardsOutdoors')
  const behaviorContext = params.get('behaviorContext')

  const lines: string[] = []
  if (environment && ENV_LABELS[environment]) lines.push(`Miljö: ${ENV_LABELS[environment]}`)
  if (rewardPreference && REWARD_LABELS[rewardPreference]) lines.push(`Belöning som funkar bäst: ${REWARD_LABELS[rewardPreference]}`)
  if (takesRewardsOutdoors != null) {
    lines.push(`Tar belöning utomhus: ${takesRewardsOutdoors === 'true' ? 'Ja' : 'Nej — träna inne eller med extra hög-värde belöning ute'}`)
  }
  if (behaviorContext) {
    lines.push('')
    lines.push(behaviorContext)
  }
  return lines.length > 0 ? lines.join('\n') : undefined
}

function formatPerformanceSummary(logStrings: string[]): string | undefined {
  if (logStrings.length === 0) return undefined
  return logStrings.map((l) => `• ${l}`).join('\n')
}

/** Returns a string like "2026-W19" — changes once per calendar week. */
function isoWeekKey(): string {
  const now = new Date()
  const d = new Date(now)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7))
  const week1 = new Date(d.getFullYear(), 0, 4)
  const week = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7)
  return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`
}

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams
  const breed = p.get('breed') as Breed | null
  const weekStr = p.get('week')
  const trainingWeek = weekStr ? Number(weekStr) : NaN
  const ageWeeksStr = p.get('ageWeeks')
  const ageWeeks = ageWeeksStr != null ? Number(ageWeeksStr) : undefined
  const goalsStr = p.get('goals')
  const goals = goalsStr
    ? (goalsStr.split(',').filter((g) => VALID_GOALS.includes(g as TrainingGoal)) as TrainingGoal[])
    : undefined
  const dogKey = p.get('dogKey') ?? undefined

  if (!breed || isNaN(trainingWeek) || !VALID_BREEDS.includes(breed)) {
    return NextResponse.json({ error: 'breed and week required' }, { status: 400 })
  }

  // Build onboarding context from query params
  const onboardingContext = buildOnboardingContext(p)

  // Resolve user id for per-user cache isolation
  let userId: string | undefined
  try {
    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    userId = user?.id
  } catch {
    // continue without user id — cache will be shared but not incorrect
  }

  // Fetch recent session logs for feedback-loop (best-effort)
  let performanceSummary: string | undefined
  try {
    const recentLogs = await getRecentLogs(breed, trainingWeek, 3)
    performanceSummary = formatPerformanceSummary(formatLogsForPrompt(recentLogs))
  } catch {
    // Not critical — continue without performance data
  }

  let customExercises: Array<{ exercise_id: string; label: string }> = []
  try {
    const rows = await getActiveCustomExercises()
    customExercises = rows.map((r) => ({ exercise_id: r.exercise_id, label: r.label }))
  } catch {
    // Not critical — continue without custom exercises
  }

  // Plans with performance data are cached per ISO-week so the plan adapts to
  // recent logs without triggering a fresh Groq call on every page load.
  // Plans without performance data are cached indefinitely (static baseline).
  const cacheKey = performanceSummary ? isoWeekKey() : undefined
  const customIds = customExercises.map((e) => e.exercise_id)

  let cached: import('@/types').WeekPlan | null = null
  try {
    cached = await getCachedWeekPlan(breed, trainingWeek, ageWeeks, goals, cacheKey, userId, onboardingContext, customIds)
  } catch (e) {
    console.error('[GET /api/training/week] cache read failed:', e)
  }
  if (cached) return NextResponse.json(cached)

  try {
    const plan = await generateWeekPlan(breed, trainingWeek, ageWeeks, goals, onboardingContext, performanceSummary, customExercises)
    await setCachedWeekPlan(breed, trainingWeek, plan, ageWeeks, goals, cacheKey, userId, onboardingContext, customIds).catch((e) => {
      console.error('[GET /api/training/week] cache write failed:', e)
    })
    return NextResponse.json(plan)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[GET /api/training/week]', message)
    if (message.includes('rate_limit') || message.includes('429') || message.includes('quota')) {
      return NextResponse.json({ error: 'AI-tjänsten är tillfälligt otillgänglig. Försök igen om en stund.' }, { status: 429 })
    }
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
