import { NextResponse } from 'next/server'

export function apiError(err: unknown, fallback = 'server_error'): NextResponse {
  const message = err instanceof Error ? err.message : String(err)
  console.error('[api]', message, err)
  return NextResponse.json({ error: fallback }, { status: 500 })
}
