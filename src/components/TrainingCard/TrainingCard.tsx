'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import ExerciseRow from './ExerciseRow'
import WeekView from './WeekView'
import SessionLogForm from '@/components/SessionLogForm'
import ExerciseGuideSheet from '@/components/ExerciseGuideSheet'
import styles from './TrainingCard.module.css'
import type { Breed, TrainingGoal, TrainingEnvironment, RewardPreference, Exercise, DailyExerciseMetrics, HouseholdPet } from '@/types'
import { getExerciseSpec } from '@/lib/training/exercise-specs'
import { buildWeekFocusCopy } from '@/lib/training/week-focus-copy'
import { FOCUS_EXERCISE_LABELS, type WeeklyFocusArea } from '@/lib/training/weekly-focus'
import WeekFocusPanel from './WeekFocusPanel'
import WeeklyFocusPicker from './WeeklyFocusPicker'
import PreSessionChecklist from './PreSessionChecklist'
import AddCustomExerciseModal from '@/components/AddCustomExerciseModal'
import { useTrainingData } from './use-training-data'
import { useCustomSpecs } from './use-custom-specs'
import { useTodayExercises } from './use-today-exercises'
import { buildRecommendation, type SessionGuard } from './recommendation'
import { buildExerciseSummaries, emptyMetrics } from './exercise-helpers'
import { NextBanner, LoadingIndicator, ReferralCard, RestDay, ChevronRight } from './parts'
import DayProgressBar from './DayProgressBar'

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

export default function TrainingCard(props: Props) {
  const { trainingWeek, ageWeeks, breed, dogId, goals } = props
  const router = useRouter()
  const todayDate = useMemo(todayDateString, [])

  const { weekPlan, progress, metrics, loading, error, referral, refresh, setProgress, setMetrics } =
    useTrainingData({ ...props, todayDate })
  const { customSpecs, refresh: refreshCustomSpecs } = useCustomSpecs(dogId)

  const [sessionGuard, setSessionGuard] = useState<Record<string, SessionGuard>>({})
  const [showWeekView, setShowWeekView] = useState(false)
  const [showLogForm, setShowLogForm] = useState(false)
  const [guideExerciseId, setGuideExerciseId] = useState<string | null>(null)
  const [showAddCustom, setShowAddCustom] = useState(false)
  const [simpleFocus, setSimpleFocus] = useState(false)
  const [focusAreas, setFocusAreas] = useState<WeeklyFocusArea[]>([])

  const weekFocusCopy = useMemo(
    () => buildWeekFocusCopy({ breed, ageWeeks, trainingWeek, goals }),
    [breed, ageWeeks, trainingWeek, goals],
  )

  const {
    todayPlan, todayExercisesWithIndex, todayExercises, displayedExercises,
    nextExerciseId, nextExercise, swapCandidates, setSwaps,
    completedCount,
  } = useTodayExercises({ weekPlan, progress, focusAreas, simpleFocus })

  const repsPlanned = useMemo(
    () => todayExercises.reduce((sum, exercise) => sum + exercise.reps, 0),
    [todayExercises],
  )
  const repsDone = useMemo(
    () =>
      todayExercises.reduce((sum, exercise) => {
        const done = Math.min(progress[exercise.id] ?? 0, exercise.reps)
        return sum + done
      }, 0),
    [todayExercises, progress],
  )

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
          <PreSessionChecklist ageWeeks={ageWeeks} dateKey={todayDate} dogId={dogId} />
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
            onChange={(areas) => { setFocusAreas(areas); refresh() }}
          />
        )}

        {!loading && (
          <DayProgressBar
            repsDone={repsDone}
            repsPlanned={repsPlanned}
            isRestDay={Boolean(todayPlan?.rest)}
          />
        )}

        {!loading && nextExercise && !todayPlan?.rest && !(simpleFocus && todayExercises.length > 2) && (
          <NextBanner label={nextExercise.label} />
        )}

        {loading && <LoadingIndicator />}
        {!loading && error && <p className={styles.errorMsg}>Kunde inte hämta träningsplan. Försök igen.</p>}
        {!loading && referral && <ReferralCard text={referral} />}
        {!loading && todayPlan?.rest && <RestDay />}

        {!loading && todayExercises.length > 0 && (
          <div className={styles.exercises}>
            {displayedExercises.map(({ current: ex, originalIdx }) => {
              const spec = customSpecs[ex.id] ?? getExerciseSpec(ex.id)
              const m = metrics[ex.id] ?? null
              const guard = sessionGuard[ex.id] ?? { consecutiveFails: 0, consecutiveSlow: 0 }
              const rec = buildRecommendation(
                m?.success_count ?? 0, m?.fail_count ?? 0, m?.latency_bucket ?? null, ageWeeks, guard,
              )
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
                  showTroubleshooting={rec?.kind === 'lower' || rec?.kind === 'stop'}
                  onMetricsPatch={(patch) => patchMetrics(ex.id, patch)}
                  ageWeeks={ageWeeks}
                  sessionNext={nextExerciseId === ex.id}
                  rootId={nextExerciseId === ex.id ? 'training-session-next' : undefined}
                  onSwap={swapCandidates.length > 0 ? () => handleSwap(originalIdx) : undefined}
                />
              )
            })}
          </div>
        )}

        {!loading && (
          <div className={styles.footer}>
            <button type="button" className={styles.askBtn} onClick={() => router.push('/chat')}>
              Fråga om dagens pass<ChevronRight />
            </button>
            {weekPlan && (
              <button type="button" className={styles.weekBtn} onClick={() => setShowWeekView(true)}>
                Visa hela veckans schema<ChevronRight />
              </button>
            )}
            <button type="button" className={styles.weekBtn} onClick={() => setShowAddCustom(true)}>
              + Lägg till eget pass<ChevronRight />
            </button>
          </div>
        )}
      </section>

      {showWeekView && weekPlan && <WeekView plan={weekPlan} onClose={() => setShowWeekView(false)} />}

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
          onCreated={() => { setShowAddCustom(false); refreshCustomSpecs() }}
        />
      )}
    </>
  )
}

