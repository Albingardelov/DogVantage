import { useCallback, useEffect, useMemo, useState } from 'react'
import { router } from 'expo-router'
import type {
  BehaviorProfile,
  DailyExerciseMetrics,
  HouseholdPet,
  LatencyBucket,
  LeashBehavior,
  NewEnvironmentReaction,
  TrainingBackground,
  TriggerType,
} from '@dogvantage/core'
import {
  GOAL_EXERCISE_IDS,
  computeStartingWeek,
} from '@dogvantage/core'
import { useAuth } from '@/lib/auth/AuthContext'
import { apiFetch } from '@/lib/api/client'
import { fetchActiveDog, type ActiveDog } from '@/lib/dog/active-dog'
import { updateDogProfile } from '@/lib/dog/profile'
import { emptyMetrics, todayDateKey } from '@/lib/training/dates'

export function useAssessment() {
  const { session } = useAuth()
  const [dog, setDog] = useState<ActiveDog | null>(null)
  const [booting, setBooting] = useState(true)
  const [step, setStep] = useState<0 | 1>(0)
  const [hasBeenOut, setHasBeenOut] = useState<boolean | null>(null)
  const [triggers, setTriggers] = useState<TriggerType[]>([])
  const [leashBehavior, setLeashBehavior] = useState<LeashBehavior>('calm')
  const [envReaction, setEnvReaction] = useState<NewEnvironmentReaction>('curious')
  const [background, setBackground] = useState<TrainingBackground>('beginner')
  const [householdPets, setHouseholdPets] = useState<HouseholdPet[]>([])
  const [problemNotes, setProblemNotes] = useState('')
  const [metrics, setMetrics] = useState<Record<string, DailyExerciseMetrics>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      try {
        const active = await fetchActiveDog()
        setDog(active)
        if (active?.onboarding?.trainingBackground) {
          setBackground(active.onboarding.trainingBackground)
        }
        if (active?.onboarding?.householdPets?.length) {
          setHouseholdPets(active.onboarding.householdPets)
        }
      } finally {
        setBooting(false)
      }
    })()
  }, [])

  const exerciseIds = useMemo(() => {
    const goals = dog?.onboarding?.goals ?? ['everyday_obedience']
    const merged = [
      ...new Set(
        goals.flatMap((g) => GOAL_EXERCISE_IDS[g] ?? GOAL_EXERCISE_IDS.everyday_obedience),
      ),
    ]
    return merged.slice(0, 7)
  }, [dog?.onboarding?.goals])

  const exercisesComplete = useMemo(
    () =>
      exerciseIds.every((id) => {
        const m = metrics[id]
        return m != null && m.success_count + m.fail_count >= 5
      }),
    [exerciseIds, metrics],
  )

  const setBeenOut = useCallback((v: boolean) => {
    setHasBeenOut(v)
    if (!v) {
      setLeashBehavior('not_yet_out')
      setEnvReaction('not_yet_out')
      setTriggers([])
    } else {
      setLeashBehavior((prev) => (prev === 'not_yet_out' ? 'calm' : prev))
      setEnvReaction((prev) => (prev === 'not_yet_out' ? 'curious' : prev))
    }
  }, [])

  const patchMetrics = useCallback(
    async (exerciseId: string, patch: Partial<DailyExerciseMetrics>) => {
      if (!session?.user?.id || !dog?.id) return
      let previous: DailyExerciseMetrics | undefined
      setMetrics((prev) => {
        previous = prev[exerciseId]
        return {
          ...prev,
          [exerciseId]: { ...(prev[exerciseId] ?? emptyMetrics()), ...patch },
        }
      })
      try {
        const res = await apiFetch('/api/training/metrics', {
          method: 'PATCH',
          body: JSON.stringify({
            date: todayDateKey(),
            dogId: dog.id,
            exerciseId,
            patch,
          }),
        })
        if (!res.ok) throw new Error('save_failed')
      } catch (e) {
        console.warn('[assessment patchMetrics]', e)
        setMetrics((prev) => {
          const next = { ...prev }
          if (previous) next[exerciseId] = previous
          else delete next[exerciseId]
          return next
        })
        setError('Kunde inte spara svaret. Kontrollera anslutningen och försök igen.')
      }
    },
    [session?.user?.id, dog?.id],
  )

  const logOutcome = useCallback(
    (exerciseId: string, kind: 'success' | 'fail') => {
      const current = metrics[exerciseId] ?? emptyMetrics()
      if (kind === 'success') {
        void patchMetrics(exerciseId, { success_count: current.success_count + 1 })
      } else {
        void patchMetrics(exerciseId, { fail_count: current.fail_count + 1 })
      }
    },
    [metrics, patchMetrics],
  )

  const setLatency = useCallback(
    (exerciseId: string, latency_bucket: LatencyBucket) => {
      void patchMetrics(exerciseId, { latency_bucket })
    },
    [patchMetrics],
  )

  const setCriteria = useCallback(
    (exerciseId: string, criteria_level_id: string) => {
      void patchMetrics(exerciseId, { criteria_level_id })
    },
    [patchMetrics],
  )

  const finish = useCallback(async () => {
    if (!dog?.id || !exercisesComplete) return
    setSaving(true)
    setError(null)
    try {
      const behaviorProfile: BehaviorProfile = {
        triggers,
        leashBehavior,
        newEnvironmentReaction: envReaction,
        trainingBackground: background,
        householdPets,
        problemNotes: problemNotes.trim() || undefined,
      }
      const startingWeek = computeStartingWeek(Math.max(1, dog.ageWeeks), metrics)
      await updateDogProfile({
        id: dog.id,
        trainingWeek: startingWeek,
        assessment: {
          status: 'completed',
          completed_at: new Date().toISOString(),
          behaviorProfile,
        },
      })
      router.replace('/(tabs)/dashboard')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kunde inte spara bedömningen')
    } finally {
      setSaving(false)
    }
  }, [
    dog,
    exercisesComplete,
    triggers,
    leashBehavior,
    envReaction,
    background,
    householdPets,
    problemNotes,
    metrics,
  ])

  return {
    dog,
    booting,
    step,
    setStep,
    hasBeenOut,
    setBeenOut,
    triggers,
    setTriggers,
    leashBehavior,
    setLeashBehavior,
    envReaction,
    setEnvReaction,
    background,
    setBackground,
    householdPets,
    setHouseholdPets,
    problemNotes,
    setProblemNotes,
    exerciseIds,
    metrics,
    exercisesComplete,
    logOutcome,
    setLatency,
    setCriteria,
    finish,
    saving,
    error,
  }
}
