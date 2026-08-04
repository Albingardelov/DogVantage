'use client'

import { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '@/lib/api/fetch'
import { ExerciseSourcesResponseSchema } from '@dogvantage/core'
import type { TrainingSourceRef } from '@dogvantage/core'

/**
 * Fetches cached "läs mer" document sources for today's exercises.
 * Server caches per (breed, exercise) so this is cheap after first load.
 */
export function useExerciseSources(
  dogId: string,
  exerciseIds: string[],
): Record<string, TrainingSourceRef[]> {
  const [sources, setSources] = useState<Record<string, TrainingSourceRef[]>>({})
  const idsKey = useMemo(() => [...exerciseIds].sort().join(','), [exerciseIds])

  useEffect(() => {
    if (!dogId || !idsKey) return
    let cancelled = false
    const url = `/api/training/exercise-sources?dogId=${encodeURIComponent(dogId)}&ids=${encodeURIComponent(idsKey)}`
    apiFetch(url, ExerciseSourcesResponseSchema)
      .then((res) => {
        if (!cancelled) setSources(res.sources)
      })
      .catch(() => {
        // Source links are supplementary — fail silently.
      })
    return () => {
      cancelled = true
    }
  }, [dogId, idsKey])

  return sources
}
