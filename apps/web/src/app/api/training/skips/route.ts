import { NextRequest, NextResponse } from 'next/server'
import { withAuthAndDog } from '@/lib/api/with-auth'
import { apiError } from '@/lib/api/errors'
import { logExerciseSkip } from '@/lib/supabase/exercise-skips'

const EXERCISE_ID_PATTERN = /^[a-z0-9_]+$/

export async function POST(req: NextRequest) {
  return withAuthAndDog(req, async ({ dog }) => {
    try {
      const body = (await req.json()) as { exerciseId?: unknown }
      const exerciseId = typeof body.exerciseId === 'string' ? body.exerciseId.trim().toLowerCase() : ''
      if (!exerciseId || !EXERCISE_ID_PATTERN.test(exerciseId)) {
        return NextResponse.json({ error: 'invalid exerciseId' }, { status: 400 })
      }
      await logExerciseSkip(dog.id, exerciseId, new Date().toISOString().slice(0, 10))
      return NextResponse.json({ ok: true })
    } catch (err) {
      return apiError(err, 'skip_log_failed')
    }
  })
}
