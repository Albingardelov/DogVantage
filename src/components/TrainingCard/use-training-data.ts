import { useCallback, useEffect, useState } from 'react'
import type { DailyExerciseMetrics, WeekPlan } from '@/types'
import { buildWeekPlanUrl, type WeekPlanUrlParams } from './url-builder'

interface TrainingDataState {
  weekPlan: WeekPlan | null
  progress: Record<string, number>
  metrics: Record<string, DailyExerciseMetrics>
  loading: boolean
  error: boolean
  referral: string | null
}

interface UseTrainingDataResult extends TrainingDataState {
  refresh: () => Promise<void>
  setProgress: React.Dispatch<React.SetStateAction<Record<string, number>>>
  setMetrics: React.Dispatch<React.SetStateAction<Record<string, DailyExerciseMetrics>>>
}

interface Params extends WeekPlanUrlParams {
  todayDate: string
}

/**
 * Fetches week plan, today's progress and today's metrics in parallel.
 * Handles the 422 behaviour_referral response from the week-plan API
 * by surfacing the referral text instead of an error.
 */
export function useTrainingData(params: Params): UseTrainingDataResult {
  const {
    breed, trainingWeek, ageWeeks, dogId, goals, environment, rewardPreference,
    takesRewardsOutdoors, behaviorContext, householdPets, todayDate,
  } = params

  const [weekPlan, setWeekPlan] = useState<WeekPlan | null>(null)
  const [progress, setProgress] = useState<Record<string, number>>({})
  const [metrics, setMetrics] = useState<Record<string, DailyExerciseMetrics>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [referral, setReferral] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(false)
    setReferral(null)
    try {
      const planUrl = buildWeekPlanUrl({
        breed, trainingWeek, ageWeeks, dogId, goals, environment,
        rewardPreference, takesRewardsOutdoors, behaviorContext, householdPets,
      })
      const [planRes, progressRes, metricsRes] = await Promise.all([
        fetch(planUrl),
        fetch(`/api/training/progress?breed=${breed}&date=${todayDate}&dogId=${encodeURIComponent(dogId)}`),
        fetch(`/api/training/metrics?breed=${breed}&date=${todayDate}&dogId=${encodeURIComponent(dogId)}`),
      ])

      if (planRes.ok) {
        setWeekPlan(await planRes.json())
      } else if (planRes.status === 422) {
        const body = await planRes.json().catch(() => ({}))
        if (body?.error === 'behavior_referral' && typeof body.referral === 'string') {
          setReferral(body.referral)
        } else {
          setError(true)
        }
      } else {
        setError(true)
      }
      if (progressRes.ok) setProgress(await progressRes.json())
      if (metricsRes.ok) setMetrics(await metricsRes.json())
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [breed, trainingWeek, ageWeeks, todayDate, goals, environment, rewardPreference, takesRewardsOutdoors, behaviorContext, householdPets, dogId])

  useEffect(() => { refresh() }, [refresh])

  return { weekPlan, progress, metrics, loading, error, referral, refresh, setProgress, setMetrics }
}
