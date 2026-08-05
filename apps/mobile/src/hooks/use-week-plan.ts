import { useCallback, useEffect, useState } from 'react'
import type { DayPlan, WeekPlan } from '@dogvantage/core'
import { useAuth } from '@/lib/auth/AuthContext'
import { apiFetch, buildWeekPlanPath } from '@/lib/api/client'
import { fetchActiveDog, type ActiveDog } from '@/lib/dog/active-dog'

const SWEDISH_DAYS = ['Söndag', 'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag']

export function todayDayName(now = new Date()): string {
  return SWEDISH_DAYS[now.getDay()]!
}

export function pickTodayPlan(plan: WeekPlan, now = new Date()): DayPlan | null {
  const name = todayDayName(now)
  return plan.days.find((d) => d.day === name) ?? null
}

export function useWeekPlan() {
  const { session } = useAuth()
  const [dog, setDog] = useState<ActiveDog | null>(null)
  const [plan, setPlan] = useState<WeekPlan | null>(null)
  const [today, setToday] = useState<DayPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [referral, setReferral] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!session?.access_token) return
    setLoading(true)
    setError(null)
    setReferral(null)
    try {
      const active = await fetchActiveDog()
      setDog(active)
      if (!active?.id) {
        setPlan(null)
        setToday(null)
        setError('Ingen hundprofil hittades.')
        return
      }
      const res = await apiFetch(buildWeekPlanPath(active), session.access_token)
      if (res.status === 422) {
        const body = (await res.json()) as { error?: string; referral?: string }
        setReferral(body.referral ?? body.error ?? 'behavior_referral')
        setPlan(null)
        setToday(null)
        return
      }
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null
        throw new Error(body?.error ?? `Kunde inte hämta veckoplan (${res.status})`)
      }
      const data = (await res.json()) as WeekPlan
      setPlan(data)
      setToday(pickTodayPlan(data))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Nätverksfel')
      setPlan(null)
      setToday(null)
    } finally {
      setLoading(false)
    }
  }, [session?.access_token])

  useEffect(() => {
    void reload()
  }, [reload])

  return { dog, plan, today, loading, error, referral, reload }
}
