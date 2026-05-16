'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { SubscriptionState } from './subscription'

interface SubscriptionContextValue {
  state: SubscriptionState
  isLoading: boolean
  refresh: () => Promise<void>
}

const EMPTY_STATE: SubscriptionState = {
  tier: 'free',
  status: 'canceled',
  stripeSubscriptionId: null,
  trialEnd: null,
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
  isActive: false,
  isOnTrial: false,
  trialDaysLeft: 0,
}

const SubscriptionContext = createContext<SubscriptionContextValue>({
  state: EMPTY_STATE,
  isLoading: true,
  refresh: async () => {},
})

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SubscriptionState>(EMPTY_STATE)
  const [isLoading, setIsLoading] = useState(true)

  async function refresh() {
    try {
      const res = await fetch('/api/billing/me', { cache: 'no-store' })
      if (!res.ok) {
        setState(EMPTY_STATE)
        return
      }
      const data = await res.json() as SubscriptionState
      setState(data)
    } catch (err) {
      console.error('[subscription-context] failed to load', err)
      setState(EMPTY_STATE)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
  }, [])

  const value = useMemo(() => ({ state, isLoading, refresh }), [state, isLoading])

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  )
}

export function useSubscription() {
  return useContext(SubscriptionContext)
}
