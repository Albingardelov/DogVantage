import { useCallback, useEffect, useState } from 'react'
import type { DogStatePayload } from '@dogvantage/core'
import {
  findEnvironmentGapInsight,
  formatInsightCopy,
  type EnvironmentGapInsight,
  type InsightCopy,
} from '@dogvantage/core'
import { useAuth } from '@/lib/auth/AuthContext'
import { apiFetch } from '@/lib/api/client'
import { isInsightDismissed, setFlag } from '@/lib/storage/dismiss'

export function useInsight(dogId: string | undefined, enabled: boolean) {
  const { session } = useAuth()
  const [insight, setInsight] = useState<EnvironmentGapInsight | null>(null)
  const [copy, setCopy] = useState<InsightCopy | null>(null)
  const [busy, setBusy] = useState(false)

  const reload = useCallback(async () => {
    if (!session?.access_token || !dogId || !enabled) {
      setInsight(null)
      setCopy(null)
      return
    }
    try {
      const res = await apiFetch(
        `/api/training/dog-state?dogId=${encodeURIComponent(dogId)}`,
        session.access_token,
      )
      if (!res.ok) return
      const payload = (await res.json()) as DogStatePayload
      const found = findEnvironmentGapInsight(payload)
      if (!found) {
        setInsight(null)
        setCopy(null)
        return
      }
      const key = `insight-dismissed:${dogId}:${found.exerciseId}:${found.hardEnv}`
      if (await isInsightDismissed(key)) {
        setInsight(null)
        setCopy(null)
        return
      }
      setInsight(found)
      setCopy(formatInsightCopy(found))
    } catch {
      setInsight(null)
      setCopy(null)
    }
  }, [session?.access_token, dogId, enabled])

  useEffect(() => {
    void reload()
  }, [reload])

  const dismiss = useCallback(async () => {
    if (!dogId || !insight) return
    const key = `insight-dismissed:${dogId}:${insight.exerciseId}:${insight.hardEnv}`
    await setFlag(key, new Date().toISOString())
    setInsight(null)
    setCopy(null)
  }, [dogId, insight])

  const makePriority = useCallback(async () => {
    if (!session?.access_token || !dogId || !insight) return
    setBusy(true)
    try {
      const focusRes = await apiFetch(
        `/api/training/focus?dogId=${encodeURIComponent(dogId)}`,
        session.access_token,
      )
      const focus = focusRes.ok
        ? ((await focusRes.json()) as { exerciseIds?: string[] })
        : { exerciseIds: [] }
      const existing = focus.exerciseIds ?? []
      if (!existing.includes(insight.exerciseId)) {
        await apiFetch('/api/training/focus', session.access_token, {
          method: 'PUT',
          body: JSON.stringify({
            dogId,
            exerciseIds: [...existing, insight.exerciseId].slice(0, 3),
          }),
        })
      }
      await dismiss()
    } finally {
      setBusy(false)
    }
  }, [session?.access_token, dogId, insight, dismiss])

  return { insight, copy, busy, dismiss, makePriority, reload }
}
