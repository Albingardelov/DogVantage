import { getSupabaseAdmin } from './client'
import type { TrainingResult, Breed, WeekPlan } from '@/types'

export async function getCachedTraining(
  breed: Breed,
  weekNumber: number
): Promise<TrainingResult | null> {
  const { data, error } = await getSupabaseAdmin()
    .from('training_cache')
    .select('content, source')
    .eq('breed', breed)
    .eq('week_number', weekNumber)
    .single()

  if (error || !data) return null
  return { content: data.content, source: data.source, source_url: '' }
}

export async function setCachedTraining(
  breed: Breed,
  weekNumber: number,
  result: TrainingResult
): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from('training_cache')
    .upsert({
      breed,
      week_number: weekNumber,
      content: result.content,
      source: result.source,
    })

  if (error) throw new Error(`Cache write failed: ${error.message}`)
}

function ageBucket(ageWeeks?: number): string {
  if (!ageWeeks || ageWeeks < 16) return 'puppy'
  if (ageWeeks < 52) return 'junior'
  return 'adult'
}

function goalsBucket(goals?: string[]): string {
  if (!goals || goals.length === 0) return 'default'
  return [...goals].sort().join('+')
}

function shortHash(s: string): string {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return Math.abs(h).toString(36)
}

function resolveHashes(onboardingContext?: string, customIds?: string[]) {
  return {
    onboardingHash: onboardingContext ? shortHash(onboardingContext) : undefined,
    customHash: customIds && customIds.length > 0 ? shortHash(customIds.sort().join(',')) : undefined,
  }
}

function weekPlanCacheKey(
  breed: Breed,
  ageWeeks?: number,
  goals?: string[],
  dateKey?: string,
  dogId?: string,
  onboardingHash?: string,
  customHash?: string,
  planVersion?: string,
): string {
  const parts = [`weekplan`, breed, ageBucket(ageWeeks), goalsBucket(goals)]
  if (dogId) parts.push(dogId)
  if (onboardingHash) parts.push(`o${onboardingHash}`)
  if (customHash) parts.push(`c${customHash}`)
  if (planVersion) parts.push(planVersion)
  if (dateKey) parts.push(dateKey)
  return parts.join('_')
}

export async function getCachedWeekPlan(
  breed: Breed,
  weekNumber: number,
  ageWeeks?: number,
  goals?: string[],
  dateKey?: string,
  dogId?: string,
  onboardingContext?: string,
  customIds?: string[],
  planVersion?: string,
): Promise<WeekPlan | null> {
  const { onboardingHash, customHash } = resolveHashes(onboardingContext, customIds)
  const { data, error } = await getSupabaseAdmin()
    .from('training_cache')
    .select('content')
    .eq('breed', weekPlanCacheKey(breed, ageWeeks, goals, dateKey, dogId, onboardingHash, customHash, planVersion))
    .eq('week_number', weekNumber)
    .single()

  if (error || !data) return null
  try {
    return JSON.parse(data.content) as WeekPlan
  } catch {
    return null
  }
}

export async function setCachedWeekPlan(
  breed: Breed,
  weekNumber: number,
  plan: WeekPlan,
  ageWeeks?: number,
  goals?: string[],
  dateKey?: string,
  dogId?: string,
  onboardingContext?: string,
  customIds?: string[],
  planVersion?: string,
): Promise<void> {
  const { onboardingHash, customHash } = resolveHashes(onboardingContext, customIds)
  const { error } = await getSupabaseAdmin()
    .from('training_cache')
    .upsert({
      breed: weekPlanCacheKey(breed, ageWeeks, goals, dateKey, dogId, onboardingHash, customHash, planVersion),
      week_number: weekNumber,
      content: JSON.stringify(plan),
      source: 'week_plan',
    }, { onConflict: 'breed,week_number' })

  if (error) throw new Error(`Week plan cache write failed: ${error.message}`)
}
