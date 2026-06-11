import { NextRequest, NextResponse } from 'next/server'
import { withAuthAndDog } from '@/lib/api/with-auth'
import { apiError } from '@/lib/api/errors'
import { getStruggleAdvice, type CoachTip } from '@/lib/ai/doc-learning'
import type { Json } from '@/types/database'
import type { Breed, QuickRating, ExerciseSummary } from '@/types'

const STRUGGLE_MIN_ATTEMPTS = 4
const STRUGGLE_MAX_RATE = 0.5

function findStrugglingExercise(exercises: ExerciseSummary[] | undefined): ExerciseSummary | null {
  if (!exercises || exercises.length === 0) return null
  let worst: ExerciseSummary | null = null
  let worstRate = STRUGGLE_MAX_RATE
  for (const ex of exercises) {
    const attempts = ex.success_count + ex.fail_count
    if (attempts < STRUGGLE_MIN_ATTEMPTS) continue
    const rate = ex.success_count / attempts
    if (rate < worstRate) {
      worstRate = rate
      worst = ex
    }
  }
  return worst
}

export async function POST(req: NextRequest) {
  return withAuthAndDog(req, async ({ user, dog, supabase }) => {
    const body = await req.json() as {
      breed?: string
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
    if (typeof week_number !== 'number' || !quick_rating ||
      typeof focus !== 'number' || typeof obedience !== 'number') {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    if (breed && breed !== dog.breed) {
      console.warn(`[POST /api/logs] ignored mismatched breed body="${breed}" for dog=${dog.id}`)
    }

    const { data, error } = await supabase
      .from('session_logs')
      .insert({
        user_id: user.id,
        dog_id: dog.id,
        breed: dog.breed,
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

    // If one exercise clearly struggled, attach source-cited coaching advice.
    // Cached per (breed, exercise) so this is usually instant; failures are
    // silent — the saved log is the critical path, the tip is a bonus.
    let coachTip: CoachTip | null = null
    const struggling = findStrugglingExercise(exercises)
    if (struggling) {
      coachTip = await getStruggleAdvice(dog.breed as Breed, struggling.id).catch(() => null)
    }

    return NextResponse.json({ ...data, coachTip }, { status: 201 })
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
