import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import {
  getActiveHeatCycle,
  getLastEndedHeatCycle,
  startHeatCycle,
  endHeatCycle,
  isSkenfasActive,
} from '@/lib/supabase/heat-cycles'

async function verifyDogOwnership(dogId: string): Promise<boolean> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data } = await supabase
    .from('dog_profiles')
    .select('id')
    .eq('id', dogId)
    .eq('user_id', user.id)
    .single()
  return !!data
}

export async function GET(req: NextRequest) {
  const dogId = req.nextUrl.searchParams.get('dogId')
  if (!dogId) return NextResponse.json({ error: 'dogId required' }, { status: 400 })

  if (!(await verifyDogOwnership(dogId))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const [active, lastEnded] = await Promise.all([
    getActiveHeatCycle(dogId).catch(() => null),
    getLastEndedHeatCycle(dogId).catch(() => null),
  ])

  return NextResponse.json({
    isInHeat: !!active,
    active,
    lastEnded,
    skenfasActive: isSkenfasActive(lastEnded),
  })
}

export async function POST(req: NextRequest) {
  const { dogId } = await req.json() as { dogId?: string }
  if (!dogId) return NextResponse.json({ error: 'dogId required' }, { status: 400 })

  if (!(await verifyDogOwnership(dogId))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  // End any existing active cycle first (idempotent start)
  await endHeatCycle(dogId).catch(() => {})
  const cycle = await startHeatCycle(dogId)
  return NextResponse.json({ active: cycle, isInHeat: true, skenfasActive: false })
}

export async function DELETE(req: NextRequest) {
  const { dogId } = await req.json() as { dogId?: string }
  if (!dogId) return NextResponse.json({ error: 'dogId required' }, { status: 400 })

  if (!(await verifyDogOwnership(dogId))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  await endHeatCycle(dogId)
  const lastEnded = await getLastEndedHeatCycle(dogId)
  return NextResponse.json({
    isInHeat: false,
    active: null,
    lastEnded,
    skenfasActive: isSkenfasActive(lastEnded),
  })
}
