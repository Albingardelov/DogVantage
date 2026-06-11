import { NextRequest, NextResponse } from 'next/server'
import { withAuthAndDog } from '@/lib/api/with-auth'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import { getMicroLesson } from '@/lib/ai/doc-learning'
import { getAgeInWeeks, getLifeStage } from '@/lib/dog/age'
import type { Breed } from '@/types'

const MIN_ATTEMPTS = 4

// Fallback topics when the dog has no recent metrics — foundational skill per life stage.
const STAGE_FALLBACK: Record<string, string> = {
  puppy: 'marker',
  junior: 'inkallning',
  adolescent: 'inkallning',
  adult: 'inkallning',
}

export async function GET(req: NextRequest) {
  return withAuthAndDog(req, async ({ dog, supabase }) => {
    const breed = dog.breed as Breed

    const { data: profile } = await supabase
      .from('dog_profiles')
      .select('birthdate')
      .eq('id', dog.id)
      .single()
    const ageWeeks = profile?.birthdate ? getAgeInWeeks(profile.birthdate) : undefined
    const lifeStage = getLifeStage(ageWeeks)

    const exerciseId = (await findWeakestExercise(dog.id)) ?? STAGE_FALLBACK[lifeStage] ?? 'inkallning'

    const lesson = await getMicroLesson(breed, lifeStage, exerciseId)
    return NextResponse.json({ lesson })
  })
}

async function findWeakestExercise(dogId: string): Promise<string | null> {
  const since = new Date()
  since.setUTCDate(since.getUTCDate() - 14)

  const { data } = await getSupabaseAdmin()
    .from('daily_exercise_metrics')
    .select('exercise_id, success_count, fail_count')
    .eq('dog_id', dogId)
    .gte('date', since.toISOString().slice(0, 10))

  if (!data || data.length === 0) return null

  const byExercise = new Map<string, { success: number; attempts: number }>()
  for (const row of data) {
    const agg = byExercise.get(row.exercise_id) ?? { success: 0, attempts: 0 }
    agg.success += row.success_count ?? 0
    agg.attempts += (row.success_count ?? 0) + (row.fail_count ?? 0)
    byExercise.set(row.exercise_id, agg)
  }

  let weakest: string | null = null
  let weakestRate = Infinity
  for (const [exerciseId, agg] of byExercise) {
    if (agg.attempts < MIN_ATTEMPTS) continue
    const rate = agg.success / agg.attempts
    if (rate < weakestRate) {
      weakestRate = rate
      weakest = exerciseId
    }
  }
  return weakest
}
