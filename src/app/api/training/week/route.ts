import { NextRequest, NextResponse } from 'next/server'
import { generateWeekPlan } from '@/lib/ai/week-plan'
import { getCachedWeekPlan, setCachedWeekPlan } from '@/lib/supabase/training-cache'
import type { Breed } from '@/types'

export async function GET(req: NextRequest) {
  const breed = req.nextUrl.searchParams.get('breed') as Breed | null
  const weekStr = req.nextUrl.searchParams.get('week')
  const weekNumber = weekStr ? Number(weekStr) : NaN

  if (!breed || isNaN(weekNumber)) {
    return NextResponse.json({ error: 'breed and week required' }, { status: 400 })
  }

  const cached = await getCachedWeekPlan(breed, weekNumber)
  if (cached) return NextResponse.json(cached)

  const plan = await generateWeekPlan(breed, weekNumber)
  await setCachedWeekPlan(breed, weekNumber, plan).catch(() => {})

  return NextResponse.json(plan)
}
