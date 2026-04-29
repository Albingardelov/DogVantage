'use client'

import { useState } from 'react'
import type { Breed, QuickRating } from '@/types'
import styles from './SessionLogForm.module.css'

interface Props {
  breed: Breed
  weekNumber: number
  onSaved: () => void
  onCancel?: () => void
}

const RATINGS: { value: QuickRating; label: string; emoji: string }[] = [
  { value: 'good', label: 'Bra', emoji: '😄' },
  { value: 'mixed', label: 'Blandat', emoji: '😐' },
  { value: 'bad', label: 'Svårt', emoji: '😞' },
]

export default function SessionLogForm({ breed, weekNumber, onSaved, onCancel }: Props) {
  const [rating, setRating] = useState<QuickRating | null>(null)
  const [focus, setFocus] = useState(3)
  const [obedience, setObedience] = useState(3)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!rating) return
    setSaving(true)
    try {
      await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          breed,
          week_number: weekNumber,
          quick_rating: rating,
          focus,
          obedience,
          notes: notes.trim() || undefined,
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
        <div className={styles.savedEmoji} aria-hidden="true">✅</div>
        <p className={styles.savedText}>Pass sparat!</p>
      </div>
    )
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h3 className={styles.heading}>Logga träningspass</h3>

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
                <span className={styles.emoji} aria-hidden="true">{r.emoji}</span>
                <span className={styles.ratingLabel}>{r.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <SliderField label="Fokus" value={focus} onChange={setFocus} />
      <SliderField label="Lydnad" value={obedience} onChange={setObedience} />

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
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div className={styles.sliderField}>
      <div className={styles.sliderHeader}>
        <span className={styles.sliderLabel}>{label}</span>
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
