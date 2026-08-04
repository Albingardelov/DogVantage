import { useEffect, useMemo, useRef, useState } from 'react'
import type { DayPlan, DailyExerciseMetrics, Exercise, WeekPlan } from '@dogvantage/core'
import { focusExerciseIds, type WeeklyFocusArea } from '@dogvantage/core'
import { scaleDayPlan, type DayCheckInState, type DayScaleMode } from '@dogvantage/core'
import { CALM_EXERCISE_IDS } from '@dogvantage/core'

const SWEDISH_DAYS = ['Söndag', 'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag']

interface UseTodayExercisesArgs {
  weekPlan: WeekPlan | null
  progress: Record<string, number>
  focusAreas: WeeklyFocusArea[]
  simpleFocus: boolean
  dayCheckIn: DayCheckInState | null
  metrics: Record<string, DailyExerciseMetrics>
  priorityIds: string[]
}

interface UseTodayExercisesResult {
  todayPlan: DayPlan | undefined
  todayExercisesWithIndex: Array<{ current: Exercise; originalIdx: number }>
  todayExercises: Exercise[]
  displayedExercises: Array<{ current: Exercise; originalIdx: number }>
  nextExerciseId: string | null
  nextExercise: Exercise | null
  swapCandidates: string[]
  swaps: Record<number, Exercise>
  setSwaps: React.Dispatch<React.SetStateAction<Record<number, Exercise>>>
  completedCount: number
  progressPct: number
  scaleMode: DayScaleMode
  scaleNote: string | null
}

export function useTodayExercises({
  weekPlan,
  progress,
  focusAreas,
  simpleFocus,
  dayCheckIn,
  metrics,
  priorityIds,
}: UseTodayExercisesArgs): UseTodayExercisesResult {
  const todayName = SWEDISH_DAYS[new Date().getDay()]
  const rawTodayPlan = weekPlan?.days.find((d) => d.day === todayName)

  const [swaps, setSwaps] = useState<Record<number, Exercise>>({})

  // Scaling only reads the calm exercises' counters — keying on them keeps the
  // derived plan referentially stable while reps on other exercises churn `metrics`.
  const calmMetricsKey = CALM_EXERCISE_IDS
    .map((id) => `${metrics[id]?.success_count ?? 0}:${metrics[id]?.fail_count ?? 0}`)
    .join('|')

  const scalingMetrics = useMemo(
    () =>
      Object.fromEntries(
        CALM_EXERCISE_IDS
          .filter((id) => metrics[id])
          .map((id) => [id, {
            success_count: metrics[id].success_count,
            fail_count: metrics[id].fail_count,
          }]),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [calmMetricsKey],
  )

  const scaled = useMemo(
    () =>
      scaleDayPlan(rawTodayPlan?.exercises ?? [], rawTodayPlan?.rest ? null : dayCheckIn, {
        metrics: scalingMetrics,
        priorityIds,
      }),
    [rawTodayPlan, dayCheckIn, scalingMetrics, priorityIds],
  )

  const todayPlan: DayPlan | undefined = useMemo(() => {
    if (!rawTodayPlan) return undefined
    if (scaled.mode === 'rest') return { ...rawTodayPlan, rest: true, exercises: [] }
    if (scaled.mode === 'full') return rawTodayPlan
    return { ...rawTodayPlan, exercises: scaled.exercises }
  }, [rawTodayPlan, scaled])

  const todayExercisesWithIndex = useMemo(
    () =>
      (todayPlan?.exercises ?? []).map((ex, originalIdx) => ({
        current: swaps[originalIdx] ?? ex,
        originalIdx,
      })),
    [todayPlan, swaps],
  )
  const todayExercises: Exercise[] = useMemo(
    () => todayExercisesWithIndex.map((e) => e.current),
    [todayExercisesWithIndex],
  )

  // Reset local swaps when the underlying plan changes (new day, new fetch).
  useEffect(() => { setSwaps({}) }, [todayPlan])

  const swapCandidates = useMemo(() => {
    if (focusAreas.length === 0) return [] as string[]
    const focusIds = focusExerciseIds(focusAreas)
    const usedIds = new Set(todayExercises.map((e) => e.id))
    return focusIds.filter((id) => !usedIds.has(id))
  }, [focusAreas, todayExercises])

  const nextExerciseId = useMemo(() => {
    for (const e of todayExercises) {
      if ((progress[e.id] ?? 0) < e.reps) return e.id
    }
    return null
  }, [todayExercises, progress])

  const displayedExercises = useMemo(() => {
    if (!simpleFocus || todayExercisesWithIndex.length <= 2) return todayExercisesWithIndex
    if (!nextExerciseId) return todayExercisesWithIndex
    const next = todayExercisesWithIndex.find((e) => e.current.id === nextExerciseId)
    return next ? [next] : todayExercisesWithIndex
  }, [simpleFocus, todayExercisesWithIndex, nextExerciseId])

  const nextExercise = useMemo(
    () => (nextExerciseId ? todayExercises.find((e) => e.id === nextExerciseId) ?? null : null),
    [todayExercises, nextExerciseId],
  )

  // Smooth-scroll the next exercise into view when it changes.
  const prevNextIdRef = useRef<string | null>(null)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const id = nextExerciseId
    if (!id) { prevNextIdRef.current = null; return }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      prevNextIdRef.current = id
      return
    }
    const prev = prevNextIdRef.current
    prevNextIdRef.current = id
    if (prev === null || prev === id) return
    requestAnimationFrame(() => {
      document.getElementById('training-session-next')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    })
  }, [nextExerciseId])

  const completedCount = todayExercises.filter((e) => (progress[e.id] ?? 0) >= e.reps).length
  const progressPct = todayExercises.length > 0 ? (completedCount / todayExercises.length) * 100 : 0

  return {
    todayPlan,
    todayExercisesWithIndex,
    todayExercises,
    displayedExercises,
    nextExerciseId,
    nextExercise,
    swapCandidates,
    swaps,
    setSwaps,
    completedCount,
    progressPct,
    scaleMode: scaled.mode,
    scaleNote: scaled.note,
  }
}
