import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import type { Json } from '@/types/database'
import type { Breed, QuickRating, ExerciseSummary } from '@/types'

async function assertDogOwnership(
  supabase: Awaited<ReturnType<typeof createSupabaseServer>>,
  dogId: string,
  userId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from('dog_profiles')
    .select('id')
    .eq('id', dogId)
    .eq('user_id', userId)
    .single()
  return Boolean(data)
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await req.json() as {
    dog_id?: string
    breed: Breed
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

  const { dog_id, breed, week_number, quick_rating, focus, obedience,
          handler_timing, handler_consistency, handler_reading, notes, exercises } = body

  if (!dog_id || typeof dog_id !== 'string') {
    return NextResponse.json({ error: 'dog_id required' }, { status: 400 })
  }
  if (!breed || typeof week_number !== 'number' || !quick_rating ||
      typeof focus !== 'number' || typeof obedience !== 'number') {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  if (!(await assertDogOwnership(supabase, dog_id, user.id))) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('session_logs')
    .insert({
      user_id: user.id,
      dog_id,
      breed,
      week_number,
      quick_rating,
      focus,
      obedience,
      handler_timing,
      handler_consistency,
      handler_reading,
      notes,
      // ExerciseSummary[] is structurally Json but TS needs the cast at the boundary
      exercises: (exercises ?? null) as Json,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const dogId = searchParams.get('dogId')
  const weekParam = searchParams.get('week')

  if (!dogId) {
    return NextResponse.json({ error: 'dogId required' }, { status: 400 })
  }
  if (!(await assertDogOwnership(supabase, dogId, user.id))) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  if (weekParam !== null) {
    const weekNumber = Number(weekParam)
    if (!Number.isFinite(weekNumber)) {
      return NextResponse.json({ error: 'invalid week' }, { status: 400 })
    }
    const { data, error } = await supabase
      .from('session_logs')
      .select('*')
      .eq('dog_id', dogId)
      .eq('week_number', weekNumber)
      .order('created_at', { ascending: false })
      .limit(5)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data ?? [])
  }

  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const hasRange = Boolean(from && to)

  let q = supabase
    .from('session_logs')
    .select('*')
    .eq('dog_id', dogId)

  if (from) q = q.gte('created_at', from)
  if (to) q = q.lt('created_at', to)

  q = q.order('created_at', { ascending: false })

  const defaultLimit = hasRange ? 500 : 30
  const limitParam = searchParams.get('limit')
  const parsedLimit = limitParam != null ? Number(limitParam) : defaultLimit
  const limit = Number.isFinite(parsedLimit)
    ? Math.min(500, Math.max(1, parsedLimit))
    : defaultLimit

  const { data, error } = await q.limit(limit)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
