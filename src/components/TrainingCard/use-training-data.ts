import { useCallback, useEffect, useState } from 'react'
import type { DailyExerciseMetrics, WeekPlan } from '@/types'
import { buildWeekPlanUrl, type WeekPlanUrlParams } from './url-builder'
import { apiFetch } from '@/lib/api/fetch'
import {
  MetricsMapSchema,
  ProgressMapSchema,
  WeekPlanSchema,
} from '@/types/api/schemas'

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
    takesRewardsOutdoors, householdPets, todayDate,
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
        rewardPreference, takesRewardsOutdoors, householdPets,
      })
      const [planRes, progressRes, metricsRes] = await Promise.all([
        fetch(planUrl),
        apiFetch(
          `/api/training/progress?breed=${breed}&date=${todayDate}&dogId=${encodeURIComponent(dogId)}`,
          ProgressMapSchema,
        ),
        apiFetch(
          `/api/training/metrics?breed=${breed}&date=${todayDate}&dogId=${encodeURIComponent(dogId)}`,
          MetricsMapSchema,
        ),
      ])

      if (planRes.ok) {
        const body = await planRes.json()
        const parsed = WeekPlanSchema.safeParse(body)
        if (!parsed.success) throw new Error('Fel format i veckoplanen från servern')
        setWeekPlan(parsed.data)
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
      setProgress(progressRes)
      setMetrics(metricsRes)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [breed, trainingWeek, ageWeeks, todayDate, goals, environment, rewardPreference, takesRewardsOutdoors, householdPets, dogId])

  useEffect(() => { refresh() }, [refresh])

  return { weekPlan, progress, metrics, loading, error, referral, refresh, setProgress, setMetrics }
}
