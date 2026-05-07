import { NextRequest, NextResponse } from 'next/server'
import { getProgress, upsertProgress } from '@/lib/supabase/daily-progress'
import { createSupabaseServer } from '@/lib/supabase/server'
import type { Breed } from '@/types'

const VALID_BREEDS = ['labrador', 'italian_greyhound', 'braque_francais', 'miniature_american_shepherd']

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const breed = req.nextUrl.searchParams.get('breed') as Breed | null
  const date = req.nextUrl.searchParams.get('date')
  const dogId = req.nextUrl.searchParams.get('dogId') ?? ''

  if (!breed || !date || !VALID_BREEDS.includes(breed)) {
    return NextResponse.json({ error: 'breed and date required' }, { status: 400 })
  }
  if (!dogId) return NextResponse.json({ error: 'dogId required' }, { status: 400 })
  const { data: dog } = await supabase.from('dog_profiles').select('id').eq('id', dogId).eq('user_id', user.id).single()
  if (!dog) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  const progress = await getProgress(breed, date, dogId)
  return NextResponse.json(progress)
}

export async function PATCH(req: NextRequest) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { breed, date, dogId, exerciseId, count } = (await req.json()) as {
    breed: Breed
    date: string
    dogId?: string
    exerciseId: string
    count: number
  }

  if (!breed || !date || !exerciseId || count === undefined || !VALID_BREEDS.includes(breed)) {
    return NextResponse.json({ error: 'breed, date, exerciseId, count required' }, { status: 400 })
  }
  if (!dogId) return NextResponse.json({ error: 'dogId required' }, { status: 400 })
  const { data: dog } = await supabase.from('dog_profiles').select('id').eq('id', dogId).eq('user_id', user.id).single()
  if (!dog) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  await upsertProgress(breed, date, dogId ?? '', exerciseId, count)
  return NextResponse.json({ ok: true })
}
