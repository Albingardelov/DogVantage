import { useCallback, useEffect, useState } from 'react'
import { CurriculumOverviewSchema } from '@dogvantage/core'
import type { z } from 'zod'
import { useAuth } from '@/lib/auth/AuthContext'
import { apiFetch } from '@/lib/api/client'

type CurriculumOverview = z.infer<typeof CurriculumOverviewSchema>
export type CurriculumModule = CurriculumOverview['modules'][number]

export function useCurriculum(dogId: string | undefined) {
  const { session } = useAuth()
  const [overview, setOverview] = useState<CurriculumOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [completingId, setCompletingId] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!session?.user?.id || !dogId) {
      setOverview(null)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch(
        `/api/learning/curriculum?dogId=${encodeURIComponent(dogId)}`,
      )
      if (!res.ok) throw new Error('Kunde inte hämta kursen')
      setOverview(CurriculumOverviewSchema.parse(await res.json()))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fel')
      setOverview(null)
    } finally {
      setLoading(false)
    }
  }, [session?.user?.id, dogId])

  useEffect(() => {
    void reload()
  }, [reload])

  const completeModule = useCallback(
    async (moduleId: string) => {
      if (!session?.user?.id || !dogId) return
      setCompletingId(moduleId)
      setError(null)
      try {
        const res = await apiFetch(
          `/api/learning/curriculum/${encodeURIComponent(moduleId)}?dogId=${encodeURIComponent(dogId)}`,
          { method: 'POST' },
        )
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as { error?: string } | null
          throw new Error(
            body?.error === 'prior_modules_incomplete'
              ? 'Slutför tidigare moduler först.'
              : body?.error ?? 'Kunde inte markera klar',
          )
        }
        await reload()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Fel')
      } finally {
        setCompletingId(null)
      }
    },
    [session?.user?.id, dogId, reload],
  )

  return { overview, loading, error, reload, completeModule, completingId }
}
