'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api/fetch'
import { DogStatePayloadSchema } from '@dogvantage/core'
import type { z } from 'zod'

export type DogStatePayload = z.infer<typeof DogStatePayloadSchema>

export function useDogState(dogId: string): DogStatePayload | null {
  const [state, setState] = useState<DogStatePayload | null>(null)

  useEffect(() => {
    if (!dogId) return
    let cancelled = false
    apiFetch(`/api/training/dog-state?dogId=${encodeURIComponent(dogId)}`, DogStatePayloadSchema)
      .then((res) => {
        if (!cancelled) setState(res)
      })
      .catch(() => {
        // Adaptive thresholds are supplementary — fail silently.
      })
    return () => {
      cancelled = true
    }
  }, [dogId])

  return state
}
