'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import ProfileGuard from '@/components/ProfileGuard'
import BottomNav from '@/components/BottomNav'
import ExerciseGuideSheet from '@/components/ExerciseGuideSheet'
import { IconCaretRight, SelectionCheck } from '@/components/icons'
import { getDogProfile, updateDogProfile } from '@/lib/dog/profile'
import { getAgeInWeeks } from '@/lib/dog/age'
import { getExerciseSpec } from '@/lib/training/exercise-specs'
import { computeStartingWeek } from '@/lib/training/assessment-week'
import { GOAL_EXERCISE_IDS } from '@/lib/training/goal-exercises'
import {
  TRIGGER_LABELS,
  LEASH_LABELS,
  ENV_REACTION_LABELS,
  BACKGROUND_LABELS,
  HOUSEHOLD_PET_LABELS,
} from '@/lib/dog/behavior'
import type {
  DailyExerciseMetrics,
  DogProfile,
  LatencyBucket,
  BehaviorProfile,
  TriggerType,
  LeashBehavior,
  NewEnvironmentReaction,
  TrainingBackground,
  HouseholdPet,
} from '@/types'
import styles from './page.module.css'

type ExerciseId = string

const LATENCY: { id: LatencyBucket; label: string }[] = [
  { id: 'lt1s', label: '<1s' },
  { id: '1to3s', label: '1–3s' },
  { id: 'gt3s', label: '>3s' },
]

const ALL_TRIGGERS = Object.keys(TRIGGER_LABELS) as TriggerType[]
const ALL_HOUSEHOLD_PETS = Object.keys(HOUSEHOLD_PET_LABELS) as HouseholdPet[]

export default function AssessmentPage() {
  return (
    <ProfileGuard>
      <Assessment />
    </ProfileGuard>
  )
}

function Assessment() {
  const router = useRouter()
  const [profile, setProfile] = useState<DogProfile | null>(null)
  const [step, setStep] = useState<0 | 1>(0)

  // Step 0 — behavior profile
  // Gate: if the dog hasn't been out yet (new puppy before walks), don't pretend
  // we know leash/env-reaction/triggers. Avoids fabricated answers poisoning the plan.
  const [hasBeenOut, setHasBeenOut] = useState<boolean | null>(null)
  const [triggers, setTriggers] = useState<TriggerType[]>([])
  const [leashBehavior, setLeashBehavior] = useState<LeashBehavior>('calm')
  const [envReaction, setEnvReaction] = useState<NewEnvironmentReaction>('curious')
  const [background, setBackground] = useState<TrainingBackground>('beginner')
  const [householdPets, setHouseholdPets] = useState<HouseholdPet[]>([])
  const [problemNotes, setProblemNotes] = useState('')

  // Step 1 — exercise test
  const [metrics, setMetrics] = useState<Record<ExerciseId, DailyExerciseMetrics>>({})
  const [saving, setSaving] = useState(false)
  const [guideExerciseId, setGuideExerciseId] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      const p = await getDogProfile()
      if (alive && p) setProfile(p)
    })().catch((e) => console.error('[assessment getDogProfile]', e))
    return () => { alive = false }
  }, [])

  const ageWeeks = profile ? Math.max(1, getAgeInWeeks(profile.birthdate)) : 0

  const exerciseIds = useMemo(() => {
    const goals = profile?.onboarding?.goals ?? ['everyday_obedience']
    const merged = [...new Set(goals.flatMap((g) => GOAL_EXERCISE_IDS[g] ?? GOAL_EXERCISE_IDS.everyday_obedience))]
    return merged.slice(0, 7)
  }, [profile?.onboarding?.goals])

  const exercisesComplete = exerciseIds.every((id) => {
    const m = metrics[id]
    return (m?.success_count ?? 0) + (m?.fail_count ?? 0) >= 5
  })

  function toggleTrigger(t: TriggerType) {
    setTriggers((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    )
  }

  function togglePet(p: HouseholdPet) {
    setHouseholdPets((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    )
  }

  async function patchMetrics(exerciseId: string, patch: Partial<DailyExerciseMetrics>) {
    if (!profile) return
    const today = new Date().toISOString().split('T')[0]
    setMetrics((prev) => ({
      ...prev,
      [exerciseId]: { ...(prev[exerciseId] ?? emptyMetrics()), ...patch },
    }))
    await fetch('/api/training/metrics', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ breed: profile.breed, date: today, dogId: profile.id ?? '', exerciseId, patch }),
    })
  }

  async function finish() {
    if (!profile || !exercisesComplete) return
    setSaving(true)
    try {
      const behaviorProfile: BehaviorProfile = {
        triggers,
        leashBehavior,
        newEnvironmentReaction: envReaction,
        trainingBackground: background,
        householdPets,
        problemNotes: problemNotes.trim() || undefined,
      }
      const startingWeek = computeStartingWeek(ageWeeks, metrics)
      await updateDogProfile({
        id: profile.id,
        trainingWeek: startingWeek,
        assessment: {
          status: 'completed',
          completed_at: new Date().toISOString(),
          behaviorProfile,
        },
      })
      router.replace('/dashboard')
    } finally {
      setSaving(false)
    }
  }

  if (!profile) return null

  return (
    <main className={styles.main}>
      {/* ── Progress indicator ── */}
      <div className={styles.stepProgress}>
        <div className={`${styles.stepDot} ${styles.stepDotActive}`}>1</div>
        <div className={`${styles.stepLine} ${step === 1 ? styles.stepLineActive : ''}`} />
        <div className={`${styles.stepDot} ${step === 1 ? styles.stepDotActive : ''}`}>2</div>
      </div>

      {step === 0 && (
        <>
          <header className={styles.header}>
            <h1 className={styles.title}>Berätta om hunden</h1>
            <p className={styles.sub}>
              Svara snabbt — det tar 2–3 min. Vi använder det för att anpassa träningsrekommendationerna.
            </p>
          </header>

          <div className={styles.list}>
            {/* Träningsbakgrund */}
            <div className={styles.card}>
              <p className={styles.question}>Hur erfaren är du som hundtränare?</p>
              <div className={styles.optionList}>
                {(Object.keys(BACKGROUND_LABELS) as TrainingBackground[]).map((k) => (
                  <button
                    key={k}
                    type="button"
                    className={`${styles.optionBtn} ${background === k ? styles.optionBtnSelected : ''}`}
                    onClick={() => setBackground(k)}
                    aria-pressed={background === k}
                  >
                    {background === k && <SelectionCheck />}
                    {BACKGROUND_LABELS[k]}
                  </button>
                ))}
              </div>
            </div>

            {/* Har hunden varit ute regelbundet? — gate för beteendefrågor */}
            <div className={styles.card}>
              <p className={styles.question}>
                Har hunden varit ute regelbundet i okända miljöer?
                <span className={styles.questionSub}> Hoppa över beteendefrågor om svaret är nej — vi vill inte att ni gissar.</span>
              </p>
              <div className={styles.optionList}>
                {[
                  { v: true, label: 'Ja, går promenader och möter andra miljöer' },
                  { v: false, label: 'Nej, ny valp eller hund som inte börjat ute ännu' },
                ].map((o) => (
                  <button
                    key={String(o.v)}
                    type="button"
                    className={`${styles.optionBtn} ${hasBeenOut === o.v ? styles.optionBtnSelected : ''}`}
                    onClick={() => {
                      setHasBeenOut(o.v)
                      if (!o.v) {
                        setLeashBehavior('not_yet_out')
                        setEnvReaction('not_yet_out')
                        setTriggers([])
                      } else if (leashBehavior === 'not_yet_out') {
                        setLeashBehavior('calm')
                        setEnvReaction('curious')
                      }
                    }}
                    aria-pressed={hasBeenOut === o.v}
                  >
                    {hasBeenOut === o.v && <SelectionCheck />}
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Koppelbeteende — gömd om hunden inte varit ute ännu */}
            {hasBeenOut !== false && (
              <div className={styles.card}>
                <p className={styles.question}>Hur fungerar koppeln generellt?</p>
                <div className={styles.optionList}>
                  {(Object.keys(LEASH_LABELS) as LeashBehavior[])
                    .filter((k) => k !== 'not_yet_out')
                    .map((k) => (
                    <button
                      key={k}
                      type="button"
                      className={`${styles.optionBtn} ${leashBehavior === k ? styles.optionBtnSelected : ''}`}
                      onClick={() => setLeashBehavior(k)}
                      aria-pressed={leashBehavior === k}
                    >
                      {leashBehavior === k && <SelectionCheck />}
                      {LEASH_LABELS[k]}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Ny miljö — gömd om hunden inte varit ute ännu */}
            {hasBeenOut !== false && (
              <div className={styles.card}>
                <p className={styles.question}>Hur reagerar hunden på ny miljö och okända?</p>
                <div className={styles.optionList}>
                  {(Object.keys(ENV_REACTION_LABELS) as NewEnvironmentReaction[])
                    .filter((k) => k !== 'not_yet_out')
                    .map((k) => (
                    <button
                      key={k}
                      type="button"
                      className={`${styles.optionBtn} ${envReaction === k ? styles.optionBtnSelected : ''}`}
                      onClick={() => setEnvReaction(k)}
                      aria-pressed={envReaction === k}
                    >
                      {envReaction === k && <SelectionCheck />}
                      {ENV_REACTION_LABELS[k]}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Triggers — gömd om hunden inte varit ute ännu */}
            {hasBeenOut !== false && (
            <div className={styles.card}>
              <p className={styles.question}>Vad brukar trigga hunden? <span className={styles.questionSub}>(välj alla som stämmer)</span></p>
              <div className={styles.triggerGrid}>
                {ALL_TRIGGERS.map((t) => {
                  const selected = triggers.includes(t)
                  return (
                    <button
                      key={t}
                      type="button"
                      className={`${styles.pill} ${selected ? styles.pillSelected : ''}`}
                      onClick={() => toggleTrigger(t)}
                      aria-pressed={selected}
                    >
                      {TRIGGER_LABELS[t]}
                    </button>
                  )
                })}
              </div>
              {triggers.length === 0 && (
                <p className={styles.triggerNone}>Inga kända triggers — lämna tomt och fortsätt.</p>
              )}
            </div>
            )}

            {/* Husdjur */}
            <div className={styles.card}>
              <p className={styles.question}>Finns det andra husdjur hemma? <span className={styles.questionSub}>(välj alla som stämmer)</span></p>
              <div className={styles.triggerGrid}>
                {ALL_HOUSEHOLD_PETS.map((p) => {
                  const selected = householdPets.includes(p)
                  return (
                    <button
                      key={p}
                      type="button"
                      className={`${styles.pill} ${selected ? styles.pillSelected : ''}`}
                      onClick={() => togglePet(p)}
                      aria-pressed={selected}
                    >
                      {HOUSEHOLD_PET_LABELS[p]}
                    </button>
                  )
                })}
              </div>
              {householdPets.length === 0 && (
                <p className={styles.triggerNone}>Inga andra husdjur — lämna tomt och fortsätt.</p>
              )}
            </div>

            {/* Fritext */}
            <div className={styles.card}>
              <p className={styles.question}>Något specifikt du vill lösa? <span className={styles.questionSub}>(valfritt)</span></p>
              <textarea
                className={styles.textarea}
                rows={3}
                placeholder="T.ex. hoppar på folk, skäller när ensam, rädd för smällar…"
                value={problemNotes}
                onChange={(e) => setProblemNotes(e.target.value)}
                maxLength={300}
              />
            </div>
          </div>

          <footer className={styles.footer}>
            <button
              type="button"
              className={styles.primary}
              onClick={() => setStep(1)}
              disabled={hasBeenOut === null}
            >
              Fortsätt till övningstest →
            </button>
            <button
              type="button"
              className={styles.secondary}
              onClick={() => router.replace('/dashboard')}
            >
              Hoppa över
            </button>
          </footer>
        </>
      )}

      {step === 1 && (
        <>
          <header className={styles.header}>
            <h1 className={styles.title}>Snabb övningstest (10–12 min)</h1>
            <p className={styles.sub}>
              Kör 5 försök per övning. Logga lyckad/miss + latens och välj kriterienivå.
            </p>
            <p className={styles.meta}>
              Ålder: {ageWeeks} veckor
            </p>
          </header>

          <div className={styles.list}>
            {exerciseIds.map((id) => (
              <AssessmentExercise
                key={id}
                exerciseId={id}
                metrics={metrics[id] ?? null}
                onPatch={(patch) => patchMetrics(id, patch)}
                onOpenGuide={() => setGuideExerciseId(id)}
              />
            ))}
          </div>

          <footer className={styles.footer}>
            <button
              type="button"
              className={styles.primary}
              onClick={finish}
              disabled={!exercisesComplete || saving}
            >
              {saving ? 'Sparar…' : 'Spara baseline →'}
            </button>
            <button
              type="button"
              className={styles.secondary}
              onClick={() => setStep(0)}
              disabled={saving}
            >
              ← Tillbaka
            </button>
          </footer>
        </>
      )}

      <BottomNav active="dashboard" />

      {guideExerciseId && (
        <ExerciseGuideSheet
          exerciseId={guideExerciseId}
          metrics={metrics[guideExerciseId] ?? null}
          onClose={() => setGuideExerciseId(null)}
        />
      )}
    </main>
  )
}

function AssessmentExercise({
  exerciseId,
  metrics,
  onPatch,
  onOpenGuide,
}: {
  exerciseId: string
  metrics: DailyExerciseMetrics | null
  onPatch: (patch: Partial<DailyExerciseMetrics>) => void
  onOpenGuide: () => void
}) {
  const spec = getExerciseSpec(exerciseId)
  if (!spec) return null

  const success = metrics?.success_count ?? 0
  const fail = metrics?.fail_count ?? 0
  const attempts = success + fail
  const rate = attempts > 0 ? Math.round((success / attempts) * 100) : null

  const levelId = metrics?.criteria_level_id ?? spec.ladder[0]?.id ?? null
  const latency = metrics?.latency_bucket ?? null

  return (
    <section className={styles.card}>
      <div className={styles.cardHeader}>
        <button
          type="button"
          className={styles.cardTitleBtn}
          onClick={onOpenGuide}
          aria-label={`Öppna guide: ${prettyLabel(exerciseId)}`}
          title="Steg-för-steg, tips och vanliga misstag"
        >
          <span className={styles.cardTitleText}>{prettyLabel(exerciseId)}</span>
          <span className={styles.cardTitleCue} aria-hidden="true">
            <span className={styles.cardTitleCueLabel}>Guide</span>
            <IconCaretRight size="sm" className={styles.cardTitleCueArrow} />
          </span>
        </button>
        <div className={styles.cardMeta}>{attempts}/5 · {rate != null ? `${rate}%` : '—'}</div>
      </div>

      <div className={styles.row}>
        <span className={styles.label}>Kriterium</span>
        <select
          className={styles.select}
          value={levelId ?? ''}
          onChange={(e) => onPatch({ criteria_level_id: e.target.value || null })}
        >
          {spec.ladder.map((l) => (
            <option key={l.id} value={l.id}>{l.label}</option>
          ))}
        </select>
      </div>

      <div className={styles.row}>
        <span className={styles.label}>Utfall</span>
        <div className={styles.pills}>
          <button type="button" className={styles.pill} onClick={() => onPatch({ success_count: success + 1 })}>
            Lyckad
          </button>
          <button type="button" className={styles.pill} onClick={() => onPatch({ fail_count: fail + 1 })}>
            Miss
          </button>
        </div>
      </div>

      <div className={styles.row}>
        <span className={styles.label}>Latens</span>
        <div className={styles.pills}>
          {LATENCY.map((b) => {
            const selected = latency === b.id
            return (
              <button
                key={b.id}
                type="button"
                className={`${styles.pill} ${selected ? styles.pillSelected : ''}`}
                onClick={() => onPatch({ latency_bucket: b.id })}
                aria-pressed={selected}
              >
                {b.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className={styles.definition}>
        {spec.definition}
      </div>
    </section>
  )
}

function emptyMetrics(): DailyExerciseMetrics {
  return { success_count: 0, fail_count: 0, latency_bucket: null, criteria_level_id: null }
}

function prettyLabel(id: string): string {
  const map: Record<string, string> = {
    namn: 'Namnkontakt',
    inkallning: 'Inkallning',
    koppel: 'Koppel',
    stanna: 'Stanna',
    sitt: 'Sitt',
    ligg: 'Ligg',
    stoppsignal: 'Stoppsignal',
    stadga: 'Stadga',
    orientering: 'Orientering',
    kontrollerat_sok: 'Kontrollerat sök',
    impulskontroll: 'Impulskontroll',
    hantering: 'Hantering',
    socialisering: 'Socialisering',
    fokus: 'Fokus',
    nosework: 'Nosework',
    vallning: 'Vallning',
    apportering: 'Apportering',
    vatten: 'Vattenarbete',
  }
  return map[id] ?? id
}
