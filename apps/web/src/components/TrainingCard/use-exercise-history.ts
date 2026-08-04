'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api/fetch'
import { ExerciseHistoryPayloadSchema } from '@dogvantage/core'

/**
 * Set of exercise ids the dog has trained before today. Supplementary —
 * fails to an empty set. An empty set makes every exercise read as "new",
 * so a failed fetch (or a brand-new dog) falls back to the calmer guided
 * view rather than the full power view.
 */
export function useExerciseHistory(dogId: string): Set<string> {
  const [practiced, setPracticed] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!dogId) return
    let cancelled = false
    apiFetch(`/api/training/exercise-history?dogId=${encodeURIComponent(dogId)}`, ExerciseHistoryPayloadSchema)
      .then((res) => {
        if (!cancelled) setPracticed(new Set(res.practicedExerciseIds))
      })
      .catch(() => {
        // Maturity hint is supplementary — fail silently.
      })
    return () => {
      cancelled = true
    }
  }, [dogId])

  return practiced
}
