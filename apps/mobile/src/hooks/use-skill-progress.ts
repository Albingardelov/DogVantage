import { useCallback, useEffect, useState } from 'react'
import type { SkillProgress } from '@dogvantage/core'
import { useAuth } from '@/lib/auth/AuthContext'
import { apiFetch } from '@/lib/api/client'

export function useSkillProgress(dogId: string | undefined, weeks = 8) {
  const { session } = useAuth()
  const [exercises, setExercises] = useState<SkillProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!session?.user?.id || !dogId) {
      setExercises([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch(
        `/api/training/skill-progress?dogId=${encodeURIComponent(dogId)}&weeks=${weeks}`,
      )
      if (!res.ok) throw new Error('Kunde inte hämta färdigheter')
      const data = (await res.json()) as { exercises?: SkillProgress[] }
      setExercises(Array.isArray(data.exercises) ? data.exercises : [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fel')
      setExercises([])
    } finally {
      setLoading(false)
    }
  }, [session?.user?.id, dogId, weeks])

  useEffect(() => {
    void reload()
  }, [reload])

  return { exercises, loading, error, reload }
}
