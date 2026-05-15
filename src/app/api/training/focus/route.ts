import { NextRequest, NextResponse } from 'next/server'
import { withAuthAndDog } from '@/lib/api/with-auth'
import { getWeeklyFocus, setWeeklyFocus } from '@/lib/supabase/weekly-focus'
import { currentIsoWeek, sanitizeFocusAreas } from '@/lib/training/weekly-focus'

function resolveIsoWeek(value: string | null): string {
  if (value && /^\d{4}-W\d{2}$/.test(value)) return value
  return currentIsoWeek()
}

export async function GET(req: NextRequest) {
  return withAuthAndDog(req, async ({ dog }) => {
    const isoWeek = resolveIsoWeek(req.nextUrl.searchParams.get('week'))
    const areas = await getWeeklyFocus(dog.id, isoWeek)
    return NextResponse.json({ isoWeek, areas })
  })
}

export async function PUT(req: NextRequest) {
  return withAuthAndDog(req, async ({ dog }) => {
    const body = (await req.json()) as { week?: string; areas?: unknown }
    const isoWeek = resolveIsoWeek(body.week ?? null)
    const areas = sanitizeFocusAreas(body.areas)
    await setWeeklyFocus(dog.id, isoWeek, areas)
    return NextResponse.json({ isoWeek, areas })
  })
}
