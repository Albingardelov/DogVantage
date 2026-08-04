'use client'

import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api/fetch'
import { DayCheckInResponseSchema } from '@dogvantage/core'
import type { DayCheckInState } from '@dogvantage/core'

interface UseDayCheckInResult {
  checkIn: DayCheckInState | null
  loaded: boolean
  save: (value: DayCheckInState) => void
}

export function useDayCheckIn(dogId: string, date: string): UseDayCheckInResult {
  const [checkIn, setCheckIn] = useState<DayCheckInState | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!dogId) return
    let cancelled = false
    apiFetch(`/api/training/checkin?dogId=${encodeURIComponent(dogId)}&date=${date}`, DayCheckInResponseSchema)
      .then((res) => {
        if (cancelled) return
        setCheckIn(res.zone ? res : null)
      })
      .catch(() => {
        // Check-in är frivilligt — utan svar gäller planen som den är.
      })
      .finally(() => {
        if (!cancelled) setLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [dogId, date])

  const save = useCallback(
    (value: DayCheckInState) => {
      setCheckIn(value)
      fetch('/api/training/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dogId,
          date,
          zone: value.zone,
          handlerEnergy: value.handlerEnergy ?? undefined,
          minutesAvailable: value.minutesAvailable ?? undefined,
        }),
      }).catch(console.error)
    },
    [dogId, date],
  )

  return { checkIn, loaded, save }
}
