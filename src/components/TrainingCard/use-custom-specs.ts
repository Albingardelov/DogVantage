import { useCallback, useEffect, useState } from 'react'
import type { ExerciseSpec } from '@/lib/training/exercise-specs'

/**
 * Loads the user's custom exercise specs once per dog and exposes a
 * refresh callback used after adding a new one.
 */
export function useCustomSpecs(dogId: string): {
  customSpecs: Record<string, ExerciseSpec>
  refresh: () => void
} {
  const [customSpecs, setCustomSpecs] = useState<Record<string, ExerciseSpec>>({})

  const refresh = useCallback(() => {
    if (!dogId) return
    fetch(`/api/training/custom?dogId=${encodeURIComponent(dogId)}`)
      .then((r) => r.ok ? r.json() : [])
      .then((rows: Array<{ exercise_id: string; spec: ExerciseSpec }>) => {
        const map: Record<string, ExerciseSpec> = {}
        for (const row of rows) map[row.exercise_id] = row.spec
        setCustomSpecs(map)
      })
      .catch(() => {})
  }, [dogId])

  useEffect(() => { refresh() }, [refresh])

  return { customSpecs, refresh }
}
