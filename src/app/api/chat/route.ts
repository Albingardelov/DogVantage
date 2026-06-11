import { NextRequest, NextResponse } from 'next/server'
import { aiErrorResponse } from '@/lib/ai/errors'
import { withAuthAndDog } from '@/lib/api/with-auth'
import { apiError } from '@/lib/api/errors'
import { getSubscriptionState, hasFeature } from '@/lib/billing/subscription'
import { queryRAG } from '@/lib/ai/rag'
import { getRecentLogs, formatLogsForPrompt } from '@/lib/supabase/session-logs'
import { getMetrics } from '@/lib/supabase/daily-exercise-metrics'
import { getCachedChat, setCachedChat, touchCacheEntry } from '@/lib/supabase/training-cache'
import { incrementChatCount, DAILY_CHAT_LIMIT } from '@/lib/supabase/chat-usage'
import { detectSecretExposure } from '@/lib/ai/safety-guards'
import { getAgeInWeeks } from '@/lib/dog/age'
import { getBehaviorContextPayloadFromDb } from '@/lib/dog/build-behavior-context'
import { extractChatTopic } from '@/lib/dog/chat-topics'
import { summarizeDogTimeline } from '@/lib/dog/timeline'
import { logChatTopic, getRecentChatTopics } from '@/lib/supabase/chat-topics'
import { getCheckIns } from '@/lib/supabase/daily-check-ins'

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
    return withAuthAndDog(req, async ({ user, dog, supabase }) => {
      const { query } = await req.json() as {
        query: string
      }

      if (!query) {
        return NextResponse.json({ error: 'query required' }, { status: 400 })
      }

      const { data: profile } = await supabase
        .from('dog_profiles')
        .select('birthdate, training_week')
        .eq('id', dog.id)
        .single()
      const { context: onboardingContext } = await getBehaviorContextPayloadFromDb(supabase, dog.id)

      const timelineContext = await (async () => {
        try {
          const since = new Date()
          since.setUTCDate(since.getUTCDate() - 14)
          const [checkIns, recentTopics] = await Promise.all([
            getCheckIns(dog.id, since.toISOString().slice(0, 10), todayDateString()),
            getRecentChatTopics(dog.id),
          ])
          return summarizeDogTimeline({ checkIns, recentTopics })
        } catch {
          return null
        }
      })()
      const chatContext = [onboardingContext, timelineContext].filter(Boolean).join('\n') || undefined

      const ageWeeks = profile?.birthdate ? Math.max(1, getAgeInWeeks(profile.birthdate)) : undefined
      const logsWeek = typeof profile?.training_week === 'number' ? profile.training_week : undefined
      const breed = dog.breed

      if (!breed) {
        return NextResponse.json({ error: 'dog profile breed missing' }, { status: 400 })
      }
      if (detectSecretExposure(query) || detectSecretExposure(onboardingContext)) {
        return NextResponse.json(
          {
            error: 'Känslig information upptäckt i texten (t.ex. API-nyckel/token). Ta bort hemligheter och försök igen.',
            retryable: false,
          },
          { status: 400 },
        )
      }
      const subscription = await getSubscriptionState(user.id)
      if (!hasFeature(subscription, 'ai_chat')) {
        return NextResponse.json(
          { error: 'payment_required', feature: 'ai_chat' },
          { status: 402 },
        )
      }

      const shouldFetchLogs = typeof logsWeek === 'number'
      const shouldFetchMetrics = Boolean(dog.id)

      const [logStrings, metricsStrings, cached] = await Promise.all([
        shouldFetchLogs
          ? getRecentLogs(dog.id, logsWeek!).then((logs) => formatLogsForPrompt(logs))
          : Promise.resolve([]),
        shouldFetchMetrics
          ? getMetrics(breed, todayDateString(), dog.id)
            .then((metrics) => formatMetricsForPrompt(metrics))
            .catch(() => [])
          : Promise.resolve([]),
        getCachedChat(query, breed, ageWeeks).catch(() => null),
      ])

      const isPersonalized =
        logStrings.length > 0 || metricsStrings.length > 0 || !!chatContext
      if (!isPersonalized) {
        if (cached) {
          // LRU touch can run in the background.
          void touchCacheEntry(query, breed, ageWeeks).catch(() => {})
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

      const result = await queryRAG(query, breed, logStrings, ageWeeks, metricsStrings, chatContext)

      if (!isPersonalized) {
        try {
          await setCachedChat(query, breed, result, ageWeeks)
        } catch (err) {
          console.error('[/api/chat] cache write failed', err)
        }
      }

      const topic = extractChatTopic(query)
      if (topic) {
        void logChatTopic(dog.id, topic).catch(() => {
          // Ämnesloggning är telemetri — får aldrig fälla chatsvaret.
        })
      }

      return NextResponse.json(result)
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[/api/chat]', message)
    return aiErrorResponse(message) ?? apiError(err)
  }
}
