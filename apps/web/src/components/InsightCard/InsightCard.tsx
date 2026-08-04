'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api/fetch'
import { DogStatePayloadSchema, WeeklyFocusResponseSchema } from '@dogvantage/core'
import {
  findEnvironmentGapInsight,
  formatInsightCopy,
  type EnvironmentGapInsight,
} from '@dogvantage/core'
import { IconTarget, IconClose, IconCheck } from '@/components/icons'
import styles from './InsightCard.module.css'

interface Props {
  dogId: string
}

const DISMISS_WINDOW_MS = 14 * 24 * 60 * 60 * 1000

function dismissKey(dogId: string, insight: EnvironmentGapInsight): string {
  return `insight-dismissed:${dogId}:${insight.exerciseId}:${insight.hardEnv}`
}

function isDismissed(key: string): boolean {
  try {
    const stored = localStorage.getItem(key)
    if (!stored) return false
    return Date.now() - new Date(stored).getTime() < DISMISS_WINDOW_MS
  } catch {
    return false
  }
}

function markDismissed(key: string): void {
  try {
    localStorage.setItem(key, new Date().toISOString())
  } catch {
    // localStorage kan vara blockerad — insikten återkommer då nästa besök.
  }
}

export default function InsightCard({ dogId }: Props) {
  const [insight, setInsight] = useState<EnvironmentGapInsight | null>(null)
  const [prioritized, setPrioritized] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    apiFetch(`/api/training/dog-state?dogId=${encodeURIComponent(dogId)}`, DogStatePayloadSchema)
      .then((payload) => {
        if (cancelled) return
        const found = findEnvironmentGapInsight(payload)
        if (found && !isDismissed(dismissKey(dogId, found))) setInsight(found)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [dogId])

  if (!insight) return null
  const current = insight
  const copy = formatInsightCopy(current)

  function dismiss() {
    markDismissed(dismissKey(dogId, current))
    setInsight(null)
  }

  async function makePriority() {
    if (saving) return
    setSaving(true)
    try {
      const focus = await apiFetch(`/api/training/focus?dogId=${encodeURIComponent(dogId)}`, WeeklyFocusResponseSchema)
      if (!focus.exerciseIds.includes(current.exerciseId)) {
        await apiFetch(`/api/training/focus?dogId=${encodeURIComponent(dogId)}`, WeeklyFocusResponseSchema, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ exerciseIds: [...focus.exerciseIds, current.exerciseId] }),
        })
      }
      markDismissed(dismissKey(dogId, current))
      setPrioritized(true)
    } catch {
      // Behåll kortet så föraren kan försöka igen.
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className={styles.card} aria-labelledby="insight-card-title">
      <div className={styles.iconWrap}>
        <IconTarget size="md" />
      </div>
      <div className={styles.content}>
        <p className={styles.kicker}>Veckans insikt</p>
        <h2 id="insight-card-title" className={styles.title}>{copy.title}</h2>
        <p className={styles.body}>{copy.body}</p>
        {prioritized ? (
          <p className={styles.confirmation}>
            <IconCheck size="sm" /> Tillagd som veckans prioritet
          </p>
        ) : (
          <button type="button" className={styles.cta} onClick={makePriority} disabled={saving}>
            Gör till veckans prioritet
          </button>
        )}
      </div>
      <button type="button" className={styles.dismiss} onClick={dismiss} aria-label="Stäng insikt">
        <IconClose size="sm" />
      </button>
    </section>
  )
}
