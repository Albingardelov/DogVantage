import { NextRequest, NextResponse } from 'next/server'
import { saveSessionLog, getRecentLogs } from '@/lib/supabase/session-logs'
import type { Breed, QuickRating } from '@/types'

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    breed: Breed
    week_number: number
    quick_rating: QuickRating
    focus: number
    obedience: number
    notes?: string
  }

  const { breed, week_number, quick_rating, focus, obedience, notes } = body

  if (!breed || typeof week_number !== 'number' || !quick_rating ||
      typeof focus !== 'number' || typeof obedience !== 'number') {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const log = await saveSessionLog({ breed, week_number, quick_rating, focus, obedience, notes })
  return NextResponse.json(log, { status: 201 })
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const breed = searchParams.get('breed') as Breed | null
  const weekNumber = searchParams.get('week') ? Number(searchParams.get('week')) : undefined

  if (!breed || typeof weekNumber !== 'number') {
    return NextResponse.json({ error: 'breed and week required' }, { status: 400 })
  }

  const logs = await getRecentLogs(breed, weekNumber)
  return NextResponse.json(logs)
}
