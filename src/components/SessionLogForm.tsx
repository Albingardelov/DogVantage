'use client'

import { useState } from 'react'
import { IconCheckCircle, IconConfetti, IconMedal, RatingIcon } from '@/components/icons'
import { CoachTipSchema } from '@/types/api/schemas'
import type { z } from 'zod'
import type { ExerciseSummary, QuickRating } from '@/types'
import styles from './SessionLogForm.module.css'

type CoachTip = z.infer<typeof CoachTipSchema>

interface Props {
  dogId: string
  weekNumber: number
  exercises?: ExerciseSummary[]
  onSaved: () => void
  onCancel?: () => void
}

const RATINGS: { value: QuickRating; label: string; selectedClass: string }[] = [
  { value: 'good',  label: 'Bra',     selectedClass: styles.ratingBtnGood },
  { value: 'mixed', label: 'Blandat', selectedClass: styles.ratingBtnMixed },
  { value: 'bad',   label: 'Svårt',   selectedClass: styles.ratingBtnBad },
]

type NextSessionIntent = 'same' | 'easier' | 'harder'
const NEXT_OPTIONS: { value: NextSessionIntent; label: string }[] = [
  { value: 'same',   label: 'Behåll nivå' },
  { value: 'easier', label: 'Lättare' },
  { value: 'harder', label: 'Kan höja' },
]

const BURST_PALETTE = ['#52b788', '#f4a261', '#fbbf24', '#ffffff']

function SavedBurst() {
  const bits = Array.from({ length: 14 }, (_, i) => {
    const ang = (i / 14) * Math.PI * 2
    const dist = 46 + (i % 3) * 16
    return {
      x: Math.cos(ang) * dist,
      y: Math.sin(ang) * dist,
      c: BURST_PALETTE[i % BURST_PALETTE.length],
      d: (i % 5) * 30,
    }
  })
  return (
    <div className={styles.savedBurst}>
      {bits.map((b, i) => (
        <span
          key={i}
          className={styles.savedBurstBit}
          style={{
            background: b.c,
            animationDelay: `${b.d}ms`,
            ['--bx' as string]: `${b.x}px`,
            ['--by' as string]: `${b.y}px`,
          }}
        />
      ))}
    </div>
  )
}

function Stepper({
  label,
  hint,
  value,
  onChange,
}: {
  label: string
  hint?: string
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div className={styles.stepper}>
      <div className={styles.stepperHead}>
        <div>
          <span className={styles.stepperLabel}>{label}</span>
          {hint && <span className={styles.stepperHint}>{hint}</span>}
        </div>
        <span className={styles.stepperValue}>{value}/5</span>
      </div>
      <div className={styles.stepperSegments}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            className={`${styles.stepperSeg} ${n <= value ? styles.stepperSegFilled : ''}`}
            onClick={() => onChange(n)}
            aria-label={`${label} ${n} av 5`}
          />
        ))}
      </div>
    </div>
  )
}

function computeHeroStats(exercises?: ExerciseSummary[]) {
  if (!exercises || exercises.length === 0) return { rate: null, count: 0, reps: 0 }
  const totalSuccess = exercises.reduce((s, e) => s + e.success_count, 0)
  const totalAttempts = exercises.reduce((s, e) => s + e.success_count + e.fail_count, 0)
  const rate = totalAttempts > 0 ? Math.round((totalSuccess / totalAttempts) * 100) : null
  return { rate, count: exercises.length, reps: totalAttempts }
}

export default function SessionLogForm({ dogId, weekNumber, exercises, onSaved, onCancel }: Props) {
  const [rating, setRating] = useState<QuickRating | null>(null)
  const [focus, setFocus] = useState(3)
  const [obedience, setObedience] = useState(3)
  const [handlerTiming, setHandlerTiming] = useState(3)
  const [handlerConsistency, setHandlerConsistency] = useState(3)
  const [handlerReading, setHandlerReading] = useState(3)
  const [notes, setNotes] = useState('')
  const [nextSession, setNextSession] = useState<NextSessionIntent | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [coachTip, setCoachTip] = useState<CoachTip | null>(null)

  const { rate, count, reps } = computeHeroStats(exercises)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!rating) return
    setSaving(true)
    try {
      let combinedNotes = notes.trim()
      if (nextSession) {
        const tag =
          nextSession === 'same'
            ? '[Nästa pass: behåll nivå]'
            : nextSession === 'easier'
              ? '[Nästa pass: lättare]'
              : '[Nästa pass: kan höja]'
        combinedNotes = combinedNotes ? `${combinedNotes}\n${tag}` : tag
      }
      const res = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dog_id: dogId,
          week_number: weekNumber,
          quick_rating: rating,
          focus,
          obedience,
          handler_timing: handlerTiming,
          handler_consistency: handlerConsistency,
          handler_reading: handlerReading,
          notes: combinedNotes || undefined,
          exercises: exercises && exercises.length > 0 ? exercises : undefined,
        }),
      })

      let tip: CoachTip | null = null
      try {
        const body = await res.json()
        const parsed = CoachTipSchema.safeParse(body?.coachTip)
        if (parsed.success) tip = parsed.data
      } catch { /* tip is a bonus */ }

      setCoachTip(tip)
      setSaved(true)
      // With a coach tip the user closes manually; otherwise auto-close.
      if (!tip) setTimeout(() => onSaved(), 1200)
    } finally {
      setSaving(false)
    }
  }

  if (saved) {
    return (
      <div className={styles.savedScreen} role="status">
        <SavedBurst />
        <div className={styles.savedMedalWrap}>
          <IconMedal size="hero" />
        </div>
        <p className={styles.savedTitle}>Pass sparat!</p>
        {coachTip && (
          <div className={styles.coachTip}>
            <span className={styles.coachTipKicker}>Coachtips · {coachTip.exerciseLabel}</span>
            <p className={styles.coachTipText}>{coachTip.advice}</p>
            {coachTip.sources[0] && (
              <p className={styles.coachTipSource}>
                Källa:{' '}
                {coachTip.sources[0].source_url ? (
                  <a
                    href={coachTip.sources[0].source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {coachTip.sources[0].source}
                  </a>
                ) : (
                  coachTip.sources[0].source
                )}
              </p>
            )}
            <button type="button" className={styles.coachTipClose} onClick={onSaved}>
              Fortsätt
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {/* Hero summary */}
      <div className={styles.hero}>
        <div className={styles.heroHead}>
          <IconConfetti size="sm" />
          Pass klart — bra jobbat!
        </div>
        <div className={styles.heroStats}>
          {[
            [rate !== null ? `${rate}%` : '—', 'lyckade'],
            [String(count), 'övningar'],
            [String(reps), 'reps'],
          ].map(([v, l]) => (
            <div key={l} className={styles.heroStat}>
              <div className={styles.heroStatValue}>{v}</div>
              <div className={styles.heroStatLabel}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Rating */}
      <div className={styles.section}>
        <span className={styles.sectionLabel}>Hur kändes passet?</span>
        <div className={styles.ratingRow} role="radiogroup" aria-label="Hur gick passet?">
          {RATINGS.map((r) => {
            const selected = rating === r.value
            return (
              <button
                key={r.value}
                type="button"
                role="radio"
                aria-checked={selected}
                className={`${styles.ratingBtn} ${selected ? r.selectedClass : ''}`}
                onClick={() => setRating(r.value)}
              >
                <RatingIcon rating={r.value} size="xl" />
                <span>{r.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Dog performance */}
      <div className={styles.section}>
        <span className={styles.sectionLabel}>Hundens prestation</span>
        <Stepper label="Fokus" value={focus} onChange={setFocus} />
        <Stepper label="Lydnad" value={obedience} onChange={setObedience} />
      </div>

      {/* Handler performance */}
      <div className={styles.section}>
        <span className={styles.sectionLabel}>Din insats som förare</span>
        <Stepper label="Timing" hint="Belönade du i rätt ögonblick?" value={handlerTiming} onChange={setHandlerTiming} />
        <Stepper label="Konsekvens" hint="Höll du samma krav hela passet?" value={handlerConsistency} onChange={setHandlerConsistency} />
        <Stepper label="Läsa hunden" hint="Märkte du när det började bli svårt?" value={handlerReading} onChange={setHandlerReading} />
      </div>

      {/* Next session */}
      <div className={styles.section}>
        <span className={styles.sectionLabel}>Nästa pass (valfritt)</span>
        <div className={styles.nextRow} role="radiogroup" aria-label="Plan för nästa pass">
          {NEXT_OPTIONS.map((opt) => {
            const selected = nextSession === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={selected}
                className={`${styles.nextBtn} ${selected ? styles.nextBtnSelected : ''}`}
                onClick={() => setNextSession((prev) => (prev === opt.value ? null : opt.value))}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Notes */}
      <textarea
        className={styles.notes}
        placeholder="Anteckningar (valfritt)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
      />

      {/* Actions */}
      {onCancel && (
        <button type="button" onClick={onCancel} className={styles.cancelBtn} disabled={saving}>
          Avbryt
        </button>
      )}
      <button type="submit" className={styles.submitBtn} disabled={saving || !rating}>
        <IconCheckCircle size="md" /> Spara pass
      </button>
    </form>
  )
}
