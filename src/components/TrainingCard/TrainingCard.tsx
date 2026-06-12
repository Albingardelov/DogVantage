'use client'

import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import ExerciseRow from './ExerciseRow'
import WeekView from './WeekView'
import SessionLogForm from '@/components/SessionLogForm'
import ExerciseGuideSheet from '@/components/ExerciseGuideSheet'
import styles from './TrainingCard.module.css'
import type { Breed, TrainingGoal, TrainingEnvironment, RewardPreference, Exercise, DailyExerciseMetrics, HouseholdPet } from '@/types'
import { getExerciseSpec } from '@/lib/training/exercise-specs'
import { buildWeekFocusCopy } from '@/lib/training/week-focus-copy'
import { FOCUS_EXERCISE_LABELS, focusExerciseIds, type WeeklyFocusArea } from '@/lib/training/weekly-focus'
import WeekFocusPanel from './WeekFocusPanel'
import WeeklyFocusPicker from './WeeklyFocusPicker'
import PreSessionChecklist from './PreSessionChecklist'
import AddCustomExerciseModal from '@/components/AddCustomExerciseModal'
import { useTrainingData } from './use-training-data'
import { useCustomSpecs } from './use-custom-specs'
import { useTodayExercises } from './use-today-exercises'
import { useExerciseSources } from './use-exercise-sources'
import { advanceGuard, EMPTY_GUARD, type SessionGuard } from '@/lib/training/session-coach'
import { useDogState } from './use-dog-state'
import { useDayCheckIn } from './use-day-checkin'
import DayCheckInCard from './DayCheckInCard'
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
  const dogState = useDogState(dogId)
  const { checkIn, loaded: checkInLoaded, save: saveDayCheckIn } = useDayCheckIn(dogId, todayDate)
  const [checkInDismissed, setCheckInDismissed] = useState(false)

  const [sessionGuard, setSessionGuard] = useState<Record<string, SessionGuard>>({})
  const [showWeekView, setShowWeekView] = useState(false)
  const [showLogForm, setShowLogForm] = useState(false)
  const [guideExerciseId, setGuideExerciseId] = useState<string | null>(null)
  const [showAddCustom, setShowAddCustom] = useState(false)
  const [simpleFocus, setSimpleFocus] = useState(false)
  const [focusAreas, setFocusAreas] = useState<WeeklyFocusArea[]>([])
  const [priorityExerciseIds, setPriorityExerciseIds] = useState<string[]>([])
  const [regressExerciseIds, setRegressExerciseIds] = useState<string[]>([])
  const [regressReasonByExercise, setRegressReasonByExercise] = useState<Record<string, string>>({})
  const [legendOpen, setLegendOpen] = useState<'priority' | 'focus' | 'weak' | null>(null)
  const legendRef = useRef<HTMLDivElement | null>(null)

  const weekFocusCopy = useMemo(
    () => buildWeekFocusCopy({ breed, ageWeeks, trainingWeek, goals }),
    [breed, ageWeeks, trainingWeek, goals],
  )

  const {
    todayPlan, todayExercisesWithIndex, todayExercises, displayedExercises,
    nextExerciseId, nextExercise, swapCandidates, setSwaps,
    completedCount, scaleMode, scaleNote,
  } = useTodayExercises({
    weekPlan,
    progress,
    focusAreas,
    simpleFocus,
    dayCheckIn: checkIn,
    metrics,
    priorityIds: priorityExerciseIds,
  })

  const todayExerciseIds = useMemo(() => todayExercises.map((e) => e.id), [todayExercises])
  const exerciseSources = useExerciseSources(dogId, todayExerciseIds)

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

  const focusExerciseSet = useMemo(() => new Set(focusExerciseIds(focusAreas)), [focusAreas])
  const priorityExerciseSet = useMemo(() => new Set(priorityExerciseIds), [priorityExerciseIds])
  const regressExerciseSet = useMemo(() => new Set(regressExerciseIds), [regressExerciseIds])

  const reasonBadgesForExercise = useCallback((exerciseId: string) => {
    const badges: Array<{ label: string; tone: 'priority' | 'focus' | 'weak'; detail?: string }> = []
    if (priorityExerciseSet.has(exerciseId)) {
      badges.push({
        label: 'Prioriterad',
        tone: 'priority',
        detail: 'Du har prioriterat denna övning för aktuell vecka.',
      })
    }
    if (focusExerciseSet.has(exerciseId)) {
      badges.push({
        label: 'Veckofokus',
        tone: 'focus',
        detail: 'Denna övning matchar ditt valda veckofokus.',
      })
    }
    if (regressExerciseSet.has(exerciseId)) {
      badges.push({
        label: 'Svag färdighet',
        tone: 'weak',
        detail: regressReasonByExercise[exerciseId] ?? 'Systemet ser låg träffsäkerhet och håller/sänker nivån.',
      })
    }
    return badges
  }, [focusExerciseSet, priorityExerciseSet, regressExerciseSet, regressReasonByExercise])

  const refreshPlanningSignals = useCallback(async () => {
    if (!dogId || !breed) return
    try {
      const [focusRes, progressionRes] = await Promise.all([
        fetch(`/api/training/focus?dogId=${encodeURIComponent(dogId)}`),
        fetch(`/api/training/progression?dogId=${encodeURIComponent(dogId)}`),
      ])
      if (focusRes.ok) {
        const focusBody = await focusRes.json() as { areas?: WeeklyFocusArea[]; exerciseIds?: string[] }
        setFocusAreas(focusBody.areas ?? [])
        setPriorityExerciseIds(focusBody.exerciseIds ?? [])
      }
      if (progressionRes.ok) {
        const progressionBody = await progressionRes.json() as { decisions?: Array<{ exerciseId: string; decision: 'advance' | 'hold' | 'regress'; reason: string }> }
        const regressRows = (progressionBody.decisions ?? []).filter((d) => d.decision === 'regress')
        const regressIds = regressRows.map((d) => d.exerciseId)
        const reasonMap = Object.fromEntries(
          regressRows.map((d) => [d.exerciseId, d.reason]),
        )
        setRegressExerciseIds(regressIds)
        setRegressReasonByExercise(reasonMap)
      }
    } catch (e) {
      console.error('[training signals]', e)
    }
  }, [dogId, breed])

  useEffect(() => {
    refreshPlanningSignals()
  }, [refreshPlanningSignals])

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!legendRef.current) return
      if (!legendRef.current.contains(event.target as Node)) {
        setLegendOpen(null)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [])

  function commitProgress(exerciseId: string, count: number) {
    const newProgress = { ...progress, [exerciseId]: count }
    setProgress(newProgress)

    const allDone = todayExercises.length > 0 &&
      todayExercises.every((e) => (newProgress[e.id] ?? 0) >= e.reps)
    if (allDone) setShowLogForm(true)

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

        {!loading && checkInLoaded && !checkIn && !checkInDismissed && !todayPlan?.rest && (
          <DayCheckInCard
            dogName={props.dogName}
            onSave={saveDayCheckIn}
            onDismiss={() => setCheckInDismissed(true)}
          />
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
            onLoaded={(areas) => { setFocusAreas(areas); refreshPlanningSignals() }}
            onChange={(areas) => { setFocusAreas(areas); refresh(); refreshPlanningSignals() }}
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

        {!loading && todayExercises.length > 0 && !todayPlan?.rest && (
          <div ref={legendRef}>
            <div className={styles.badgeLegend}>
              <button
                type="button"
                className={`${styles.badgeLegendItem} ${styles.badgePriority}`}
                onClick={() => setLegendOpen((prev) => prev === 'priority' ? null : 'priority')}
              >
                Prioriterad
              </button>
              <button
                type="button"
                className={`${styles.badgeLegendItem} ${styles.badgeFocus}`}
                onClick={() => setLegendOpen((prev) => prev === 'focus' ? null : 'focus')}
              >
                Veckofokus
              </button>
              <button
                type="button"
                className={`${styles.badgeLegendItem} ${styles.badgeWeak}`}
                onClick={() => setLegendOpen((prev) => prev === 'weak' ? null : 'weak')}
              >
                Svag färdighet
              </button>
            </div>
            {legendOpen && (
              <p className={styles.legendHelp}>
                {legendOpen === 'priority'
                  ? 'Prioriterad: du har valt att övningen ska få extra plats i veckoplanen.'
                  : legendOpen === 'focus'
                    ? 'Veckofokus: övningen kommer från ditt aktiva fokusområde för veckan.'
                    : 'Svag färdighet: aktuell data visar låg träffsäkerhet, så nivån hålls eller sänks.'}
              </p>
            )}
          </div>
        )}

        {loading && <LoadingIndicator />}
        {!loading && error && <p className={styles.errorMsg}>Kunde inte hämta träningsplan. Försök igen.</p>}
        {!loading && referral && <ReferralCard text={referral} />}
        {!loading && todayPlan?.rest && <RestDay />}

        {!loading && scaleNote && (
          <p className={styles.scaleNote}>{scaleNote}</p>
        )}

        {!loading && todayExercises.length > 0 && (
          <div className={styles.exercises}>
            {displayedExercises.map(({ current: ex, originalIdx }) => {
              const spec = customSpecs[ex.id] ?? getExerciseSpec(ex.id)
              const m = metrics[ex.id] ?? null
              const guard = sessionGuard[ex.id] ?? EMPTY_GUARD
              return (
                <ExerciseRow
                  key={`${originalIdx}-${ex.id}`}
                  exercise={ex}
                  done={progress[ex.id] ?? 0}
                  onRepClick={() => handleRepClick(ex.id, progress[ex.id] ?? 0, ex.reps)}
                  onOpenGuide={() => setGuideExerciseId(ex.id)}
                  spec={spec}
                  metrics={m}
                  guard={guard}
                  advanceThresholdDelta={dogState?.thresholdAdjustments[ex.id] ?? 0}
                  onEndExercise={() => commitProgress(ex.id, ex.reps)}
                  onMetricsPatch={(patch) => patchMetrics(ex.id, patch)}
                  ageWeeks={ageWeeks}
                  sessionNext={nextExerciseId === ex.id}
                  rootId={nextExerciseId === ex.id ? 'training-session-next' : undefined}
                  hasNextExercise={nextExerciseId !== null}
                  onSwap={scaleMode === 'full' && swapCandidates.length > 0 ? () => handleSwap(originalIdx) : undefined}
                  reasonBadges={reasonBadgesForExercise(ex.id)}
                  sources={exerciseSources[ex.id]}
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

      {showWeekView && weekPlan && (
        <WeekView
          plan={weekPlan}
          onClose={() => setShowWeekView(false)}
          getReasonBadges={reasonBadgesForExercise}
        />
      )}

      {showLogForm && (
        <div className={styles.logOverlay} role="dialog" aria-modal="true" aria-label="Logga träningspass">
          <div className={styles.logSheet}>
            <SessionLogForm
              dogId={dogId}
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

