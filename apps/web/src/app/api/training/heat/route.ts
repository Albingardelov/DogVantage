import { NextRequest, NextResponse } from 'next/server'
import { withAuthAndDog } from '@/lib/api/with-auth'
import {
  getActiveHeatCycle,
  getLastEndedHeatCycle,
  startHeatCycle,
  endHeatCycle,
  isSkenfasActive,
} from '@/lib/supabase/heat-cycles'

export async function GET(req: NextRequest) {
  return withAuthAndDog(req, async ({ dog }) => {
    const [active, lastEnded] = await Promise.all([
      getActiveHeatCycle(dog.id).catch(() => null),
      getLastEndedHeatCycle(dog.id).catch(() => null),
    ])

    return NextResponse.json({
      isInHeat: !!active,
      active,
      lastEnded,
      skenfasActive: isSkenfasActive(lastEnded),
    })
  })
}

export async function POST(req: NextRequest) {
  return withAuthAndDog(req, async ({ dog }) => {
    await endHeatCycle(dog.id).catch(() => {})
    const cycle = await startHeatCycle(dog.id)
    return NextResponse.json({ active: cycle, isInHeat: true, skenfasActive: false })
  })
}

export async function DELETE(req: NextRequest) {
  return withAuthAndDog(req, async ({ dog }) => {
    await endHeatCycle(dog.id)
    const lastEnded = await getLastEndedHeatCycle(dog.id)
    return NextResponse.json({
      isInHeat: false,
      active: null,
      lastEnded,
      skenfasActive: isSkenfasActive(lastEnded),
    })
  })
}
