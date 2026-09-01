import { useCallback, useEffect, useState } from 'react'
import { MAX_WEEKLY_PRIORITY_EXERCISES } from '@dogvantage/core'
import { useAuth } from '@/lib/auth/AuthContext'
import { apiFetch } from '@/lib/api/client'

export function useWeeklyPriorities(dogId: string | undefined) {
  const { session } = useAuth()
  const [priorityIds, setPriorityIds] = useState<string[]>([])
  const [isoWeek, setIsoWeek] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    if (!session?.user?.id || !dogId) {
      setPriorityIds([])
      setIsoWeek(null)
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const res = await apiFetch(
        `/api/training/focus?dogId=${encodeURIComponent(dogId)}`,
      )
      if (!res.ok) return
      const data = (await res.json()) as { exerciseIds?: string[]; isoWeek?: string }
      setPriorityIds(Array.isArray(data.exerciseIds) ? data.exerciseIds : [])
      setIsoWeek(data.isoWeek ?? null)
    } finally {
      setLoading(false)
    }
  }, [session?.user?.id, dogId])

  useEffect(() => {
    void reload()
  }, [reload])

  const persist = useCallback(
    async (next: string[]) => {
      if (!session?.user?.id || !dogId) return
      const capped = next.slice(0, MAX_WEEKLY_PRIORITY_EXERCISES)
      setPriorityIds(capped)
      const res = await apiFetch('/api/training/focus', {
        method: 'PUT',
        body: JSON.stringify({ dogId, exerciseIds: capped }),
      })
      if (res.ok) {
        const data = (await res.json()) as { exerciseIds?: string[]; isoWeek?: string }
        if (Array.isArray(data.exerciseIds)) setPriorityIds(data.exerciseIds)
        if (data.isoWeek) setIsoWeek(data.isoWeek)
      } else {
        await reload()
      }
    },
    [session?.user?.id, dogId, reload],
  )

  const togglePriority = useCallback(
    async (exerciseId: string) => {
      const has = priorityIds.includes(exerciseId)
      if (has) {
        await persist(priorityIds.filter((id) => id !== exerciseId))
        return
      }
      if (priorityIds.length >= MAX_WEEKLY_PRIORITY_EXERCISES) return
      await persist([...priorityIds, exerciseId])
    },
    [priorityIds, persist],
  )

  const setPriorities = useCallback(
    async (ids: string[]) => {
      await persist(ids.slice(0, MAX_WEEKLY_PRIORITY_EXERCISES))
    },
    [persist],
  )

  return {
    priorityIds,
    isoWeek,
    loading,
    max: MAX_WEEKLY_PRIORITY_EXERCISES,
    togglePriority,
    setPriorities,
    reload,
  }
}
