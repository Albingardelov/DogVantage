import { NextRequest, NextResponse } from 'next/server'
import { withAuthAndDog } from '@/lib/api/with-auth'
import { getAgeInWeeks, type LifeStage } from '@dogvantage/core'
import { getModuleById, moduleListForStage } from '@/lib/learning/curriculum'
import { lifeStageFromAgeWeeks } from '@/lib/learning/curriculum-def'
import { listCompletedAmong, markModuleComplete } from '@/lib/supabase/learning-progress'
import type { Breed } from '@dogvantage/core'

type RouteParams = { params: Promise<{ moduleId: string }> }

export async function GET(req: NextRequest, { params }: RouteParams) {
  return withAuthAndDog(req, async ({ dog, supabase }) => {
    const { moduleId } = await params
    const breed = dog.breed as Breed

    const { data: profile } = await supabase
      .from('dog_profiles')
      .select('birthdate')
      .eq('id', dog.id)
      .single()
    const ageWeeks = profile?.birthdate ? getAgeInWeeks(profile.birthdate) : undefined
    const lifeStage: LifeStage = lifeStageFromAgeWeeks(ageWeeks)

    const module = await getModuleById(breed, lifeStage, moduleId)
    if (!module) {
      return NextResponse.json({ error: 'module_not_found' }, { status: 404 })
    }

    return NextResponse.json({ module })
  })
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  return withAuthAndDog(req, async ({ user, dog, supabase }) => {
    const { moduleId } = await params
    const breed = dog.breed as Breed

    const { data: profile } = await supabase
      .from('dog_profiles')
      .select('birthdate')
      .eq('id', dog.id)
      .single()
    const ageWeeks = profile?.birthdate ? getAgeInWeeks(profile.birthdate) : undefined
    const lifeStage: LifeStage = lifeStageFromAgeWeeks(ageWeeks)

    const defs = moduleListForStage(lifeStage)
    const def = defs.find((m) => m.id === moduleId)
    if (!def) {
      return NextResponse.json({ error: 'module_not_found' }, { status: 404 })
    }

    // Require prior modules completed (except first).
    const prior = defs.filter((m) => m.order < def.order)
    if (prior.length > 0) {
      const done = await listCompletedAmong(user.id, dog.id, prior.map((m) => m.id))
      const doneSet = new Set(done)
      if (!prior.every((m) => doneSet.has(m.id))) {
        return NextResponse.json({ error: 'prior_modules_incomplete' }, { status: 400 })
      }
    }

    await markModuleComplete(user.id, dog.id, moduleId)

    const module = await getModuleById(breed, lifeStage, moduleId)
    return NextResponse.json({ ok: true, module })
  })
}
