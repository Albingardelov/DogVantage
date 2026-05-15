'use client'

import { useState } from 'react'
import { IconCheckCircle, RatingIcon } from '@/components/icons'
import type { Breed, QuickRating, ExerciseSummary } from '@/types'
import styles from './SessionLogForm.module.css'

interface Props {
  dogId: string
  breed: Breed
  weekNumber: number
  exercises?: ExerciseSummary[]
  onSaved: () => void
  onCancel?: () => void
}

const RATINGS: { value: QuickRating; label: string }[] = [
  { value: 'good', label: 'Bra' },
  { value: 'mixed', label: 'Blandat' },
  { value: 'bad', label: 'Svårt' },
]

type NextSessionIntent = 'same' | 'easier' | 'harder'

const NEXT_SESSION_OPTIONS: { value: NextSessionIntent; label: string }[] = [
  { value: 'same', label: 'Behåll nivå' },
  { value: 'easier', label: 'Lättare' },
  { value: 'harder', label: 'Kan höja' },
]

export default function SessionLogForm({ dogId, breed, weekNumber, exercises, onSaved, onCancel }: Props) {
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
      await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dog_id: dogId,
          breed,
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
      setSaved(true)
      setTimeout(() => onSaved(), 1000)
    } finally {
      setSaving(false)
    }
  }

  if (saved) {
    return (
      <div className={styles.savedCard} role="status">
        <IconCheckCircle size="hero" className={styles.savedIcon} />
        <p className={styles.savedText}>Pass sparat!</p>
      </div>
    )
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h3 className={styles.heading}>Logga träningspass</h3>

      {exercises && exercises.length > 0 && (
        <div className={styles.section}>
          <span className={styles.sectionLabel}>Tränade övningar</span>
          <ul className={styles.exerciseList}>
            {exercises.map((ex) => {
              const attempts = ex.success_count + ex.fail_count
              const rate = attempts > 0 ? Math.round((ex.success_count / attempts) * 100) : null
              return (
                <li key={ex.id} className={styles.exerciseItem}>
                  <span className={styles.exerciseName}>{ex.label}</span>
                  {attempts > 0 && (
                    <span className={styles.exerciseStats}>
                      {ex.success_count}/{attempts} lyckade{rate !== null ? ` (${rate}%)` : ''}
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      )}

      <div className={styles.section}>
        <span className={styles.sectionLabel}>Hur gick det?</span>
        <div className={styles.ratingRow} role="radiogroup" aria-label="Hur gick passet?">
          {RATINGS.map((r) => {
            const selected = rating === r.value
            return (
              <button
                key={r.value}
                type="button"
                role="radio"
                aria-checked={selected}
                className={`${styles.ratingBtn} ${selected ? styles.ratingBtnSelected : ''}`}
                onClick={() => setRating(r.value)}
              >
                <RatingIcon rating={r.value} size="xl" className={styles.ratingIcon} />
                <span className={styles.ratingLabel}>{r.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className={styles.section}>
        <span className={styles.sectionLabel}>Hundens prestation</span>
        <SliderField label="Fokus" value={focus} onChange={setFocus} />
        <SliderField label="Lydnad" value={obedience} onChange={setObedience} />
      </div>

      <div className={styles.section}>
        <span className={styles.sectionLabel}>Din insats som förare</span>
        <SliderField
          label="Timing"
          hint="Belönade du i rätt ögonblick?"
          value={handlerTiming}
          onChange={setHandlerTiming}
        />
        <SliderField
          label="Konsekvens"
          hint="Höll du samma krav under hela passet?"
          value={handlerConsistency}
          onChange={setHandlerConsistency}
        />
        <SliderField
          label="Läsa hunden"
          hint="Märkte du när hunden var på väg att misslyckas?"
          value={handlerReading}
          onChange={setHandlerReading}
        />
      </div>

      <div className={styles.section}>
        <span className={styles.sectionLabel}>Efter passet — nästa gång (valfritt)</span>
        <div className={styles.nextRow} role="radiogroup" aria-label="Plan för nästa pass">
          {NEXT_SESSION_OPTIONS.map((opt) => {
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

      <textarea
        className={styles.notes}
        placeholder="Anteckningar (valfritt)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
      />

      <div className={styles.actions}>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className={styles.cancelBtn}
            disabled={saving}
          >
            Avbryt
          </button>
        )}
        <button
          type="submit"
          className={styles.submitBtn}
          disabled={!rating || saving}
        >
          {saving ? 'Sparar…' : 'Spara pass'}
        </button>
      </div>
    </form>
  )
}

function SliderField({
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
    <div className={styles.sliderField}>
      <div className={styles.sliderHeader}>
        <div className={styles.sliderLabelGroup}>
          <span className={styles.sliderLabel}>{label}</span>
          {hint && <span className={styles.sliderHint}>{hint}</span>}
        </div>
        <span className={styles.sliderValue}>{value}/5</span>
      </div>
      <input
        type="range"
        min={1}
        max={5}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={styles.slider}
        aria-label={label}
      />
    </div>
  )
}
