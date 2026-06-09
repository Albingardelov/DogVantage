'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import ExerciseRow from '../TrainingCard/ExerciseRow'
import DayProgressBar from '../TrainingCard/DayProgressBar'
import PreSessionChecklist from '../TrainingCard/PreSessionChecklist'
import ZoneCheckIn from './ZoneCheckIn'
import RecoveryCard from './RecoveryCard'
import styles from './PuppyDayCard.module.css'
import { getExerciseSpec } from '@/lib/training/exercise-specs'
import { buildRecommendation } from '../TrainingCard/recommendation'
import { buildExerciseSummaries, emptyMetrics } from '../TrainingCard/exercise-helpers'
import { usePuppyDay } from './use-puppy-day'
import SessionLogForm from '@/components/SessionLogForm'
import type { Breed, DailyExerciseMetrics, HouseholdPet, RewardPreference, TrainingEnvironment, TrainingGoal } from '@/types'
import { IconChevronRight } from '@/components/icons'

const ZONE_LABELS = { green: 'Grön dag', yellow: 'Gul dag', red: 'Röd dag' } as const
const ZONE_COLORS = { green: '#22c55e', yellow: '#eab308', red: '#ef4444' } as const

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
  householdPets?: HouseholdPet[]
}

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

export default function PuppyDayCard(props: Props) {
  const { ageWeeks, breed, dogName, dogId, trainingWeek } = props
  const router = useRouter()
  const todayDate = useMemo(todayStr, [])
  const [showLogForm, setShowLogForm] = useState(false)
  const [sessionGuard, setSessionGuard] = useState<Record<string, { consecutiveFails: number; consecutiveSlow: number }>>({})

  const { zone, exercises, progress, metrics, loading, error, saveZone, setProgress, setMetrics } =
    usePuppyDay({ ...props, todayDate })

  const repsPlanned = useMemo(() => exercises.reduce((s, e) => s + e.reps, 0), [exercises])
  const repsDone = useMemo(
    () => exercises.reduce((s, e) => s + Math.min(progress[e.id] ?? 0, e.reps), 0),
    [exercises, progress],
  )

  function handleRepClick(exerciseId: string, currentDone: number, maxReps: number) {
    if (currentDone >= maxReps) return
    const newDone = currentDone + 1
    const newProgress = { ...progress, [exerciseId]: newDone }
    setProgress(newProgress)
    if (exercises.every((e) => (newProgress[e.id] ?? 0) >= e.reps)) setShowLogForm(true)
    fetch('/api/training/progress', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ breed, date: todayDate, dogId, exerciseId, count: newDone }),
    }).catch(console.error)
  }

  function patchMetrics(exerciseId: string, patch: Partial<DailyExerciseMetrics>) {
    setSessionGuard((prev) => {
      const cur = prev[exerciseId] ?? { consecutiveFails: 0, consecutiveSlow: 0 }
      let next = cur
      if ('fail_count' in patch) next = { ...next, consecutiveFails: next.consecutiveFails + 1 }
      if (patch.latency_bucket === 'gt3s') next = { ...next, consecutiveSlow: next.consecutiveSlow + 1 }
      if ('success_count' in patch) next = { consecutiveFails: 0, consecutiveSlow: 0 }
      return { ...prev, [exerciseId]: next }
    })
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

  if (loading) {
    return (
      <section className={styles.card}>
        <div className={styles.loading}>
          <span className={styles.spinner} />
          <span>Laddar…</span>
        </div>
      </section>
    )
  }

  if (!zone) {
    return (
      <section className={styles.card}>
        <ZoneCheckIn dogName={dogName} onSelect={saveZone} />
      </section>
    )
  }

  if (zone === 'red') {
    return (
      <section className={styles.card}>
        <RecoveryCard />
      </section>
    )
  }

  const nextExerciseId = exercises.find((e) => (progress[e.id] ?? 0) < e.reps)?.id ?? null

  return (
    <>
      <section className={styles.card}>
        <div className={styles.header}>
          <span className={styles.headerTitle}>Dagens pass</span>
          <span className={styles.zoneBadge}>
            <span className={styles.zoneDot} style={{ background: ZONE_COLORS[zone] }} aria-hidden="true" />
            {ZONE_LABELS[zone]}
          </span>
        </div>

        {zone === 'yellow' && (
          <p className={styles.yellowFrame}>
            Kort och enkelt idag — en enkel vinst är allt ni behöver.
          </p>
        )}

        <PreSessionChecklist ageWeeks={ageWeeks} dateKey={todayDate} dogId={dogId} />

        <DayProgressBar repsDone={repsDone} repsPlanned={repsPlanned} isRestDay={false} />

        {error && <p className={styles.errorMsg}>Kunde inte hämta träningsplan. Försök igen.</p>}

        {exercises.length > 0 && (
          <div className={styles.exercises}>
            {exercises.map((ex) => {
              const spec = getExerciseSpec(ex.id)
              const m = metrics[ex.id] ?? null
              const guard = sessionGuard[ex.id] ?? { consecutiveFails: 0, consecutiveSlow: 0 }
              const rec = buildRecommendation(
                m?.success_count ?? 0, m?.fail_count ?? 0, m?.latency_bucket ?? null, ageWeeks, guard,
              )
              return (
                <ExerciseRow
                  key={ex.id}
                  exercise={ex}
                  done={progress[ex.id] ?? 0}
                  onRepClick={() => handleRepClick(ex.id, progress[ex.id] ?? 0, ex.reps)}
                  onOpenGuide={undefined}
                  spec={spec}
                  metrics={m}
                  recommendation={rec?.message ?? null}
                  showTroubleshooting={rec?.kind === 'lower' || rec?.kind === 'stop'}
                  onMetricsPatch={(patch) => patchMetrics(ex.id, patch)}
                  ageWeeks={ageWeeks}
                  sessionNext={nextExerciseId === ex.id}
                  rootId={nextExerciseId === ex.id ? 'training-session-next' : undefined}
                />
              )
            })}
          </div>
        )}

        <div className={styles.footer}>
          <button type="button" className={styles.askBtn} onClick={() => router.push('/chat')}>
            Fråga om dagens pass <IconChevronRight size="sm" />
          </button>
        </div>
      </section>

      {showLogForm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Logga träningspass"
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'flex-end' }}
        >
          <div style={{ background: '#fff', borderRadius: '16px 16px 0 0', padding: 24, width: '100%' }}>
            <SessionLogForm
              dogId={dogId}
              breed={breed}
              weekNumber={trainingWeek}
              exercises={buildExerciseSummaries(exercises, metrics)}
              onSaved={() => setShowLogForm(false)}
              onCancel={() => setShowLogForm(false)}
            />
          </div>
        </div>
      )}
    </>
  )
}
