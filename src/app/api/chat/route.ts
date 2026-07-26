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
import { isSupportedLocale, DEFAULT_LOCALE } from '@/i18n/config'
import { getAgeInWeeks } from '@/lib/dog/age'
import { getBehaviorContextPayloadFromDb } from '@/lib/dog/build-behavior-context'
import { extractChatTopic } from '@/lib/dog/chat-topics'
import { summarizeDogTimeline } from '@/lib/dog/timeline'
import { logChatTopic, getRecentChatTopics } from '@/lib/supabase/chat-topics'
import { getActiveProject } from '@/lib/supabase/training-projects'
import { PROTOCOL_BY_CHAT_TOPIC, TRAINING_PROTOCOLS } from '@/lib/training/training-projects'
import { getCheckIns } from '@/lib/supabase/daily-check-ins'
import { getChatMessages, appendChatExchange } from '@/lib/supabase/chat-messages'
import { getDogState } from '@/lib/supabase/dog-state'
import { formatDogStateForPrompt } from '@/lib/ai/dog-state-context'
import { CHUNK_TOPICS, type ChunkTopic, type LifeStageFilter } from '@/lib/learning/chunk-metadata'
import type { ChatHistoryEntry } from '@/lib/ai/rag'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const LIFE_STAGE_FILTERS = ['puppy', 'junior', 'adolescent', 'adult', 'all'] as const satisfies readonly LifeStageFilter[]

function parseChunkTopic(value: string | undefined): ChunkTopic | undefined {
  if (!value) return undefined
  return (CHUNK_TOPICS as readonly string[]).includes(value) ? (value as ChunkTopic) : undefined
}

function parseLifeStageFilter(value: string | undefined): LifeStageFilter | undefined {
  if (!value) return undefined
  return (LIFE_STAGE_FILTERS as readonly string[]).includes(value) ? (value as LifeStageFilter) : undefined
}

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

const PROMPT_HISTORY_LIMIT = 8
const HISTORY_CHAR_LIMIT = 1000

/**
 * Stänger loopen chatt → plan: matchar frågan ett startbart träningsprojekt
 * som inte redan är aktivt, föreslås det synligt i chatten.
 */
async function suggestProjectForQuery(
  dogId: string,
  query: string,
): Promise<{ protocolId: string; label: string } | null> {
  const topic = extractChatTopic(query)
  const protocolId = topic ? PROTOCOL_BY_CHAT_TOPIC[topic] : undefined
  if (!protocolId) return null
  const protocol = TRAINING_PROTOCOLS[protocolId]
  try {
    const active = await getActiveProject(dogId)
    if (active?.protocol_id === protocolId) return null
  } catch {
    return null
  }
  return { protocolId, label: protocol.label }
}

async function persistExchange(
  supabase: SupabaseClient<Database>,
  dogId: string,
  query: string,
  answer: string,
): Promise<void> {
  try {
    await appendChatExchange(supabase, dogId, query, answer)
  } catch (e) {
    console.warn('[/api/chat] history persist failed:', e instanceof Error ? e.message : String(e))
  }
}

export async function POST(req: NextRequest) {
  try {
    return withAuthAndDog(req, async ({ user, dog, supabase }) => {
      const body = await req.json() as {
        query?: string
        locale?: string
        topic?: string
        lifeStage?: string
      }
      const query = body.query
      const locale = isSupportedLocale(body.locale) ? body.locale : DEFAULT_LOCALE
      const topic = parseChunkTopic(body.topic)
      const lifeStage = parseLifeStageFilter(body.lifeStage)
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

      const [logStrings, metricsStrings, cached, historyRows, dogStateContext] = await Promise.all([
        shouldFetchLogs
          ? getRecentLogs(dog.id, logsWeek!).then((logs) => formatLogsForPrompt(logs))
          : Promise.resolve([]),
        shouldFetchMetrics
          ? getMetrics(breed, todayDateString(), dog.id)
            .then((metrics) => formatMetricsForPrompt(metrics))
            .catch(() => [])
          : Promise.resolve([]),
        getCachedChat(query, breed, locale, ageWeeks).catch(() => null),
        getChatMessages(supabase, dog.id, PROMPT_HISTORY_LIMIT).catch(() => []),
        getDogState(dog.id)
          .then((state) => formatDogStateForPrompt(state))
          .catch(() => null),
      ])

      const history: ChatHistoryEntry[] = historyRows.map((m) => ({
        role: m.role,
        content: m.content.slice(0, HISTORY_CHAR_LIMIT),
      }))

      const isPersonalized =
        logStrings.length > 0 || metricsStrings.length > 0 || !!chatContext ||
        history.length > 0 || !!dogStateContext
      // Den delade cachen tjänar bara frågor utan personlig kontext (effektivt
      // ekipagets första fråga); så fort historik eller dog-state finns är svaret
      // personligt och får aldrig serveras från en bredd/ålder-nyckel.
      if (!isPersonalized) {
        if (cached) {
          // LRU touch can run in the background.
          void touchCacheEntry(query, breed, locale, ageWeeks).catch(() => {})
          await persistExchange(supabase, dog.id, query, cached.content)
          const suggestedProject = await suggestProjectForQuery(dog.id, query)
          return NextResponse.json(suggestedProject ? { ...cached, suggestedProject } : cached)
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

      // Persistens täcker även guard-svaren (VET/BEHAVIOR) — de returneras som vanliga TrainingResult.
      const result = await queryRAG(query, breed, logStrings, ageWeeks, metricsStrings, chatContext, {
        history,
        dogStateContext,
        locale,
        topic,
        lifeStage,
      })

      await persistExchange(supabase, dog.id, query, result.content)

      if (!isPersonalized) {
        try {
          await setCachedChat(query, breed, locale, result, ageWeeks)
        } catch (err) {
          console.error('[/api/chat] cache write failed', err)
        }
      }

      const chatTopic = extractChatTopic(query)
      if (chatTopic) {
        void logChatTopic(dog.id, chatTopic).catch(() => {
          // Ämnesloggning är telemetri — får aldrig fälla chatsvaret.
        })
      }

      const suggestedProject = await suggestProjectForQuery(dog.id, query)
      return NextResponse.json(suggestedProject ? { ...result, suggestedProject } : result)
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[/api/chat]', message)
    return aiErrorResponse(message) ?? apiError(err)
  }
}
