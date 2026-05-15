import { NextRequest, NextResponse } from 'next/server'
import { withAuthAndDog } from '@/lib/api/with-auth'
import { apiError } from '@/lib/api/errors'
import type { Json } from '@/types/database'
import type { Breed, QuickRating, ExerciseSummary } from '@/types'

export async function POST(req: NextRequest) {
  return withAuthAndDog(req, async ({ user, dog, supabase }) => {
    const body = await req.json() as {
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

    const { breed, week_number, quick_rating, focus, obedience,
      handler_timing, handler_consistency, handler_reading, notes, exercises } = body
    if (!breed || typeof week_number !== 'number' || !quick_rating ||
      typeof focus !== 'number' || typeof obedience !== 'number') {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('session_logs')
      .insert({
        user_id: user.id,
        dog_id: dog.id,
        breed,
        week_number,
        quick_rating,
        focus,
        obedience,
        handler_timing,
        handler_consistency,
        handler_reading,
        notes,
        exercises: (exercises ?? null) as Json,
      })
      .select()
      .single()

    if (error) return apiError(error, 'failed_to_save_log')
    return NextResponse.json(data, { status: 201 })
  })
}

export async function GET(req: NextRequest) {
  return withAuthAndDog(req, async ({ dog, supabase }) => {
    const { searchParams } = new URL(req.url)
    const weekParam = searchParams.get('week')

    if (weekParam !== null) {
      const weekNumber = Number(weekParam)
      if (!Number.isFinite(weekNumber)) {
        return NextResponse.json({ error: 'invalid week' }, { status: 400 })
      }
      const { data, error } = await supabase
        .from('session_logs')
        .select('*')
        .eq('dog_id', dog.id)
        .eq('week_number', weekNumber)
        .order('created_at', { ascending: false })
        .limit(5)
      if (error) return apiError(error, 'failed_to_load_logs')
      return NextResponse.json(data ?? [])
    }

    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const hasRange = Boolean(from && to)

    let q = supabase
      .from('session_logs')
      .select('*')
      .eq('dog_id', dog.id)

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
    if (error) return apiError(error, 'failed_to_load_logs')
    return NextResponse.json(data ?? [])
  })
}
