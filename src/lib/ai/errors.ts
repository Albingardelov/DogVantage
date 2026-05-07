import { NextResponse } from 'next/server'

export function aiErrorResponse(message: string): NextResponse | null {
  if (message.includes('rate_limit') || message.includes('429') || message.includes('quota'))
    return NextResponse.json({ error: 'AI-tjänsten är tillfälligt otillgänglig. Försök igen om en stund.' }, { status: 429 })
  if (message.includes('503') || message.includes('unavailable') || message.includes('high demand'))
    return NextResponse.json({ error: 'AI-tjänsten är tillfälligt otillgänglig. Försök igen om en stund.' }, { status: 503 })
  return null
}
