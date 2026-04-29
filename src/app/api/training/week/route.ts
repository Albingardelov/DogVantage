import { NextRequest, NextResponse } from 'next/server'
import { generateWeekPlan } from '@/lib/ai/week-plan'
import { getCachedWeekPlan, setCachedWeekPlan } from '@/lib/supabase/training-cache'
import type { Breed } from '@/types'

export async function GET(req: NextRequest) {
  const breed = req.nextUrl.searchParams.get('breed') as Breed | null
  const weekStr = req.nextUrl.searchParams.get('week')
  const trainingWeek = weekStr ? Number(weekStr) : NaN
  const ageWeeksStr = req.nextUrl.searchParams.get('ageWeeks')
  const ageWeeks = ageWeeksStr != null ? Number(ageWeeksStr) : undefined

  const VALID_BREEDS = ['labrador', 'italian_greyhound', 'braque_francais']
  if (!breed || isNaN(trainingWeek) || !VALID_BREEDS.includes(breed)) {
    return NextResponse.json({ error: 'breed and week required' }, { status: 400 })
  }

  const cached = await getCachedWeekPlan(breed, trainingWeek)
  if (cached) return NextResponse.json(cached)

  const plan = await generateWeekPlan(breed, trainingWeek, ageWeeks)
  await setCachedWeekPlan(breed, trainingWeek, plan).catch(() => {})

  return NextResponse.json(plan)
}
