'use client'

import { useCallback, useEffect, useState } from 'react'
import type { Breed, DailyExerciseMetrics, Exercise, HouseholdPet, RewardPreference, TrainingEnvironment, TrainingGoal } from '@/types'
import { buildWeekPlanUrl } from '../TrainingCard/url-builder'
import { apiFetch } from '@/lib/api/fetch'
import { MetricsMapSchema, ProgressMapSchema, WeekPlanSchema } from '@/types/api/schemas'
import {
  buildYellowExercise,
  selectYellowExercise,
  type PuppyZone,
} from '@/lib/training/puppy-zone'

const SWEDISH_DAYS = ['Söndag', 'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag']

export interface UsePuppyDayParams {
  dogId: string
  todayDate: string
  breed: Breed
  trainingWeek: number
  ageWeeks: number
  goals?: TrainingGoal[]
  environment?: TrainingEnvironment
  rewardPreference?: RewardPreference
  takesRewardsOutdoors?: boolean
  householdPets?: HouseholdPet[]
}

export interface UsePuppyDayResult {
  zone: PuppyZone | null
  exercises: Exercise[]
  progress: Record<string, number>
  metrics: Record<string, DailyExerciseMetrics>
  loading: boolean
  error: boolean
  saveZone: (zone: PuppyZone) => Promise<void>
  setProgress: React.Dispatch<React.SetStateAction<Record<string, number>>>
  setMetrics: React.Dispatch<React.SetStateAction<Record<string, DailyExerciseMetrics>>>
}

export function usePuppyDay({
  dogId, todayDate, trainingWeek, ageWeeks,
  goals, environment, rewardPreference, takesRewardsOutdoors, householdPets,
}: UsePuppyDayParams): UsePuppyDayResult {
  const [zone, setZone] = useState<PuppyZone | null>(null)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [progress, setProgress] = useState<Record<string, number>>({})
  const [metrics, setMetrics] = useState<Record<string, DailyExerciseMetrics>>({})
  const [loadingZone, setLoadingZone] = useState(true)
  const [loadingExercises, setLoadingExercises] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    setLoadingZone(true)
    fetch(`/api/training/checkin?dogId=${encodeURIComponent(dogId)}&date=${todayDate}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.zone) setZone(d.zone as PuppyZone) })
      .catch(() => {})
      .finally(() => setLoadingZone(false))
  }, [dogId, todayDate])

  const fetchForZone = useCallback(async (currentZone: PuppyZone) => {
    setLoadingExercises(true)
    setError(false)
    try {
      if (currentZone === 'green') {
        const planUrl = buildWeekPlanUrl({
          trainingWeek, ageWeeks, dogId, goals,
          environment, rewardPreference, takesRewardsOutdoors, householdPets,
        })
        const [planRes, progressData, metricsData] = await Promise.all([
          fetch(planUrl),
          apiFetch(`/api/training/progress?date=${todayDate}&dogId=${encodeURIComponent(dogId)}`, ProgressMapSchema),
          apiFetch(`/api/training/metrics?date=${todayDate}&dogId=${encodeURIComponent(dogId)}`, MetricsMapSchema),
        ])
        if (planRes.ok) {
          const body = await planRes.json()
          const parsed = WeekPlanSchema.safeParse(body)
          if (parsed.success) {
            const todayName = SWEDISH_DAYS[new Date().getDay()]
            const todayPlan = parsed.data.days.find((d) => d.day === todayName)
            // If today is a rest day or has no exercises, find any training day's exercises.
            // The owner chose green — give them something to train regardless of the plan's rest schedule.
            const exercises = todayPlan?.rest || !todayPlan?.exercises?.length
              ? (parsed.data.days.find((d) => !d.rest && d.exercises?.length)?.exercises ?? [])
              : (todayPlan.exercises ?? [])
            setExercises(exercises)
          } else {
            setError(true)
          }
        } else {
          setError(true)
        }
        setProgress(progressData)
        setMetrics(metricsData)
      } else if (currentZone === 'yellow') {
        const [progressData, metricsData] = await Promise.all([
          apiFetch(`/api/training/progress?date=${todayDate}&dogId=${encodeURIComponent(dogId)}`, ProgressMapSchema),
          apiFetch(`/api/training/metrics?date=${todayDate}&dogId=${encodeURIComponent(dogId)}`, MetricsMapSchema),
        ])
        setProgress(progressData)
        setMetrics(metricsData)
        setExercises([buildYellowExercise(selectYellowExercise(metricsData))])
      } else {
        setExercises([])
      }
    } catch {
      setError(true)
    } finally {
      setLoadingExercises(false)
    }
  }, [trainingWeek, ageWeeks, dogId, todayDate, goals, environment, rewardPreference, takesRewardsOutdoors, householdPets])

  useEffect(() => {
    if (zone) void fetchForZone(zone)
  }, [zone, fetchForZone])

  const saveZone = useCallback(async (newZone: PuppyZone) => {
    setZone(newZone)
    await fetch('/api/training/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dogId, date: todayDate, zone: newZone }),
    }).catch(console.error)
  }, [dogId, todayDate])

  return {
    zone,
    exercises,
    progress,
    metrics,
    loading: loadingZone || loadingExercises,
    error,
    saveZone,
    setProgress,
    setMetrics,
  }
}
