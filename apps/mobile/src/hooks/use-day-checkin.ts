import { useCallback, useEffect, useState } from 'react'
import type { DayCheckInState } from '@dogvantage/core'
import { DayCheckInResponseSchema } from '@dogvantage/core'
import { useAuth } from '@/lib/auth/AuthContext'
import { apiFetch } from '@/lib/api/client'
import { todayDateKey } from '@/lib/training/dates'

export function useDayCheckIn(dogId: string | undefined) {
  const { session } = useAuth()
  const [checkIn, setCheckIn] = useState<DayCheckInState | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const date = todayDateKey()

  const reload = useCallback(async () => {
    if (!session?.access_token || !dogId) {
      setCheckIn(null)
      setLoaded(true)
      return
    }
    try {
      const res = await apiFetch(
        `/api/training/checkin?dogId=${encodeURIComponent(dogId)}&date=${date}`,
        session.access_token,
      )
      if (!res.ok) {
        setCheckIn(null)
        return
      }
      const parsed = DayCheckInResponseSchema.parse(await res.json())
      setCheckIn(parsed.zone ? parsed : null)
    } catch {
      setCheckIn(null)
    } finally {
      setLoaded(true)
    }
  }, [session?.access_token, dogId, date])

  useEffect(() => {
    setLoaded(false)
    setDismissed(false)
    void reload()
  }, [reload])

  const save = useCallback(
    async (value: DayCheckInState) => {
      if (!session?.access_token || !dogId || !value.zone) return
      setCheckIn(value)
      setDismissed(false)
      await apiFetch(`/api/training/checkin?dogId=${encodeURIComponent(dogId)}`, session.access_token, {
        method: 'POST',
        body: JSON.stringify({
          dogId,
          date,
          zone: value.zone,
          handlerEnergy: value.handlerEnergy ?? undefined,
          minutesAvailable: value.minutesAvailable ?? undefined,
        }),
      }).catch((e) => console.warn('[useDayCheckIn] save', e))
    },
    [session?.access_token, dogId, date],
  )

  const dismiss = useCallback(() => setDismissed(true), [])

  const showCard = loaded && !checkIn?.zone && !dismissed

  return { checkIn, loaded, showCard, save, dismiss, reload }
}
