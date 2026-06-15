'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api/fetch'
import { ExerciseHistoryPayloadSchema } from '@/types/api/schemas'

/**
 * Set of exercise ids the dog has trained before today. Supplementary —
 * fails to an empty set, which callers treat as "all practiced" (no
 * forced beginner mode) to avoid surprising experienced handlers.
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
