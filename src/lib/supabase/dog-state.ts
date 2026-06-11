import { getSupabaseAdmin } from './client'
import {
  computeDogState,
  type DogStatePayload,
} from '@/lib/training/dog-state'
import type { PuppyZone } from '@/lib/training/puppy-zone'
import type { SessionLog } from '@/types'
import { trackTelemetry } from '@/lib/telemetry'
import type { Json } from '@/types/database'

const STALE_MS = 6 * 60 * 60 * 1000
const METRICS_WINDOW_DAYS = 28
const CHECKIN_WINDOW_DAYS = 14
const SESSION_LOG_LIMIT = 10

function isoDaysAgo(days: number): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - days)
  return d.toISOString().slice(0, 10)
}

export async function getDogState(dogId: string): Promise<DogStatePayload> {
  const { data: cached } = await getSupabaseAdmin()
    .from('dog_state')
    .select('payload, computed_at')
    .eq('dog_id', dogId)
    .maybeSingle()

  if (cached && Date.now() - new Date(cached.computed_at).getTime() < STALE_MS) {
    return cached.payload as unknown as DogStatePayload
  }

  const previous = (cached?.payload ?? null) as DogStatePayload | null
  return recomputeDogState(dogId, previous)
}

export async function recomputeDogState(
  dogId: string,
  previous: DogStatePayload | null = null,
): Promise<DogStatePayload> {
  const started = Date.now()
  const admin = getSupabaseAdmin()

  const [metricsRes, logsRes, checkinsRes] = await Promise.all([
    admin
      .from('daily_exercise_metrics')
      .select('exercise_id, date, success_count, fail_count, criteria_level_id')
      .eq('dog_id', dogId)
      .gte('date', isoDaysAgo(METRICS_WINDOW_DAYS)),
    admin
      .from('session_logs')
      .select('*')
      .eq('dog_id', dogId)
      .order('created_at', { ascending: false })
      .limit(SESSION_LOG_LIMIT),
    admin
      .from('daily_check_ins')
      .select('date, zone')
      .eq('dog_id', dogId)
      .gte('date', isoDaysAgo(CHECKIN_WINDOW_DAYS)),
  ])

  if (metricsRes.error) throw new Error(`metrics fetch failed: ${metricsRes.error.message}`)
  if (logsRes.error) throw new Error(`session logs fetch failed: ${logsRes.error.message}`)
  if (checkinsRes.error) throw new Error(`check-ins fetch failed: ${checkinsRes.error.message}`)

  const payload = computeDogState({
    metrics: metricsRes.data ?? [],
    sessionLogs: (logsRes.data ?? []) as unknown as SessionLog[],
    checkIns: Object.fromEntries(
      (checkinsRes.data ?? []).map((r) => [r.date, r.zone as PuppyZone]),
    ),
  })

  payload.thresholdAdjustments = previous?.thresholdAdjustments ?? {}

  // A failed cache write must not fail the read path — the payload is already valid.
  const { error } = await admin
    .from('dog_state')
    .upsert(
      { dog_id: dogId, payload: payload as unknown as Json, computed_at: new Date().toISOString() },
      { onConflict: 'dog_id' },
    )
  if (error) {
    console.warn('[dog-state] upsert failed:', error.message)
  }

  trackTelemetry('dog_state_computed', {
    dogId,
    durationMs: Date.now() - started,
    metricsRows: metricsRes.data?.length ?? 0,
    sessionLogs: logsRes.data?.length ?? 0,
    checkIns: checkinsRes.data?.length ?? 0,
  })

  return payload
}
