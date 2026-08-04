import { NextResponse } from 'next/server'

export function aiErrorResponse(message: string): NextResponse | null {
  if (message.includes('spending cap') || message.includes('spend cap') || message.includes('billing'))
    return NextResponse.json(
      { error: 'AI-tjänstens månadsbudget är slut. Tjänsten är pausad till nästa månad.', retryable: false },
      { status: 429 },
    )
  if (message.includes('rate_limit') || message.includes('429') || message.includes('quota'))
    return NextResponse.json(
      { error: 'För många frågor på kort tid. Vänta en minut och försök igen.', retryable: true },
      { status: 429 },
    )
  if (message.includes('503') || message.includes('unavailable') || message.includes('high demand'))
    return NextResponse.json(
      { error: 'AI-tjänsten är överbelastad just nu. Försök igen om någon minut.', retryable: true },
      { status: 503 },
    )
  return null
}
