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

function weekPlanCacheKey(breed: Breed, ageWeeks?: number, goals?: string[]): string {
  return `weekplan_${breed}_${ageBucket(ageWeeks)}_${goalsBucket(goals)}`
}

export async function getCachedWeekPlan(
  breed: Breed,
  weekNumber: number,
  ageWeeks?: number,
  goals?: string[]
): Promise<WeekPlan | null> {
  const { data, error } = await getSupabaseAdmin()
    .from('training_cache')
    .select('content')
    .eq('breed', weekPlanCacheKey(breed, ageWeeks, goals))
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
  goals?: string[]
): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from('training_cache')
    .upsert({
      breed: weekPlanCacheKey(breed, ageWeeks, goals),
      week_number: weekNumber,
      content: JSON.stringify(plan),
      source: 'week_plan',
    })

  if (error) throw new Error(`Week plan cache write failed: ${error.message}`)
}
