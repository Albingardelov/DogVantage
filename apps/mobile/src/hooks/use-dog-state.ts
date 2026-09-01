import { useCallback, useEffect, useState } from 'react'
import type { DogStatePayload } from '@dogvantage/core'
import { useAuth } from '@/lib/auth/AuthContext'
import { apiFetch } from '@/lib/api/client'

export function useDogState(dogId: string | undefined) {
  const { session } = useAuth()
  const [state, setState] = useState<DogStatePayload | null>(null)
  const [summary, setSummary] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!session?.user?.id || !dogId) {
      setState(null)
      setSummary(null)
      return
    }
    try {
      const res = await apiFetch(
        `/api/training/dog-state?dogId=${encodeURIComponent(dogId)}`,
      )
      if (!res.ok) {
        setState(null)
        setSummary(null)
        return
      }
      const data = (await res.json()) as DogStatePayload
      setState(data)
      const z = data.zoneSummary
      if (z) {
        setSummary(
          `Senaste ${z.window} dagar: ${z.greenDays} gröna · ${z.yellowDays} gula · ${z.redDays} röda`,
        )
      } else {
        setSummary(null)
      }
    } catch {
      setState(null)
      setSummary(null)
    }
  }, [session?.user?.id, dogId])

  useEffect(() => {
    void reload()
  }, [reload])

  return { state, summary, reload }
}
