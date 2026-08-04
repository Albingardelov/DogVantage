import { NextRequest, NextResponse } from 'next/server'
import { withAuthAndDog } from '@/lib/api/with-auth'
import { getPracticedExerciseIds } from '@/lib/supabase/exercise-history'

export async function GET(req: NextRequest) {
  return withAuthAndDog(req, async ({ dog }) => {
    const today = new Date().toISOString().slice(0, 10)
    try {
      const practicedExerciseIds = await getPracticedExerciseIds(dog.id, today)
      return NextResponse.json({ practicedExerciseIds })
    } catch {
      return NextResponse.json({ practicedExerciseIds: [] })
    }
  })
}
