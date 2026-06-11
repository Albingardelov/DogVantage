import { NextRequest, NextResponse } from 'next/server'
import { withAuthAndDog } from '@/lib/api/with-auth'
import { getAgeInWeeks, type LifeStage } from '@/lib/dog/age'
import { getCurriculumOverview } from '@/lib/learning/curriculum'
import { lifeStageFromAgeWeeks } from '@/lib/learning/curriculum-def'
import { listCompletedModules } from '@/lib/supabase/learning-progress'
import type { Breed } from '@/types'

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
    const overview = await getCurriculumOverview(breed, lifeStage, completed)
    return NextResponse.json(overview)
  })
}
