import { NextRequest, NextResponse } from 'next/server'
import { saveSessionLog, getRecentLogs, getAllLogs } from '@/lib/supabase/session-logs'
import type { Breed, QuickRating, ExerciseSummary } from '@/types'

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    breed: Breed
    dog_key?: string
    week_number: number
    quick_rating: QuickRating
    focus: number
    obedience: number
    handler_timing?: number
    handler_consistency?: number
    handler_reading?: number
    notes?: string
    exercises?: ExerciseSummary[]
  }

  const { breed, dog_key, week_number, quick_rating, focus, obedience,
          handler_timing, handler_consistency, handler_reading, notes, exercises } = body

  if (!breed || typeof week_number !== 'number' || !quick_rating ||
      typeof focus !== 'number' || typeof obedience !== 'number') {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const log = await saveSessionLog({
    breed, dog_key, week_number, quick_rating, focus, obedience,
    handler_timing, handler_consistency, handler_reading, notes, exercises,
  })
  return NextResponse.json(log, { status: 201 })
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const breed = searchParams.get('breed') as Breed | null
  const weekParam = searchParams.get('week')
  const dogKey = searchParams.get('dogKey') ?? undefined

  if (!breed) {
    return NextResponse.json({ error: 'breed required' }, { status: 400 })
  }

  if (weekParam !== null) {
    const weekNumber = Number(weekParam)
    if (!Number.isFinite(weekNumber)) {
      return NextResponse.json({ error: 'invalid week' }, { status: 400 })
    }
    const logs = await getRecentLogs(breed, weekNumber, undefined, dogKey)
    return NextResponse.json(logs)
  }

  const logs = await getAllLogs(breed, undefined, dogKey)
  return NextResponse.json(logs)
}
