import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { getWeeklyFocus, setWeeklyFocus } from '@/lib/supabase/weekly-focus'
import { currentIsoWeek, sanitizeFocusAreas } from '@/lib/training/weekly-focus'

async function authorizeDog(req: NextRequest, dogId: string) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthorized' as const, status: 401 }
  const { data: dog } = await supabase
    .from('dog_profiles')
    .select('id')
    .eq('id', dogId)
    .eq('user_id', user.id)
    .single()
  if (!dog) return { error: 'forbidden' as const, status: 403 }
  return { ok: true as const }
}

function resolveIsoWeek(value: string | null): string {
  if (value && /^\d{4}-W\d{2}$/.test(value)) return value
  return currentIsoWeek()
}

export async function GET(req: NextRequest) {
  const dogId = req.nextUrl.searchParams.get('dogId') ?? ''
  if (!dogId) return NextResponse.json({ error: 'dogId required' }, { status: 400 })

  const auth = await authorizeDog(req, dogId)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const isoWeek = resolveIsoWeek(req.nextUrl.searchParams.get('week'))
  const areas = await getWeeklyFocus(dogId, isoWeek)
  return NextResponse.json({ isoWeek, areas })
}

export async function PUT(req: NextRequest) {
  const body = (await req.json()) as { dogId?: string; week?: string; areas?: unknown }
  const dogId = body.dogId ?? ''
  if (!dogId) return NextResponse.json({ error: 'dogId required' }, { status: 400 })

  const auth = await authorizeDog(req, dogId)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const isoWeek = resolveIsoWeek(body.week ?? null)
  const areas = sanitizeFocusAreas(body.areas)
  await setWeeklyFocus(dogId, isoWeek, areas)
  return NextResponse.json({ isoWeek, areas })
}
