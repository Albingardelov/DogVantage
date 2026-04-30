import { NextRequest, NextResponse } from 'next/server'
import { generateWeekPlan } from '@/lib/ai/week-plan'
import { getCachedWeekPlan, setCachedWeekPlan } from '@/lib/supabase/training-cache'
import type { Breed, TrainingGoal } from '@/types'

const VALID_GOALS: TrainingGoal[] = ['everyday_obedience', 'sport', 'hunting', 'problem_solving']

export async function GET(req: NextRequest) {
  const breed = req.nextUrl.searchParams.get('breed') as Breed | null
  const weekStr = req.nextUrl.searchParams.get('week')
  const trainingWeek = weekStr ? Number(weekStr) : NaN
  const ageWeeksStr = req.nextUrl.searchParams.get('ageWeeks')
  const ageWeeks = ageWeeksStr != null ? Number(ageWeeksStr) : undefined
  const goalsStr = req.nextUrl.searchParams.get('goals')
  const goals = goalsStr
    ? (goalsStr.split(',').filter((g) => VALID_GOALS.includes(g as TrainingGoal)) as TrainingGoal[])
    : undefined

  const VALID_BREEDS = ['labrador', 'italian_greyhound', 'braque_francais']
  if (!breed || isNaN(trainingWeek) || !VALID_BREEDS.includes(breed)) {
    return NextResponse.json({ error: 'breed and week required' }, { status: 400 })
  }

  const cached = await getCachedWeekPlan(breed, trainingWeek, ageWeeks, goals)
  if (cached) return NextResponse.json(cached)

  const plan = await generateWeekPlan(breed, trainingWeek, ageWeeks, goals)
  await setCachedWeekPlan(breed, trainingWeek, plan, ageWeeks, goals).catch(() => {})

  return NextResponse.json(plan)
}
