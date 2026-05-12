import { NextResponse } from 'next/server'

export function aiErrorResponse(message: string): NextResponse | null {
  if (message.includes('rate_limit') || message.includes('429') || message.includes('quota'))
    return NextResponse.json({ error: 'Dagens AI-kvot är slut. Försök igen senare (eller imorgon).' }, { status: 429 })
  if (message.includes('503') || message.includes('unavailable') || message.includes('high demand'))
    return NextResponse.json({ error: 'AI-tjänsten är överbelastad just nu. Försök igen om någon minut.' }, { status: 503 })
  return null
}
