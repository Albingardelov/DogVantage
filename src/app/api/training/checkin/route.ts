import { NextRequest, NextResponse } from 'next/server'
import { withAuthAndDog } from '@/lib/api/with-auth'
import { getCheckIn, getCheckIns, saveCheckIn } from '@/lib/supabase/daily-check-ins'
import type { PuppyZone } from '@/lib/training/puppy-zone'

const VALID_ZONES: PuppyZone[] = ['green', 'yellow', 'red']

export async function GET(req: NextRequest) {
  return withAuthAndDog(req, async ({ dog }) => {
    const date = req.nextUrl.searchParams.get('date')
    const from = req.nextUrl.searchParams.get('from')
    const to = req.nextUrl.searchParams.get('to')

    if (from && to) {
      const zones = await getCheckIns(dog.id, from, to)
      return NextResponse.json({ zones })
    }
    if (!date) {
      return NextResponse.json({ error: 'date or from+to required' }, { status: 400 })
    }
    const zone = await getCheckIn(dog.id, date)
    return NextResponse.json({ zone })
  })
}

export async function POST(req: NextRequest) {
  return withAuthAndDog(req, async ({ dog }) => {
    const { date, zone } = (await req.json()) as { date?: string; zone?: string }
    if (!date || !zone || !VALID_ZONES.includes(zone as PuppyZone)) {
      return NextResponse.json({ error: 'date and valid zone required' }, { status: 400 })
    }
    if (Number.isNaN(Date.parse(date))) {
      return NextResponse.json({ error: 'invalid date format' }, { status: 400 })
    }
    await saveCheckIn(dog.id, date, zone as PuppyZone)
    return NextResponse.json({ ok: true })
  })
}
