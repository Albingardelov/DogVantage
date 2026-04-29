import { NextRequest, NextResponse } from 'next/server'
import { queryRAG } from '@/lib/ai/rag'
import { getCachedTraining, setCachedTraining } from '@/lib/supabase/training-cache'
import { getRecentLogs, formatLogsForPrompt } from '@/lib/supabase/session-logs'
import type { Breed } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const { breed, weekNumber } = await req.json() as { breed: Breed; weekNumber: number }

    if (!breed || typeof weekNumber !== 'number') {
      return NextResponse.json({ error: 'breed and weekNumber required' }, { status: 400 })
    }

    const recentLogs = await getRecentLogs(breed, weekNumber)

    if (recentLogs.length === 0) {
      const cached = await getCachedTraining(breed, weekNumber)
      if (cached) return NextResponse.json(cached)
    }

    const logStrings = formatLogsForPrompt(recentLogs)
    const query = `Vad ska jag träna vecka ${weekNumber} med min ${breed}?`
    const result = await queryRAG(query, breed, logStrings)

    if (recentLogs.length === 0) {
      await setCachedTraining(breed, weekNumber, result).catch(() => {})
    }

    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[/api/training]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
