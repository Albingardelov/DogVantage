'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import ExerciseRow from '../TrainingCard/ExerciseRow'
import DayProgressBar from '../TrainingCard/DayProgressBar'
import PreSessionChecklist from '../TrainingCard/PreSessionChecklist'
import ExerciseGuideSheet from '@/components/ExerciseGuideSheet'
import ZoneCheckIn from './ZoneCheckIn'
import RecoveryCard from './RecoveryCard'
import styles from './PuppyDayCard.module.css'
import { getExerciseSpec } from '@/lib/training/exercise-specs'
import { advanceGuard, EMPTY_GUARD, type SessionGuard } from '@/lib/training/session-coach'
import { buildExerciseSummaries, emptyMetrics } from '../TrainingCard/exercise-helpers'
import { usePuppyDay } from './use-puppy-day'
import SessionLogForm from '@/components/SessionLogForm'
import type { Breed, DailyExerciseMetrics, HouseholdPet, RewardPreference, TrainingEnvironment, TrainingGoal } from '@/types'
import { DvIcon, IconChevronRight } from '@/components/icons'
import { SmileyMeh } from '@phosphor-icons/react'

const ZONE_LABELS = { green: 'Grön dag', yellow: 'Gul dag', red: 'Röd dag' } as const
const ZONE_COLORS = { green: 'var(--color-primary)', yellow: 'var(--color-accent)', red: 'var(--color-error)' } as const

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
  const { ageWeeks, dogName, dogId, trainingWeek } = props
  const router = useRouter()
  const todayDate = useMemo(todayStr, [])
  const [showLogForm, setShowLogForm] = useState(false)
  const [guideExerciseId, setGuideExerciseId] = useState<string | null>(null)
  const [sessionGuard, setSessionGuard] = useState<Record<string, SessionGuard>>({})

  const { zone, exercises, progress, metrics, loading, error, saveZone, setProgress, setMetrics } =
    usePuppyDay({ ...props, todayDate })

  const repsPlanned = useMemo(() => exercises.reduce((s, e) => s + e.reps, 0), [exercises])
  const repsDone = useMemo(
    () => exercises.reduce((s, e) => s + Math.min(progress[e.id] ?? 0, e.reps), 0),
    [exercises, progress],
  )

  function commitProgress(exerciseId: string, count: number) {
    const newProgress = { ...progress, [exerciseId]: count }
    setProgress(newProgress)
    if (exercises.every((e) => (newProgress[e.id] ?? 0) >= e.reps)) setShowLogForm(true)
    fetch('/api/training/progress', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: todayDate, dogId, exerciseId, count }),
    }).catch(console.error)
  }

  function handleRepClick(exerciseId: string, currentDone: number, maxReps: number) {
    if (currentDone >= maxReps) return
    commitProgress(exerciseId, currentDone + 1)
  }

  function patchMetrics(exerciseId: string, patch: Partial<DailyExerciseMetrics>) {
    setSessionGuard((prev) => ({
      ...prev,
      [exerciseId]: advanceGuard(prev[exerciseId] ?? EMPTY_GUARD, patch),
    }))
    setMetrics((prev) => ({
      ...prev,
      [exerciseId]: { ...(prev[exerciseId] ?? emptyMetrics()), ...patch },
    }))
    fetch('/api/training/metrics', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: todayDate, dogId, exerciseId, patch }),
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
            <span style={{ color: '#c8742f', display: 'inline-flex' }}>
              <DvIcon icon={SmileyMeh} size="sm" weight="fill" />
            </span>
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
              return (
                <ExerciseRow
                  key={ex.id}
                  exercise={ex}
                  done={progress[ex.id] ?? 0}
                  onRepClick={() => handleRepClick(ex.id, progress[ex.id] ?? 0, ex.reps)}
                  onOpenGuide={() => setGuideExerciseId(ex.id)}
                  spec={spec}
                  metrics={m}
                  guard={sessionGuard[ex.id] ?? EMPTY_GUARD}
                  onEndExercise={() => commitProgress(ex.id, ex.reps)}
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

      {guideExerciseId && (
        <ExerciseGuideSheet
          exerciseId={guideExerciseId}
          exerciseLabel={exercises.find((e) => e.id === guideExerciseId)?.label}
          metrics={metrics[guideExerciseId] ?? null}
          onClose={() => setGuideExerciseId(null)}
          customSpecs={{}}
        />
      )}

      {showLogForm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Logga träningspass"
          className={styles.logOverlay}
        >
          <div className={styles.logSheet}>
            <SessionLogForm
              dogId={dogId}
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
