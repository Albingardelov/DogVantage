import { NextRequest, NextResponse } from 'next/server'
import { withAuthAndDog } from '@/lib/api/with-auth'
import { getAgeInWeeks, type LifeStage } from '@dogvantage/core'
import { getCurriculumOverview } from '@/lib/learning/curriculum'
import { lifeStageFromAgeWeeks } from '@/lib/learning/curriculum-def'
import { listCompletedModules, listFailedQuizModuleIds } from '@/lib/supabase/learning-progress'
import { getDogState } from '@/lib/supabase/dog-state'
import { computeHandlerStruggle } from '@dogvantage/core'
import type { Breed } from '@dogvantage/core'

export async function GET(req: NextRequest) {
  return withAuthAndDog(req, async ({ user, dog, supabase }) => {
    const breed = dog.breed as Breed
    const { data: profile } = await supabase
      .from('dog_profiles')
      .select('birthdate')
      .eq('id', dog.id)
      .single()

    const ageWeeks = profile?.birthdate ? getAgeInWeeks(profile.birthdate) : undefined
    const lifeStage: LifeStage = lifeStageFromAgeWeeks(ageWeeks)

    const completed = await listCompletedModules(user.id, dog.id)

    const personalization = await (async () => {
      try {
        const [dogState, failedModuleIds] = await Promise.all([
          getDogState(dog.id),
          listFailedQuizModuleIds(user.id, dog.id),
        ])
        const struggle = computeHandlerStruggle(dogState.handler, null)
        return {
          weakExerciseIds: dogState.weakExercises.map((e) => e.exerciseId),
          strugglingDimensions: struggle.dimensions,
          failedModuleIds,
        }
      } catch {
        return undefined
      }
    })()

    const overview = await getCurriculumOverview(breed, lifeStage, completed, personalization)
    return NextResponse.json(overview)
  })
}
