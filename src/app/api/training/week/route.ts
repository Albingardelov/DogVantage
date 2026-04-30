import { NextRequest, NextResponse } from 'next/server'
import { generateWeekPlan } from '@/lib/ai/week-plan'
import { getCachedWeekPlan, setCachedWeekPlan } from '@/lib/supabase/training-cache'
import { getRecentLogs, formatLogsForPrompt } from '@/lib/supabase/session-logs'
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

  const lines: string[] = []
  if (environment && ENV_LABELS[environment]) lines.push(`Miljö: ${ENV_LABELS[environment]}`)
  if (rewardPreference && REWARD_LABELS[rewardPreference]) lines.push(`Belöning som funkar bäst: ${REWARD_LABELS[rewardPreference]}`)
  if (takesRewardsOutdoors != null) {
    lines.push(`Tar belöning utomhus: ${takesRewardsOutdoors === 'true' ? 'Ja' : 'Nej — träna inne eller med extra hög-värde belöning ute'}`)
  }
  return lines.length > 0 ? lines.join('\n') : undefined
}

function formatPerformanceSummary(logStrings: string[]): string | undefined {
  if (logStrings.length === 0) return undefined
  return logStrings.map((l) => `• ${l}`).join('\n')
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

  // Fetch recent session logs for feedback-loop (best-effort)
  let performanceSummary: string | undefined
  try {
    const recentLogs = await getRecentLogs(breed, trainingWeek, 3)
    performanceSummary = formatPerformanceSummary(formatLogsForPrompt(recentLogs))
  } catch {
    // Not critical — continue without performance data
  }

  // Skip cache when we have fresh performance data so the plan adapts to reality
  if (!performanceSummary) {
    const cached = await getCachedWeekPlan(breed, trainingWeek, ageWeeks, goals)
    if (cached) return NextResponse.json(cached)
  }

  const plan = await generateWeekPlan(breed, trainingWeek, ageWeeks, goals, onboardingContext, performanceSummary)

  // Only cache plans without performance context (static plans can be reused)
  if (!performanceSummary) {
    await setCachedWeekPlan(breed, trainingWeek, plan, ageWeeks, goals).catch(() => {})
  }

  return NextResponse.json(plan)
}
