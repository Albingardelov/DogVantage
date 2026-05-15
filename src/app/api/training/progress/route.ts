import { NextRequest, NextResponse } from 'next/server'
import { getProgress, upsertProgress } from '@/lib/supabase/daily-progress'
import { withAuthAndDog } from '@/lib/api/with-auth'
import { isValidBreed } from '@/lib/breeds/registry'
import type { Breed } from '@/types'

export async function GET(req: NextRequest) {
  const breed = req.nextUrl.searchParams.get('breed') as Breed | null
  const date = req.nextUrl.searchParams.get('date')

  if (!breed || !date || !isValidBreed(breed)) {
    return NextResponse.json({ error: 'breed and date required' }, { status: 400 })
  }
  return withAuthAndDog(req, async ({ dog }) => {
    const progress = await getProgress(breed, date, dog.id)
    return NextResponse.json(progress)
  })
}

export async function PATCH(req: NextRequest) {
  return withAuthAndDog(req, async ({ dog }) => {
    const { breed, date, exerciseId, count } = (await req.json()) as {
      breed: Breed
      date: string
      exerciseId: string
      count: number
    }
    if (!breed || !date || !exerciseId || count === undefined || !isValidBreed(breed)) {
      return NextResponse.json({ error: 'breed, date, exerciseId, count required' }, { status: 400 })
    }
    await upsertProgress(breed, date, dog.id, exerciseId, count)
    return NextResponse.json({ ok: true })
  })
}
