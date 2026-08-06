import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth/AuthContext'
import { apiFetch } from '@/lib/api/client'

export type MobileSubscription = {
  tier: 'free' | 'basic' | 'pro'
  status: string
  isActive: boolean
  isOnTrial: boolean
  trialDaysLeft: number
}

export function useSubscription() {
  const { session } = useAuth()
  const [sub, setSub] = useState<MobileSubscription | null>(null)
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    if (!session?.access_token) {
      setSub(null)
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const res = await apiFetch('/api/billing/me', session.access_token)
      if (!res.ok) {
        setSub(null)
        return
      }
      const data = (await res.json()) as MobileSubscription
      setSub(data)
    } catch {
      setSub(null)
    } finally {
      setLoading(false)
    }
  }, [session?.access_token])

  useEffect(() => {
    void reload()
  }, [reload])

  const isPro = Boolean(sub?.isActive && sub.tier === 'pro')

  return { sub, isPro, loading, reload }
}
