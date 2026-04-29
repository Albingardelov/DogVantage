import { NextRequest, NextResponse } from 'next/server'
import { queryRAG } from '@/lib/ai/rag'
import { getRecentLogs, formatLogsForPrompt } from '@/lib/supabase/session-logs'
import type { Breed } from '@/types'

export async function POST(req: NextRequest) {
  const { query, breed, weekNumber } = await req.json() as {
    query: string
    breed: Breed
    weekNumber?: number
  }

  if (!query || !breed) {
    return NextResponse.json({ error: 'query and breed required' }, { status: 400 })
  }

  const logStrings =
    typeof weekNumber === 'number'
      ? formatLogsForPrompt(await getRecentLogs(breed, weekNumber))
      : []

  const result = await queryRAG(query, breed, logStrings)
  return NextResponse.json(result)
}
