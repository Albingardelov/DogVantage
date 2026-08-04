import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/client'

type RateLimitResult = {
  allowed: boolean
  remaining: number
  reset_at: string
}

interface RateLimitOptions {
  userId?: string
  limit?: number
  windowSeconds?: number
  scope?: string
}

const DEFAULT_LIMIT = 120
const DEFAULT_WINDOW_SECONDS = 60

function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get('x-forwarded-for')
  if (forwardedFor) return forwardedFor.split(',')[0].trim()
  const realIp = req.headers.get('x-real-ip')
  if (realIp) return realIp
  return 'unknown'
}

function buildRateLimitKey(req: NextRequest, options: RateLimitOptions): string {
  const scope = options.scope ?? 'api'
  const actor = options.userId ? `user:${options.userId}` : `ip:${getClientIp(req)}`
  return `${scope}:${req.method}:${req.nextUrl.pathname}:${actor}`
}

export async function enforceApiRateLimit(
  req: NextRequest,
  options: RateLimitOptions = {},
): Promise<NextResponse | null> {
  const key = buildRateLimitKey(req, options)
  const limit = options.limit ?? DEFAULT_LIMIT
  const windowSeconds = options.windowSeconds ?? DEFAULT_WINDOW_SECONDS

  const admin = getSupabaseAdmin() as unknown as {
    rpc: (
      name: string,
      args: Record<string, unknown>,
    ) => Promise<{ data: RateLimitResult | null; error: { message: string } | null }>
  }
  const { data, error } = await admin.rpc('check_api_rate_limit', {
    p_key: key,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  })

  if (error) {
    console.error('[rate-limit] rpc failed:', error.message)
    return null
  }

  if (data?.allowed === false) {
    return NextResponse.json(
      {
        error: 'rate_limited',
        message: 'För många förfrågningar. Försök igen snart.',
      },
      { status: 429 },
    )
  }

  return null
}
