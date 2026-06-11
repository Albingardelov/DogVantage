import { NextRequest, NextResponse } from 'next/server'
import { withAuthAndDog } from '@/lib/api/with-auth'
import { getDogState } from '@/lib/supabase/dog-state'

export async function GET(req: NextRequest) {
  return withAuthAndDog(req, async ({ dog }) => {
    const state = await getDogState(dog.id)
    return NextResponse.json(state)
  })
}
