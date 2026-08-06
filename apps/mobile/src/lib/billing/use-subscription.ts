import AsyncStorage from '@react-native-async-storage/async-storage'
import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth/AuthContext'
import { apiFetch } from '@/lib/api/client'

export type SubscriptionState = {
  tier: 'free' | 'basic' | 'pro'
  status: string
  isActive: boolean
  isOnTrial: boolean
  trialDaysLeft: number
  cancelAtPeriodEnd: boolean
  currentPeriodEnd: string | null
}

export type ProFeature = 'ai_chat' | 'multiple_dogs' | 'custom_exercises'

const CACHE_TTL_MS = 5 * 60 * 1000

function cacheKey(userId: string) {
  return `subscription_state_v1:${userId}`
}

type CachePayload = { data: SubscriptionState; ts: number }

function normalize(raw: Record<string, unknown>): SubscriptionState {
  return {
    tier: (raw.tier as SubscriptionState['tier']) ?? 'free',
    status: String(raw.status ?? 'canceled'),
    isActive: Boolean(raw.isActive),
    isOnTrial: Boolean(raw.isOnTrial),
    trialDaysLeft: Number(raw.trialDaysLeft ?? 0),
    cancelAtPeriodEnd: Boolean(raw.cancelAtPeriodEnd),
    currentPeriodEnd:
      raw.currentPeriodEnd == null
        ? null
        : typeof raw.currentPeriodEnd === 'string'
          ? raw.currentPeriodEnd
          : String(raw.currentPeriodEnd),
  }
}

export function hasFeature(state: SubscriptionState | null, feature: ProFeature): boolean {
  if (!state?.isActive) return false
  if (state.tier === 'pro') return true
  return false
}

export function meetsTier(
  state: SubscriptionState | null,
  requireTier: 'basic' | 'pro',
): boolean {
  if (!state?.isActive) return false
  if (requireTier === 'basic') return state.tier === 'basic' || state.tier === 'pro'
  return state.tier === 'pro'
}

export function useSubscription() {
  const { session, user } = useAuth()
  const [state, setState] = useState<SubscriptionState | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!session?.access_token || !user?.id) {
      setState(null)
      setLoading(false)
      return
    }
    try {
      const res = await apiFetch('/api/billing/me', session.access_token)
      if (!res.ok) {
        setState(null)
        return
      }
      const data = normalize((await res.json()) as Record<string, unknown>)
      setState(data)
      const payload: CachePayload = { data, ts: Date.now() }
      await AsyncStorage.setItem(cacheKey(user.id), JSON.stringify(payload))
    } catch (err) {
      console.warn('[useSubscription]', err)
    } finally {
      setLoading(false)
    }
  }, [session?.access_token, user?.id])

  useEffect(() => {
    let cancelled = false

    async function boot() {
      if (!user?.id) {
        setState(null)
        setLoading(false)
        return
      }

      try {
        const raw = await AsyncStorage.getItem(cacheKey(user.id))
        if (raw && !cancelled) {
          const parsed = JSON.parse(raw) as CachePayload
          if (parsed?.data) {
            setState(parsed.data)
            if (Date.now() - parsed.ts < CACHE_TTL_MS) {
              setLoading(false)
              // Still refresh in background when cache is fresh
              void refresh()
              return
            }
          }
        }
      } catch {
        // ignore bad cache
      }

      if (!cancelled) await refresh()
    }

    void boot()
    return () => {
      cancelled = true
    }
  }, [user?.id, refresh])

  const isPro = hasFeature(state, 'ai_chat')

  return {
    state,
    loading,
    refresh,
    reload: refresh,
    isPro,
    hasFeature: (feature: ProFeature) => hasFeature(state, feature),
  }
}
