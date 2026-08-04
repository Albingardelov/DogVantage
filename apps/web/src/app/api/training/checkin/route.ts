import { NextRequest, NextResponse } from 'next/server'
import { withAuthAndDog } from '@/lib/api/with-auth'
import { getCheckIn, getCheckIns, saveCheckIn } from '@/lib/supabase/daily-check-ins'
import type { PuppyZone } from '@/lib/training/puppy-zone'
import type { HandlerEnergy } from '@/lib/training/day-scaler'

const VALID_ZONES: PuppyZone[] = ['green', 'yellow', 'red']
const VALID_ENERGY: HandlerEnergy[] = ['low', 'ok', 'high']

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
    const checkIn = await getCheckIn(dog.id, date)
    return NextResponse.json({
      zone: checkIn?.zone ?? null,
      handlerEnergy: checkIn?.handler_energy ?? null,
      minutesAvailable: checkIn?.minutes_available ?? null,
    })
  })
}

export async function POST(req: NextRequest) {
  return withAuthAndDog(req, async ({ dog }) => {
    const { date, zone, handlerEnergy, minutesAvailable } = (await req.json()) as {
      date?: string
      zone?: string
      handlerEnergy?: string
      minutesAvailable?: number
    }
    if (!date || !zone || !VALID_ZONES.includes(zone as PuppyZone)) {
      return NextResponse.json({ error: 'date and valid zone required' }, { status: 400 })
    }
    if (Number.isNaN(Date.parse(date))) {
      return NextResponse.json({ error: 'invalid date format' }, { status: 400 })
    }
    if (handlerEnergy !== undefined && !VALID_ENERGY.includes(handlerEnergy as HandlerEnergy)) {
      return NextResponse.json({ error: 'invalid handlerEnergy' }, { status: 400 })
    }
    if (
      minutesAvailable !== undefined &&
      (!Number.isInteger(minutesAvailable) || minutesAvailable < 0 || minutesAvailable > 120)
    ) {
      return NextResponse.json({ error: 'invalid minutesAvailable' }, { status: 400 })
    }
    await saveCheckIn(dog.id, date, {
      zone: zone as PuppyZone,
      handler_energy: (handlerEnergy as HandlerEnergy | undefined) ?? null,
      minutes_available: minutesAvailable ?? null,
    })
    return NextResponse.json({ ok: true })
  })
}
