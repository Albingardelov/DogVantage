import { supabaseAdmin } from './client'
import type { TrainingResult, Breed } from '@/types'

export async function getCachedTraining(
  breed: Breed,
  weekNumber: number
): Promise<TrainingResult | null> {
  const { data, error } = await supabaseAdmin
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
  const { error } = await supabaseAdmin
    .from('training_cache')
    .upsert({
      breed,
      week_number: weekNumber,
      content: result.content,
      source: result.source,
    })

  if (error) throw new Error(`Cache write failed: ${error.message}`)
}
