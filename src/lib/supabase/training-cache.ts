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

// Week plan cache uses breed key prefixed with "weekplan_" to avoid
// collisions with the existing text-based training cache entries.
export async function getCachedWeekPlan(
  breed: Breed,
  weekNumber: number
): Promise<WeekPlan | null> {
  const { data, error } = await getSupabaseAdmin()
    .from('training_cache')
    .select('content')
    .eq('breed', `weekplan_${breed}`)
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
  plan: WeekPlan
): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from('training_cache')
    .upsert({
      breed: `weekplan_${breed}`,
      week_number: weekNumber,
      content: JSON.stringify(plan),
      source: 'week_plan',
    })

  if (error) throw new Error(`Week plan cache write failed: ${error.message}`)
}
