'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import ExerciseRow from './ExerciseRow'
import WeekView from './WeekView'
import SessionLogForm from '@/components/SessionLogForm'
import ExerciseGuideSheet from '@/components/ExerciseGuideSheet'
import styles from './TrainingCard.module.css'
import type { Breed, TrainingGoal, WeekPlan, Exercise, DailyExerciseMetrics, LatencyBucket, ExerciseSummary } from '@/types'
import { getExerciseSpec } from '@/lib/training/exercise-specs'

const SWEDISH_DAYS = ['Söndag', 'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag']

function todayDateString(): string {
  return new Date().toISOString().split('T')[0]
}

interface Props {
  trainingWeek: number
  ageWeeks: number
  breed: Breed
  dogName: string
  dogKey: string
  goals?: TrainingGoal[]
}

export default function TrainingCard({ trainingWeek, ageWeeks, breed, dogName, dogKey, goals }: Props) {
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
  const todayDate = todayDateString()
  const todayName = SWEDISH_DAYS[new Date().getDay()]

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const [planRes, progressRes, metricsRes] = await Promise.all([
        fetch(`/api/training/week?breed=${breed}&week=${trainingWeek}&ageWeeks=${ageWeeks}${goals && goals.length > 0 ? `&goals=${goals.join(',')}` : ''}`),
        fetch(`/api/training/progress?breed=${breed}&date=${todayDate}&dogKey=${encodeURIComponent(dogKey)}`),
        fetch(`/api/training/metrics?breed=${breed}&date=${todayDate}&dogKey=${encodeURIComponent(dogKey)}`),
      ])
      if (planRes.ok) setWeekPlan(await planRes.json())
      if (progressRes.ok) setProgress(await progressRes.json())
      if (metricsRes.ok) setMetrics(await metricsRes.json())
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [breed, trainingWeek, ageWeeks, todayDate, goals])

  useEffect(() => { fetchData() }, [fetchData])

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
      body: JSON.stringify({ breed, date: todayDate, dogKey, exerciseId, count: newDone }),
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
      body: JSON.stringify({ breed, date: todayDate, dogKey, exerciseId, patch }),
    }).catch(console.error)
  }

  const todayPlan = weekPlan?.days.find((d) => d.day === todayName)
  const todayExercises: Exercise[] = todayPlan?.exercises ?? []
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
            {todayExercises.map((ex) => (
              (() => {
                const spec = getExerciseSpec(ex.id)
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
                key={ex.id}
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
          metrics={metrics[guideExerciseId] ?? null}
          onClose={() => setGuideExerciseId(null)}
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
    return { kind: 'stop', message: 'Pausa och backa nivån direkt. Avsluta efter 1 lyckad rep.' }
  }
  if (attempts < 5) return { kind: 'keep', message: 'Kör några fler försök på samma nivå och bygg flyt.' }

  const rate = attempts > 0 ? successCount / attempts : 0
  if (rate >= 0.8 && latencyBucket !== 'gt3s' && !isPuppy) {
    return { kind: 'raise', message: 'Höj kriteriet ett steg (lite svårare miljö/störning/avstånd).' }
  }
  if (rate <= 0.5 || latencyBucket === 'gt3s') {
    return { kind: 'lower', message: 'Sänk kriteriet ett steg och höj belöningsvärdet.' }
  }
  return { kind: 'keep', message: 'Behåll nivån och stabilisera (sikta på ≥80% och kort latens).' }
}
