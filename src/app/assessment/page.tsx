'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import ProfileGuard from '@/components/ProfileGuard'
import BottomNav from '@/components/BottomNav'
import ExerciseGuideSheet from '@/components/ExerciseGuideSheet'
import { getDogProfile, saveDogProfile } from '@/lib/dog/profile'
import { getAgeInWeeks } from '@/lib/dog/age'
import { getExerciseSpec } from '@/lib/training/exercise-specs'
import { computeStartingWeek } from '@/lib/training/assessment-week'
import type { DailyExerciseMetrics, DogProfile, LatencyBucket } from '@/types'
import styles from './page.module.css'

type ExerciseId = string

const LATENCY: { id: LatencyBucket; label: string }[] = [
  { id: 'lt1s', label: '<1s' },
  { id: '1to3s', label: '1–3s' },
  { id: 'gt3s', label: '>3s' },
]

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
  const [metrics, setMetrics] = useState<Record<ExerciseId, DailyExerciseMetrics>>({})
  const [saving, setSaving] = useState(false)
  const [guideExerciseId, setGuideExerciseId] = useState<string | null>(null)

  useEffect(() => {
    const p = getDogProfile()
    if (p) setProfile(p)
  }, [])

  const ageWeeks = profile ? Math.max(1, getAgeInWeeks(profile.birthdate)) : 0
  const trainingWeek = profile?.trainingWeek ?? 1

  const exerciseIds = useMemo(() => {
    const goalExercises: Record<string, string[]> = {
      everyday_obedience: ['namn', 'inkallning', 'koppel', 'stanna', 'hantering'],
      sport: ['namn', 'stanna', 'sitt', 'ligg', 'inkallning'],
      hunting: ['inkallning', 'stoppsignal', 'stadga', 'orientering', 'kontrollerat_sok'],
      problem_solving: ['koppel', 'inkallning', 'stadga', 'impulskontroll', 'orientering'],
    }
    const goals = profile?.onboarding?.goals ?? ['everyday_obedience']
    const merged = [...new Set(goals.flatMap((g) => goalExercises[g] ?? goalExercises.everyday_obedience))]
    return merged.slice(0, 7) // max 7 övningar i assessment
  }, [profile?.onboarding?.goals])

  const ready = profile != null
  const complete = exerciseIds.every((id) => {
    const m = metrics[id]
    const attempts = (m?.success_count ?? 0) + (m?.fail_count ?? 0)
    return attempts >= 5
  })

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
      body: JSON.stringify({ breed: profile.breed, date: today, dogKey: profile.dogKey ?? 'default', exerciseId, patch }),
    })
  }

  async function finish() {
    if (!profile || !complete) return
    setSaving(true)
    try {
      const startingWeek = computeStartingWeek(ageWeeks, metrics)
      const updated: DogProfile = {
        ...profile,
        trainingWeek: startingWeek,
        assessment: { status: 'completed', completed_at: new Date().toISOString() },
      }
      saveDogProfile(updated)
      router.replace('/dashboard')
    } finally {
      setSaving(false)
    }
  }

  if (!ready) return null

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <h1 className={styles.title}>Snabb screening (10–12 min)</h1>
        <p className={styles.sub}>
          Kör 5 försök per övning. Logga lyckad/miss + latens och välj kriterienivå.
        </p>
        <p className={styles.meta}>
          Ålder: {ageWeeks} veckor · Programvecka: {trainingWeek}
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

      <div className={styles.footer}>
        <button
          type="button"
          className={styles.primary}
          onClick={finish}
          disabled={!complete || saving}
        >
          {saving ? 'Sparar…' : 'Spara baseline →'}
        </button>
        <button
          type="button"
          className={styles.secondary}
          onClick={() => router.replace('/dashboard')}
          disabled={saving}
        >
          Hoppa över
        </button>
      </div>

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
          className={styles.cardTitle}
          onClick={onOpenGuide}
          style={{ background: 'transparent', border: 'none', padding: 0, textAlign: 'left', cursor: 'pointer' }}
          aria-label={`Öppna guide: ${prettyLabel(exerciseId)}`}
        >
          {prettyLabel(exerciseId)}
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
  }
  return map[id] ?? id
}

