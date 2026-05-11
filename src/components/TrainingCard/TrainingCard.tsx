'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import ExerciseRow from './ExerciseRow'
import WeekView from './WeekView'
import SessionLogForm from '@/components/SessionLogForm'
import ExerciseGuideSheet from '@/components/ExerciseGuideSheet'
import styles from './TrainingCard.module.css'
import type { Breed, TrainingGoal, TrainingEnvironment, RewardPreference, WeekPlan, Exercise, DailyExerciseMetrics, LatencyBucket, ExerciseSummary, HouseholdPet } from '@/types'
import { getExerciseSpec } from '@/lib/training/exercise-specs'
import type { ExerciseSpec } from '@/lib/training/exercise-specs'
import { buildWeekFocusCopy } from '@/lib/training/week-focus-copy'
import {
  focusExerciseIds,
  FOCUS_EXERCISE_LABELS,
  type WeeklyFocusArea,
} from '@/lib/training/weekly-focus'
import WeekFocusPanel from './WeekFocusPanel'
import WeeklyFocusPicker from './WeeklyFocusPicker'
import PreSessionChecklist from './PreSessionChecklist'
import AddCustomExerciseModal from '@/components/AddCustomExerciseModal'

const SWEDISH_DAYS = ['Söndag', 'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag']

function todayDateString(): string {
  return new Date().toISOString().split('T')[0]
}

interface Props {
  trainingWeek: number
  ageWeeks: number
  breed: Breed
  dogName: string
  dogId: string
  goals?: TrainingGoal[]
  environment?: TrainingEnvironment
  rewardPreference?: RewardPreference
  takesRewardsOutdoors?: boolean
  behaviorContext?: string
  householdPets?: HouseholdPet[]
}

export default function TrainingCard({ trainingWeek, ageWeeks, breed, dogName, dogId, goals, environment, rewardPreference, takesRewardsOutdoors, behaviorContext, householdPets }: Props) {
  const router = useRouter()
  const [weekPlan, setWeekPlan] = useState<WeekPlan | null>(null)
  const [progress, setProgress] = useState<Record<string, number>>({})
  const [metrics, setMetrics] = useState<Record<string, DailyExerciseMetrics>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [showWeekView, setShowWeekView] = useState(false)
  const [showLogForm, setShowLogForm] = useState(false)
  const [guideExerciseId, setGuideExerciseId] = useState<string | null>(null)
  const [sessionGuard, setSessionGuard] = useState<Record<string, { consecutiveFails: number; consecutiveSlow: number }>>({})
  const [customSpecs, setCustomSpecs] = useState<Record<string, ExerciseSpec>>({})
  const [showAddCustom, setShowAddCustom] = useState(false)
  const [simpleFocus, setSimpleFocus] = useState(false)
  const [focusAreas, setFocusAreas] = useState<WeeklyFocusArea[]>([])
  const [swaps, setSwaps] = useState<Record<number, Exercise>>({})
  const todayDate = useMemo(todayDateString, [])
  const todayName = SWEDISH_DAYS[new Date().getDay()]

  const weekFocusCopy = useMemo(
    () => buildWeekFocusCopy({ breed, ageWeeks, trainingWeek, goals }),
    [breed, ageWeeks, trainingWeek, goals]
  )

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const [planRes, progressRes, metricsRes] = await Promise.all([
        fetch(`/api/training/week?breed=${breed}&week=${trainingWeek}&ageWeeks=${ageWeeks}${goals && goals.length > 0 ? `&goals=${goals.join(',')}` : ''}${dogId ? `&dogId=${dogId}` : ''}${environment ? `&environment=${environment}` : ''}${rewardPreference ? `&rewardPreference=${rewardPreference}` : ''}${takesRewardsOutdoors != null ? `&takesRewardsOutdoors=${takesRewardsOutdoors}` : ''}${behaviorContext ? `&behaviorContext=${encodeURIComponent(behaviorContext)}` : ''}${householdPets && householdPets.length > 0 ? `&householdPets=${householdPets.join(',')}` : ''}`),
        fetch(`/api/training/progress?breed=${breed}&date=${todayDate}&dogId=${encodeURIComponent(dogId)}`),
        fetch(`/api/training/metrics?breed=${breed}&date=${todayDate}&dogId=${encodeURIComponent(dogId)}`),
      ])
      if (planRes.ok) setWeekPlan(await planRes.json())
      else setError(true)
      if (progressRes.ok) setProgress(await progressRes.json())
      if (metricsRes.ok) setMetrics(await metricsRes.json())
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [breed, trainingWeek, ageWeeks, todayDate, goals, environment, rewardPreference, takesRewardsOutdoors, behaviorContext, householdPets, dogId])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    if (!dogId) return
    let alive = true
    fetch(`/api/training/custom?dogId=${encodeURIComponent(dogId)}`)
      .then((r) => r.ok ? r.json() : [])
      .then((rows: Array<{ exercise_id: string; spec: ExerciseSpec }>) => {
        if (!alive) return
        const map: Record<string, ExerciseSpec> = {}
        for (const row of rows) map[row.exercise_id] = row.spec
        setCustomSpecs(map)
      })
      .catch(() => {})
    return () => { alive = false }
  }, [])

  function handleRepClick(exerciseId: string, currentDone: number, maxReps: number) {
    if (currentDone >= maxReps) return
    const newDone = currentDone + 1
    const newProgress = { ...progress, [exerciseId]: newDone }
    setProgress(newProgress)

    const allDone = todayExercises.length > 0 &&
      todayExercises.every((e) => (newProgress[e.id] ?? 0) >= e.reps)
    if (allDone) setShowLogForm(true)

    fetch('/api/training/progress', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ breed, date: todayDate, dogId, exerciseId, count: newDone }),
    }).catch(console.error)
  }

  function patchMetrics(exerciseId: string, patch: Partial<DailyExerciseMetrics>) {
    if ('fail_count' in patch) {
      setSessionGuard((prev) => {
        const cur = prev[exerciseId] ?? { consecutiveFails: 0, consecutiveSlow: 0 }
        const next = { ...cur, consecutiveFails: cur.consecutiveFails + 1 }
        return { ...prev, [exerciseId]: next }
      })
    }
    if (patch.latency_bucket === 'gt3s') {
      setSessionGuard((prev) => {
        const cur = prev[exerciseId] ?? { consecutiveFails: 0, consecutiveSlow: 0 }
        const next = { ...cur, consecutiveSlow: cur.consecutiveSlow + 1 }
        return { ...prev, [exerciseId]: next }
      })
    }
    if ('success_count' in patch) {
      setSessionGuard((prev) => {
        const cur = prev[exerciseId] ?? { consecutiveFails: 0, consecutiveSlow: 0 }
        const next = { ...cur, consecutiveFails: 0, consecutiveSlow: 0 }
        return { ...prev, [exerciseId]: next }
      })
    }

    setMetrics((prev) => ({
      ...prev,
      [exerciseId]: { ...(prev[exerciseId] ?? emptyMetrics()), ...patch },
    }))

    fetch('/api/training/metrics', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ breed, date: todayDate, dogId, exerciseId, patch }),
    }).catch(console.error)
  }

  const todayPlan = weekPlan?.days.find((d) => d.day === todayName)
  const todayExercisesWithIndex = useMemo(
    () =>
      (todayPlan?.exercises ?? []).map((ex, originalIdx) => ({
        current: swaps[originalIdx] ?? ex,
        originalIdx,
      })),
    [todayPlan, swaps]
  )
  const todayExercises: Exercise[] = useMemo(
    () => todayExercisesWithIndex.map((e) => e.current),
    [todayExercisesWithIndex]
  )

  const swapCandidates = useMemo(() => {
    if (focusAreas.length === 0) return [] as string[]
    const focusIds = focusExerciseIds(focusAreas)
    const usedIds = new Set(todayExercises.map((e) => e.id))
    return focusIds.filter((id) => !usedIds.has(id))
  }, [focusAreas, todayExercises])

  function handleSwap(originalIdx: number) {
    if (swapCandidates.length === 0) return
    const pickId = swapCandidates[Math.floor(Math.random() * swapCandidates.length)]
    const spec = customSpecs[pickId] ?? getExerciseSpec(pickId)
    const baseExercise = (todayPlan?.exercises ?? [])[originalIdx]
    const reps = baseExercise?.reps ?? 3
    const replacement: Exercise = {
      id: pickId,
      label: FOCUS_EXERCISE_LABELS[pickId] ?? spec?.exerciseId ?? pickId,
      desc: `${reps} × kort pass`,
      reps,
    }
    setSwaps((prev) => ({ ...prev, [originalIdx]: replacement }))
  }

  // Reset local swaps when the underlying plan changes (new day, new fetch).
  useEffect(() => {
    setSwaps({})
  }, [todayPlan])

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
    [todayExercises, nextExerciseId]
  )

  const prevNextIdRef = useRef<string | null>(null)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const id = nextExerciseId
    if (!id) {
      prevNextIdRef.current = null
      return
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      prevNextIdRef.current = id
      return
    }
    const prev = prevNextIdRef.current
    prevNextIdRef.current = id
    if (prev === null) return
    if (prev === id) return
    requestAnimationFrame(() => {
      document.getElementById('training-session-next')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    })
  }, [nextExerciseId])

  const completedCount = todayExercises.filter((e) => (progress[e.id] ?? 0) >= e.reps).length
  const progressPct = todayExercises.length > 0 ? (completedCount / todayExercises.length) * 100 : 0

  return (
    <>
      <section className={styles.card}>
        <div className={styles.header}>
          <span className={styles.headerTitle}>Dagens pass</span>
          {!loading && todayExercises.length > 0 && (
            <span className={styles.headerCount}>{completedCount}/{todayExercises.length} klara</span>
          )}
        </div>

        {!loading && todayExercises.length > 0 && !todayPlan?.rest && (
          <PreSessionChecklist ageWeeks={ageWeeks} dateKey={todayDate} />
        )}

        {!loading && weekPlan && (
          <WeekFocusPanel
            copy={weekFocusCopy}
            simpleFocus={simpleFocus}
            onToggleSimple={() => setSimpleFocus((s) => !s)}
            totalExercises={todayExercises.length}
            canSimple={todayExercises.length > 2 && !todayPlan?.rest}
          />
        )}

        {dogId && (
          <WeeklyFocusPicker
            dogId={dogId}
            onLoaded={(areas) => setFocusAreas(areas)}
            onChange={(areas) => {
              setFocusAreas(areas)
              fetchData()
            }}
          />
        )}

        {!loading && todayExercises.length > 0 && (
          <div
            className={styles.progressBar}
            role="progressbar"
            aria-valuenow={progressPct}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className={styles.progressFill} style={{ '--pct': `${progressPct}%` } as React.CSSProperties} />
          </div>
        )}

        {!loading &&
          nextExercise &&
          !todayPlan?.rest &&
          !(simpleFocus && todayExercises.length > 2) && (
          <div className={styles.nextBanner} role="status" aria-live="polite">
            <span className={styles.nextBannerLabel}>Nästa</span>
            <span className={styles.nextBannerName}>{nextExercise.label}</span>
          </div>
        )}

        {loading && (
          <div className={styles.loading} aria-live="polite">
            <span className={styles.spinner} />
            <span>Hämtar träningsplan…</span>
          </div>
        )}

        {!loading && error && (
          <p className={styles.errorMsg}>Kunde inte hämta träningsplan. Försök igen.</p>
        )}

        {!loading && todayPlan?.rest && (
          <div className={styles.restDay}>
            <span className={styles.restEmoji} aria-hidden="true">😴</span>
            <span className={styles.restTitle}>Vilodag idag</span>
            <span className={styles.restSub}>Vila och återhämtning — bra jobbat i veckan!</span>
          </div>
        )}

        {!loading && todayExercises.length > 0 && (
          <div className={styles.exercises}>
            {displayedExercises.map(({ current: ex, originalIdx }) => (
              (() => {
                const spec = customSpecs[ex.id] ?? getExerciseSpec(ex.id)
                const m = metrics[ex.id] ?? null
                const guard = sessionGuard[ex.id] ?? { consecutiveFails: 0, consecutiveSlow: 0 }
                const rec = buildRecommendation(
                  m?.success_count ?? 0,
                  m?.fail_count ?? 0,
                  m?.latency_bucket ?? null,
                  ageWeeks,
                  guard
                )
                const showTroubleshooting = rec?.kind === 'lower' || rec?.kind === 'stop'
                return (
              <ExerciseRow
                key={`${originalIdx}-${ex.id}`}
                exercise={ex}
                done={progress[ex.id] ?? 0}
                onRepClick={() => handleRepClick(ex.id, progress[ex.id] ?? 0, ex.reps)}
                onOpenGuide={() => setGuideExerciseId(ex.id)}
                spec={spec}
                metrics={m}
                recommendation={rec?.message ?? null}
                showTroubleshooting={showTroubleshooting}
                onMetricsPatch={(patch) => patchMetrics(ex.id, patch)}
                ageWeeks={ageWeeks}
                sessionNext={nextExerciseId === ex.id}
                rootId={nextExerciseId === ex.id ? 'training-session-next' : undefined}
                onSwap={swapCandidates.length > 0 ? () => handleSwap(originalIdx) : undefined}
              />
                )
              })()
            ))}
          </div>
        )}

        {!loading && (
          <div className={styles.footer}>
            <button
              type="button"
              className={styles.askBtn}
              onClick={() => router.push('/chat')}
            >
              Fråga om dagens pass
              <ChevronRight />
            </button>
            {weekPlan && (
              <button
                type="button"
                className={styles.weekBtn}
                onClick={() => setShowWeekView(true)}
              >
                Visa hela veckans schema
                <ChevronRight />
              </button>
            )}
            <button
              type="button"
              className={styles.weekBtn}
              onClick={() => setShowAddCustom(true)}
            >
              + Lägg till eget pass
              <ChevronRight />
            </button>
          </div>
        )}
      </section>

      {showWeekView && weekPlan && (
        <WeekView plan={weekPlan} onClose={() => setShowWeekView(false)} />
      )}

      {showLogForm && (
        <div className={styles.logOverlay} role="dialog" aria-modal="true" aria-label="Logga träningspass">
          <div className={styles.logSheet}>
            <SessionLogForm
              dogId={dogId}
              breed={breed}
              weekNumber={trainingWeek}
              exercises={buildExerciseSummaries(todayExercises, metrics)}
              onSaved={() => setShowLogForm(false)}
              onCancel={() => setShowLogForm(false)}
            />
          </div>
        </div>
      )}

      {guideExerciseId && (
        <ExerciseGuideSheet
          exerciseId={guideExerciseId}
          exerciseLabel={todayExercises.find((e) => e.id === guideExerciseId)?.label}
          metrics={metrics[guideExerciseId] ?? null}
          onClose={() => setGuideExerciseId(null)}
          customSpecs={customSpecs}
        />
      )}

      {showAddCustom && (
        <AddCustomExerciseModal
          dogId={dogId}
          onClose={() => setShowAddCustom(false)}
          onCreated={() => {
            setShowAddCustom(false)
            fetch(`/api/training/custom?dogId=${encodeURIComponent(dogId)}`)
              .then((r) => r.ok ? r.json() : [])
              .then((rows: Array<{ exercise_id: string; spec: ExerciseSpec }>) => {
                const map: Record<string, ExerciseSpec> = {}
                for (const row of rows) map[row.exercise_id] = row.spec
                setCustomSpecs(map)
              })
              .catch(() => {})
          }}
        />
      )}
    </>
  )
}

function ChevronRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

function buildExerciseSummaries(
  exercises: Exercise[],
  metrics: Record<string, DailyExerciseMetrics>
): ExerciseSummary[] {
  return exercises.map((ex) => {
    const m = metrics[ex.id]
    return {
      id: ex.id,
      label: ex.label,
      success_count: m?.success_count ?? 0,
      fail_count: m?.fail_count ?? 0,
      latency_bucket: m?.latency_bucket ?? null,
      criteria_level_id: m?.criteria_level_id ?? null,
    }
  })
}

function emptyMetrics(): DailyExerciseMetrics {
  return {
    success_count: 0,
    fail_count: 0,
    latency_bucket: null,
    criteria_level_id: null,
  }
}

function buildRecommendation(
  successCount: number,
  failCount: number,
  latencyBucket: LatencyBucket | null,
  ageWeeks: number,
  guard: { consecutiveFails: number; consecutiveSlow: number }
): { kind: 'keep' | 'raise' | 'lower' | 'stop'; message: string } | null {
  const attempts = successCount + failCount
  const isPuppy = ageWeeks > 0 && ageWeeks < 16

  if (guard.consecutiveFails >= 2 || guard.consecutiveSlow >= 2) {
    return {
      kind: 'stop',
      message:
        'Pausa och backa nivån direkt — avsluta efter en lyckad rep. Om hunden inte tar belöning kan den vara stressad eller över tröskeln: gör lättare eller öka avstånd.',
    }
  }
  if (attempts < 5) return { kind: 'keep', message: 'Kör några fler försök på samma nivå och bygg flyt.' }

  const rate = attempts > 0 ? successCount / attempts : 0
  if (rate >= 0.8 && latencyBucket !== 'gt3s' && !isPuppy) {
    return { kind: 'raise', message: 'Höj kriteriet ett steg (lite svårare miljö/störning/avstånd).' }
  }
  if (rate <= 0.5 || latencyBucket === 'gt3s') {
    return {
      kind: 'lower',
      message:
        'Sänk kriteriet ett steg och höj belöningsvärdet. Många miss eller långsam svarstid betyder oftast att kraven är för höga just nu.',
    }
  }
  return { kind: 'keep', message: 'Behåll nivån och stabilisera (sikta på ≥80% och kort latens).' }
}
