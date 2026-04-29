// src/app/api/training/progress/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getProgress, upsertProgress } from '@/lib/supabase/daily-progress'
import type { Breed } from '@/types'

export async function GET(req: NextRequest) {
  const breed = req.nextUrl.searchParams.get('breed') as Breed | null
  const date = req.nextUrl.searchParams.get('date')

  if (!breed || !date) {
    return NextResponse.json({ error: 'breed and date required' }, { status: 400 })
  }

  const progress = await getProgress(breed, date)
  return NextResponse.json(progress)
}

export async function PATCH(req: NextRequest) {
  const { breed, date, exerciseId, count } = (await req.json()) as {
    breed: Breed
    date: string
    exerciseId: string
    count: number
  }

  if (!breed || !date || !exerciseId || count === undefined) {
    return NextResponse.json({ error: 'breed, date, exerciseId, count required' }, { status: 400 })
  }

  await upsertProgress(breed, date, exerciseId, count)
  return NextResponse.json({ ok: true })
}
