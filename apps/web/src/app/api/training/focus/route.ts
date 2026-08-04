import { NextRequest, NextResponse } from 'next/server'
import { withAuthAndDog } from '@/lib/api/with-auth'
import { getWeeklyFocusPreferences, setWeeklyFocusPreferences } from '@/lib/supabase/weekly-focus'
import { currentIsoWeek, sanitizeFocusAreas, sanitizePriorityExerciseIds } from '@dogvantage/core'

function resolveIsoWeek(value: string | null): string {
  if (value && /^\d{4}-W\d{2}$/.test(value)) return value
  return currentIsoWeek()
}

export async function GET(req: NextRequest) {
  return withAuthAndDog(req, async ({ dog }) => {
    const isoWeek = resolveIsoWeek(req.nextUrl.searchParams.get('week'))
    const prefs = await getWeeklyFocusPreferences(dog.id, isoWeek)
    return NextResponse.json({
      isoWeek,
      areas: prefs.areas,
      exerciseIds: prefs.priorityExerciseIds,
    })
  })
}

export async function PUT(req: NextRequest) {
  return withAuthAndDog(req, async ({ dog }) => {
    const body = (await req.json()) as { week?: string; areas?: unknown; exerciseIds?: unknown }
    const isoWeek = resolveIsoWeek(body.week ?? null)
    const existing = await getWeeklyFocusPreferences(dog.id, isoWeek)
    const areas = body.areas === undefined ? existing.areas : sanitizeFocusAreas(body.areas)
    const exerciseIds = body.exerciseIds === undefined
      ? existing.priorityExerciseIds
      : sanitizePriorityExerciseIds(body.exerciseIds)
    await setWeeklyFocusPreferences(dog.id, isoWeek, areas, exerciseIds)
    return NextResponse.json({ isoWeek, areas, exerciseIds })
  })
}
