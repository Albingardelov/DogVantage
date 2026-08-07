import { useCallback, useEffect, useMemo, useState } from 'react'
import type { DailyExerciseMetrics, DayPlan, Exercise, WeekPlan } from '@dogvantage/core'
import { scaleDayPlan, type DayCheckInState } from '@dogvantage/core'
import { useAuth } from '@/lib/auth/AuthContext'
import { apiFetch, buildWeekPlanPath } from '@/lib/api/client'
import { fetchActiveDog, type ActiveDog } from '@/lib/dog/active-dog'
import { emptyMetrics, todayDateKey } from '@/lib/training/dates'
import { pickTodayPlan } from '@/hooks/use-week-plan'
import { useDayCheckIn } from '@/hooks/use-day-checkin'
import { useDogState } from '@/hooks/use-dog-state'
import { useHeat } from '@/hooks/use-heat'

export function useTrainingSession() {
  const { session } = useAuth()
  const [dog, setDog] = useState<ActiveDog | null>(null)
  const [plan, setPlan] = useState<WeekPlan | null>(null)
  const [rawToday, setRawToday] = useState<DayPlan | null>(null)
  const [progress, setProgress] = useState<Record<string, number>>({})
  const [metrics, setMetrics] = useState<Record<string, DailyExerciseMetrics>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [referral, setReferral] = useState<string | null>(null)

  const checkInApi = useDayCheckIn(dog?.id)
  const heatApi = useHeat(dog)
  const dogStateApi = useDogState(dog?.id)

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
        setRawToday(null)
        setProgress({})
        setMetrics({})
        setError('Ingen hundprofil hittades.')
        return
      }

      const date = todayDateKey()
      const dogId = encodeURIComponent(active.id)
      const [weekRes, progressRes, metricsRes] = await Promise.all([
        apiFetch(buildWeekPlanPath(active), session.access_token),
        apiFetch(`/api/training/progress?date=${date}&dogId=${dogId}`, session.access_token),
        apiFetch(`/api/training/metrics?date=${date}&dogId=${dogId}`, session.access_token),
      ])

      if (weekRes.status === 422) {
        const body = (await weekRes.json()) as { error?: string; referral?: string }
        setReferral(body.referral ?? body.error ?? 'behavior_referral')
        setPlan(null)
        setRawToday(null)
        return
      }
      if (!weekRes.ok) {
        const body = (await weekRes.json().catch(() => null)) as { error?: string } | null
        throw new Error(body?.error ?? `Kunde inte hämta veckoplan (${weekRes.status})`)
      }

      const weekData = (await weekRes.json()) as WeekPlan
      setPlan(weekData)
      setRawToday(pickTodayPlan(weekData))

      if (progressRes.ok) {
        setProgress((await progressRes.json()) as Record<string, number>)
      }
      if (metricsRes.ok) {
        setMetrics((await metricsRes.json()) as Record<string, DailyExerciseMetrics>)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Nätverksfel')
      setPlan(null)
      setRawToday(null)
    } finally {
      setLoading(false)
    }
  }, [session?.access_token])

  useEffect(() => {
    void reload()
  }, [reload])

  const scaled = useMemo(() => {
    const exercises = rawToday?.exercises ?? []
    const checkIn: DayCheckInState | null = checkInApi.checkIn
    return scaleDayPlan(exercises, checkIn, {
      metrics: Object.fromEntries(
        Object.entries(metrics).map(([id, m]) => [
          id,
          { success_count: m.success_count, fail_count: m.fail_count },
        ]),
      ),
    })
  }, [rawToday, checkInApi.checkIn, metrics])

  const today: DayPlan | null = useMemo(() => {
    if (!rawToday) return null
    if (rawToday.rest) return rawToday
    if (scaled.mode === 'rest') {
      return { ...rawToday, rest: true, exercises: [] }
    }
    return { ...rawToday, exercises: scaled.exercises }
  }, [rawToday, scaled])

  const patchRep = useCallback(
    async (exercise: Exercise, kind: 'success' | 'fail') => {
      if (!session?.access_token || !dog?.id) return
      const done = progress[exercise.id] ?? 0
      if (done >= exercise.reps) return

      const current = metrics[exercise.id] ?? emptyMetrics()
      const newDone = done + 1
      const patch =
        kind === 'success'
          ? { success_count: current.success_count + 1 }
          : { fail_count: current.fail_count + 1 }
      const nextMetrics = { ...current, ...patch }

      setProgress((p) => ({ ...p, [exercise.id]: newDone }))
      setMetrics((m) => ({ ...m, [exercise.id]: nextMetrics }))

      const date = todayDateKey()
      const token = session.access_token
      const dogId = dog.id

      await Promise.all([
        apiFetch('/api/training/metrics', token, {
          method: 'PATCH',
          body: JSON.stringify({ date, dogId, exerciseId: exercise.id, patch }),
        }),
        apiFetch('/api/training/progress', token, {
          method: 'PATCH',
          body: JSON.stringify({ date, dogId, exerciseId: exercise.id, count: newDone }),
        }),
      ]).catch((e) => console.warn('[patchRep]', e))
    },
    [session?.access_token, dog?.id, progress, metrics],
  )

  const logSuccess = useCallback((ex: Exercise) => patchRep(ex, 'success'), [patchRep])
  const logFail = useCallback((ex: Exercise) => patchRep(ex, 'fail'), [patchRep])

  return {
    dog,
    plan,
    today,
    progress,
    metrics,
    loading,
    error,
    referral,
    reload,
    logSuccess,
    logFail,
    checkIn: checkInApi.checkIn,
    showCheckInCard: checkInApi.showCard,
    saveCheckIn: checkInApi.save,
    dismissCheckIn: checkInApi.dismiss,
    scaleNote: scaled.note,
    scaleMode: scaled.mode,
    heat: heatApi,
    dogStateSummary: dogStateApi.summary,
  }
}
