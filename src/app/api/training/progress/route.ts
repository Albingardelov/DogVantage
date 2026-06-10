import { NextRequest, NextResponse } from 'next/server'
import { getProgress, upsertProgress } from '@/lib/supabase/daily-progress'
import { withAuthAndDog } from '@/lib/api/with-auth'

export async function GET(req: NextRequest) {
  const requestedBreed = req.nextUrl.searchParams.get('breed')
  const date = req.nextUrl.searchParams.get('date')

  if (!date) {
    return NextResponse.json({ error: 'date required' }, { status: 400 })
  }
  return withAuthAndDog(req, async ({ dog }) => {
    if (requestedBreed && requestedBreed !== dog.breed) {
      console.warn(`[GET /api/training/progress] ignored mismatched breed query="${requestedBreed}" for dog=${dog.id}`)
    }
    const progress = await getProgress(dog.breed, date, dog.id)
    return NextResponse.json(progress)
  })
}

export async function PATCH(req: NextRequest) {
  return withAuthAndDog(req, async ({ dog }) => {
    const { date, exerciseId, count } = (await req.json()) as {
      date: string
      exerciseId: string
      count: number
    }
    if (!date || !exerciseId || count === undefined) {
      return NextResponse.json({ error: 'date, exerciseId, count required' }, { status: 400 })
    }
    await upsertProgress(dog.breed, date, dog.id, exerciseId, count)
    return NextResponse.json({ ok: true })
  })
}
