import { NextRequest, NextResponse } from 'next/server'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import { createSupabaseServer } from '@/lib/supabase/server'
import type { Database } from '@/types/database'
import { enforceApiRateLimit } from './rate-limit'

type DogRow = { id: string; breed: string; user_id: string }

export interface DogContext {
  user: User
  dog: DogRow
  supabase: SupabaseClient<Database>
}

export async function withAuthAndDog(
  req: NextRequest,
  handler: (ctx: DogContext) => Promise<NextResponse>,
): Promise<NextResponse> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const limited = await enforceApiRateLimit(req, { userId: user.id })
  if (limited) return limited

  const body = await safeJsonBody(req)
  const dogId = req.nextUrl.searchParams.get('dogId')
    ?? (typeof body?.dogId === 'string' ? body.dogId : null)
    ?? (typeof body?.dog_id === 'string' ? body.dog_id : null)
  if (!dogId) return NextResponse.json({ error: 'dogId required' }, { status: 400 })

  const { data: dog } = await supabase
    .from('dog_profiles')
    .select('id, breed, user_id')
    .eq('id', dogId)
    .eq('user_id', user.id)
    .single()

  if (!dog) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  return handler({ user, dog: dog as DogRow, supabase })
}

async function safeJsonBody(req: NextRequest): Promise<Record<string, unknown> | null> {
  try {
    const body = await req.clone().json()
    if (!body || typeof body !== 'object') return null
    return body as Record<string, unknown>
  } catch {
    return null
  }
}

export async function withAuth(
  req: NextRequest,
  handler: (ctx: { user: User; supabase: SupabaseClient<Database> }) => Promise<NextResponse>,
): Promise<NextResponse> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const limited = await enforceApiRateLimit(req, { userId: user.id })
  if (limited) return limited
  return handler({ user, supabase })
}
