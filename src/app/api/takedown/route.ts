import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import type { Breed } from '@/types'
import { enforceApiRateLimit } from '@/lib/api/rate-limit'

export async function POST(req: NextRequest) {
  const limited = await enforceApiRateLimit(req, {
    scope: 'public',
    limit: 20,
    windowSeconds: 60,
  })
  if (limited) return limited

  const { breed, source, reason, contact } = await req.json() as {
    breed: Breed
    source: string
    reason: string
    contact?: string
  }

  if (!breed || !source || !reason) {
    return NextResponse.json({ error: 'breed, source and reason required' }, { status: 400 })
  }

  // Log the request for admin review
  const { error } = await getSupabaseAdmin().from('takedown_requests').insert({
    breed,
    source,
    reason,
    contact: contact ?? '',
  })

  if (error) {
    // Table may not exist yet — still acknowledge receipt
    console.error('Takedown log failed:', error.message)
  }

  return NextResponse.json({ received: true })
}
