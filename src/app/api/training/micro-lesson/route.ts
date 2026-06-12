import { NextRequest, NextResponse } from 'next/server'
import { withAuthAndDog } from '@/lib/api/with-auth'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import { getMicroLesson } from '@/lib/ai/doc-learning'
import { getAgeInWeeks, getLifeStage } from '@/lib/dog/age'
import { rankWeakestExercises, pickMicroLessonExercise, type ExerciseMetricRow } from '@/lib/learning/micro-lesson'
import { listRecentMicroQuizExercises } from '@/lib/supabase/learning-progress'
import type { Breed } from '@/types'

// A completed lesson stays gone this long before its topic can come back.
const COMPLETED_WINDOW_DAYS = 7

// Fallback topics when the dog has no recent metrics — foundational skill per life stage.
const STAGE_FALLBACK: Record<string, string> = {
  puppy: 'marker',
  junior: 'inkallning',
  adolescent: 'inkallning',
  adult: 'inkallning',
}

export async function GET(req: NextRequest) {
  return withAuthAndDog(req, async ({ user, dog, supabase }) => {
    const breed = dog.breed as Breed

    const { data: profile } = await supabase
      .from('dog_profiles')
      .select('birthdate')
      .eq('id', dog.id)
      .single()
    const ageWeeks = profile?.birthdate ? getAgeInWeeks(profile.birthdate) : undefined
    const lifeStage = getLifeStage(ageWeeks)

    const since = new Date()
    since.setUTCDate(since.getUTCDate() - COMPLETED_WINDOW_DAYS)
    const [ranked, completedIds] = await Promise.all([
      getRankedWeakExercises(dog.id),
      listRecentMicroQuizExercises(user.id, dog.id, since.toISOString()).catch(() => [] as string[]),
    ])

    const fallback = STAGE_FALLBACK[lifeStage] ?? 'inkallning'
    const exerciseId = pickMicroLessonExercise(ranked, fallback, new Set(completedIds))
    if (!exerciseId) return NextResponse.json({ lesson: null })

    const lesson = await getMicroLesson(breed, lifeStage, exerciseId)
    return NextResponse.json({ lesson })
  })
}

async function getRankedWeakExercises(dogId: string): Promise<string[]> {
  const since = new Date()
  since.setUTCDate(since.getUTCDate() - 14)

  const { data } = await getSupabaseAdmin()
    .from('daily_exercise_metrics')
    .select('exercise_id, success_count, fail_count')
    .eq('dog_id', dogId)
    .gte('date', since.toISOString().slice(0, 10))

  return rankWeakestExercises((data ?? []) as ExerciseMetricRow[])
}
