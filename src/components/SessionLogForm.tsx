'use client'

import { useState } from 'react'
import type { Breed, QuickRating } from '@/types'
import styles from './SessionLogForm.module.css'

interface Props {
  breed: Breed
  weekNumber: number
  onSaved: () => void
}

const RATINGS: { value: QuickRating; label: string; emoji: string }[] = [
  { value: 'good', label: 'Bra', emoji: '😄' },
  { value: 'mixed', label: 'Blandat', emoji: '😐' },
  { value: 'bad', label: 'Dåligt', emoji: '😞' },
]

export default function SessionLogForm({ breed, weekNumber, onSaved }: Props) {
  const [rating, setRating] = useState<QuickRating | null>(null)
  const [focus, setFocus] = useState(3)
  const [obedience, setObedience] = useState(3)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!rating) return
    setSaving(true)
    try {
      await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ breed, week_number: weekNumber, quick_rating: rating, focus, obedience, notes: notes.trim() || undefined }),
      })
      onSaved()
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h3 className={styles.heading}>Logga träningspasset</h3>

      <div className={styles.ratingRow}>
        {RATINGS.map((r) => (
          <button
            key={r.value}
            type="button"
            className={`${styles.ratingBtn} ${rating === r.value ? styles.selected : ''}`}
            onClick={() => setRating(r.value)}
            aria-pressed={rating === r.value}
          >
            <span className={styles.emoji}>{r.emoji}</span>
            <span>{r.label}</span>
          </button>
        ))}
      </div>

      <div className={styles.sliders}>
        <SliderField label="Fokus" value={focus} onChange={setFocus} />
        <SliderField label="Lydnad" value={obedience} onChange={setObedience} />
      </div>

      <textarea
        className={styles.notes}
        placeholder="Anteckningar (valfritt)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
      />

      <button
        type="submit"
        className={styles.submit}
        disabled={!rating || saving}
      >
        {saving ? 'Sparar…' : 'Spara pass'}
      </button>
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
      <label className={styles.sliderLabel}>
        {label} <span className={styles.sliderValue}>{value}/5</span>
      </label>
      <input
        type="range"
        min={1}
        max={5}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={styles.slider}
      />
    </div>
  )
}
