import { NextRequest, NextResponse } from 'next/server'
import { aiErrorResponse } from '@/lib/ai/errors'
import { createSupabaseServer } from '@/lib/supabase/server'
import { queryRAG } from '@/lib/ai/rag'
import { getRecentLogs, formatLogsForPrompt } from '@/lib/supabase/session-logs'
import { getMetrics } from '@/lib/supabase/daily-exercise-metrics'
import { getCachedChat, setCachedChat } from '@/lib/supabase/training-cache'
import type { Breed } from '@/types'

function todayDateString(): string {
  return new Date().toISOString().split('T')[0]
}

function formatMetricsForPrompt(metrics: Record<string, import('@/types').DailyExerciseMetrics>): string[] {
  return Object.entries(metrics)
    .map(([exerciseId, m]) => {
      const attempts = (m.success_count ?? 0) + (m.fail_count ?? 0)
      const rate = attempts > 0 ? Math.round(((m.success_count ?? 0) / attempts) * 100) : null
      const bits = [
        exerciseId,
        m.criteria_level_id ? `nivå ${m.criteria_level_id}` : null,
        rate != null ? `${rate}% (${m.success_count}/${attempts})` : null,
        m.latency_bucket ? `latens ${m.latency_bucket}` : null,
      ].filter(Boolean)
      return bits.join(', ')
    })
    .slice(0, 12)
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const { query, breed, weekNumber, ageWeeks, trainingWeek, dogId, onboardingContext } = await req.json() as {
      query: string
      breed: Breed
      weekNumber?: number
      ageWeeks?: number
      trainingWeek?: number
      dogId?: string
      onboardingContext?: string
    }

    if (!query || !breed) {
      return NextResponse.json({ error: 'query and breed required' }, { status: 400 })
    }

    const logsWeek = typeof trainingWeek === 'number'
      ? trainingWeek
      : (typeof weekNumber === 'number' ? weekNumber : undefined)

    const logStrings =
      typeof logsWeek === 'number' && dogId
        ? formatLogsForPrompt(await getRecentLogs(dogId, logsWeek))
        : []

    let metricsStrings: string[] = []
    try {
      const metrics = await getMetrics(breed, todayDateString(), dogId ?? '')
      metricsStrings = formatMetricsForPrompt(metrics)
    } catch {
      // best-effort
    }

    const phaseAgeWeeks = typeof ageWeeks === 'number' ? ageWeeks : (typeof weekNumber === 'number' ? weekNumber : undefined)

    const isPersonalized =
      logStrings.length > 0 || metricsStrings.length > 0 || !!onboardingContext
    if (!isPersonalized) {
      const cached = await getCachedChat(query, breed, phaseAgeWeeks)
      if (cached) return NextResponse.json(cached)
    }

    const result = await queryRAG(query, breed, logStrings, phaseAgeWeeks, metricsStrings, onboardingContext)

    if (!isPersonalized) {
      try {
        await setCachedChat(query, breed, result, phaseAgeWeeks)
      } catch (err) {
        console.error('[/api/chat] cache write failed', err)
      }
    }

    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[/api/chat]', message)
    return aiErrorResponse(message) ?? NextResponse.json({ error: message }, { status: 500 })
  }
}
