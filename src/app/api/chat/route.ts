import { NextRequest, NextResponse } from 'next/server'
import { aiErrorResponse } from '@/lib/ai/errors'
import { withAuth } from '@/lib/api/with-auth'
import { apiError } from '@/lib/api/errors'
import { queryRAG } from '@/lib/ai/rag'
import { getRecentLogs, formatLogsForPrompt } from '@/lib/supabase/session-logs'
import { getMetrics } from '@/lib/supabase/daily-exercise-metrics'
import { getCachedChat, setCachedChat, touchCacheEntry } from '@/lib/supabase/training-cache'
import { incrementChatCount, DAILY_CHAT_LIMIT } from '@/lib/supabase/chat-usage'
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
    return withAuth(async ({ user }) => {
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
      const phaseAgeWeeks = typeof ageWeeks === 'number' ? ageWeeks : (typeof weekNumber === 'number' ? weekNumber : undefined)
      const shouldFetchLogs = typeof logsWeek === 'number' && Boolean(dogId)
      const shouldFetchMetrics = Boolean(dogId)

      const [logStrings, metricsStrings, cached] = await Promise.all([
        shouldFetchLogs
          ? getRecentLogs(dogId!, logsWeek!).then((logs) => formatLogsForPrompt(logs))
          : Promise.resolve([]),
        shouldFetchMetrics
          ? getMetrics(breed, todayDateString(), dogId ?? '')
            .then((metrics) => formatMetricsForPrompt(metrics))
            .catch(() => [])
          : Promise.resolve([]),
        getCachedChat(query, breed, phaseAgeWeeks).catch(() => null),
      ])

      const isPersonalized =
        logStrings.length > 0 || metricsStrings.length > 0 || !!onboardingContext
      if (!isPersonalized) {
        if (cached) {
          // LRU touch can run in the background.
          void touchCacheEntry(query, breed, phaseAgeWeeks).catch(() => {})
          return NextResponse.json(cached)
        }
      }

      const newDailyCount = await incrementChatCount(user.id)
      if (newDailyCount > DAILY_CHAT_LIMIT) {
        return NextResponse.json(
          {
            error: `Du har nått dagsgränsen på ${DAILY_CHAT_LIMIT} chat-frågor. Försök igen imorgon — eller använd träningsplanen som redan är personligt anpassad.`,
            retryable: false,
          },
          { status: 429 },
        )
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
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[/api/chat]', message)
    return aiErrorResponse(message) ?? apiError(err)
  }
}
