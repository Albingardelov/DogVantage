'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import ExerciseRow from './ExerciseRow'
import WeekView from './WeekView'
import styles from './TrainingCard.module.css'
import type { Breed, WeekPlan, Exercise } from '@/types'

const SWEDISH_DAYS = ['Söndag', 'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag']

function todayDateString(): string {
  return new Date().toISOString().split('T')[0]
}

interface Props {
  weekNumber: number
  breed: Breed
  dogName: string
}

export default function TrainingCard({ weekNumber, breed, dogName }: Props) {
  const router = useRouter()
  const [weekPlan, setWeekPlan] = useState<WeekPlan | null>(null)
  const [progress, setProgress] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [showWeekView, setShowWeekView] = useState(false)
  const todayDate = todayDateString()
  const todayName = SWEDISH_DAYS[new Date().getDay()]

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [planRes, progressRes] = await Promise.all([
        fetch(`/api/training/week?breed=${breed}&week=${weekNumber}`),
        fetch(`/api/training/progress?breed=${breed}&date=${todayDate}`),
      ])
      if (planRes.ok) setWeekPlan(await planRes.json())
      if (progressRes.ok) setProgress(await progressRes.json())
    } finally {
      setLoading(false)
    }
  }, [breed, weekNumber, todayDate])

  useEffect(() => { fetchData() }, [fetchData])

  function handleRepClick(exerciseId: string, currentDone: number, maxReps: number) {
    if (currentDone >= maxReps) return
    const newDone = currentDone + 1
    setProgress((prev) => ({ ...prev, [exerciseId]: newDone }))
    fetch('/api/training/progress', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ breed, date: todayDate, exerciseId, count: newDone }),
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
              <ExerciseRow
                key={ex.id}
                exercise={ex}
                done={progress[ex.id] ?? 0}
                onRepClick={() => handleRepClick(ex.id, progress[ex.id] ?? 0, ex.reps)}
              />
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
