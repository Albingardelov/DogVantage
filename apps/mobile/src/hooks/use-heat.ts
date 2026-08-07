import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth/AuthContext'
import { apiFetch } from '@/lib/api/client'
import type { ActiveDog } from '@/lib/dog/active-dog'

export type HeatState = {
  isInHeat: boolean
  skenfasActive: boolean
}

function heatEligible(dog: ActiveDog | null): boolean {
  return dog?.sex === 'female' && dog.castrationStatus === 'intact'
}

export function useHeat(dog: ActiveDog | null) {
  const { session } = useAuth()
  const [heat, setHeat] = useState<HeatState | null>(null)
  const [busy, setBusy] = useState(false)
  const eligible = heatEligible(dog)

  const reload = useCallback(async () => {
    if (!session?.access_token || !dog?.id || !eligible) {
      setHeat(null)
      return
    }
    try {
      const res = await apiFetch(
        `/api/training/heat?dogId=${encodeURIComponent(dog.id)}`,
        session.access_token,
      )
      if (!res.ok) {
        setHeat(null)
        return
      }
      const data = (await res.json()) as { isInHeat?: boolean; skenfasActive?: boolean }
      setHeat({
        isInHeat: Boolean(data.isInHeat),
        skenfasActive: Boolean(data.skenfasActive),
      })
    } catch {
      setHeat(null)
    }
  }, [session?.access_token, dog?.id, eligible])

  useEffect(() => {
    void reload()
  }, [reload])

  const start = useCallback(async () => {
    if (!session?.access_token || !dog?.id || !eligible) return
    setBusy(true)
    try {
      const res = await apiFetch(
        `/api/training/heat?dogId=${encodeURIComponent(dog.id)}`,
        session.access_token,
        { method: 'POST', body: JSON.stringify({ dogId: dog.id }) },
      )
      if (res.ok) setHeat({ isInHeat: true, skenfasActive: false })
    } finally {
      setBusy(false)
    }
  }, [session?.access_token, dog?.id, eligible])

  const end = useCallback(async () => {
    if (!session?.access_token || !dog?.id || !eligible) return
    setBusy(true)
    try {
      const res = await apiFetch(
        `/api/training/heat?dogId=${encodeURIComponent(dog.id)}`,
        session.access_token,
        { method: 'DELETE', body: JSON.stringify({ dogId: dog.id }) },
      )
      if (res.ok) {
        const data = (await res.json().catch(() => null)) as { skenfasActive?: boolean } | null
        setHeat({ isInHeat: false, skenfasActive: Boolean(data?.skenfasActive) })
      }
    } finally {
      setBusy(false)
    }
  }, [session?.access_token, dog?.id, eligible])

  return { eligible, heat, busy, reload, start, end }
}
