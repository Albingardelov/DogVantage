// src/app/api/training/progress/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getProgress, upsertProgress } from '@/lib/supabase/daily-progress'
import type { Breed } from '@/types'

export async function GET(req: NextRequest) {
  const breed = req.nextUrl.searchParams.get('breed') as Breed | null
  const date = req.nextUrl.searchParams.get('date')
  const dogKey = req.nextUrl.searchParams.get('dogKey') ?? 'default'

  const VALID_BREEDS = ['labrador', 'italian_greyhound', 'braque_francais', 'miniature_american_shepherd']
  if (!breed || !date || !VALID_BREEDS.includes(breed)) {
    return NextResponse.json({ error: 'breed and date required' }, { status: 400 })
  }

  const progress = await getProgress(breed, date, dogKey)
  return NextResponse.json(progress)
}

export async function PATCH(req: NextRequest) {
  const { breed, date, dogKey, exerciseId, count } = (await req.json()) as {
    breed: Breed
    date: string
    dogKey?: string
    exerciseId: string
    count: number
  }

  const VALID_BREEDS = ['labrador', 'italian_greyhound', 'braque_francais', 'miniature_american_shepherd']
  if (!breed || !date || !exerciseId || count === undefined || !VALID_BREEDS.includes(breed)) {
    return NextResponse.json({ error: 'breed, date, exerciseId, count required' }, { status: 400 })
  }

  await upsertProgress(breed, date, dogKey ?? 'default', exerciseId, count)
  return NextResponse.json({ ok: true })
}
