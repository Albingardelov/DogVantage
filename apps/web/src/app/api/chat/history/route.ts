import { NextRequest, NextResponse } from 'next/server'
import { withAuthAndDog } from '@/lib/api/with-auth'
import { getChatMessages } from '@/lib/supabase/chat-messages'

const HISTORY_FETCH_LIMIT = 30

export async function GET(req: NextRequest) {
  return withAuthAndDog(req, async ({ dog, supabase }) => {
    const messages = await getChatMessages(supabase, dog.id, HISTORY_FETCH_LIMIT)
    return NextResponse.json({ messages })
  })
}
