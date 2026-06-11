'use client'

import { useState } from 'react'
import styles from './DayCheckInCard.module.css'
import type { DayCheckInState, HandlerEnergy } from '@/lib/training/day-scaler'
import type { PuppyZone } from '@/lib/training/puppy-zone'

interface Props {
  dogName: string
  onSave: (value: DayCheckInState) => void
  onDismiss: () => void
}

const ZONE_OPTIONS: Array<{ id: PuppyZone; label: string }> = [
  { id: 'green', label: 'Pigg & fokuserad' },
  { id: 'yellow', label: 'Lite trött/stressad' },
  { id: 'red', label: 'Behöver vila' },
]

const ENERGY_OPTIONS: Array<{ id: HandlerEnergy; label: string }> = [
  { id: 'low', label: 'Låg' },
  { id: 'ok', label: 'Ok' },
  { id: 'high', label: 'Hög' },
]

const TIME_OPTIONS: Array<{ minutes: number; label: string }> = [
  { minutes: 5, label: '5 min' },
  { minutes: 15, label: '15 min' },
  { minutes: 30, label: '30+ min' },
]

export default function DayCheckInCard({ dogName, onSave, onDismiss }: Props) {
  const [zone, setZone] = useState<PuppyZone | null>(null)
  const [energy, setEnergy] = useState<HandlerEnergy | null>(null)
  const [minutes, setMinutes] = useState<number | null>(null)

  return (
    <div className={styles.card}>
      <p className={styles.question}>Hur är {dogName}s form idag?</p>
      <div className={styles.row}>
        {ZONE_OPTIONS.map((o) => (
          <button
            key={o.id}
            type="button"
            className={`${styles.chip} ${zone === o.id ? styles.chipActive : ''}`}
            onClick={() => setZone(o.id)}
            aria-pressed={zone === o.id}
          >
            {o.label}
          </button>
        ))}
      </div>

      <p className={styles.question}>Din egen energi?</p>
      <div className={styles.row}>
        {ENERGY_OPTIONS.map((o) => (
          <button
            key={o.id}
            type="button"
            className={`${styles.chip} ${energy === o.id ? styles.chipActive : ''}`}
            onClick={() => setEnergy(o.id)}
            aria-pressed={energy === o.id}
          >
            {o.label}
          </button>
        ))}
      </div>

      <p className={styles.question}>Hur mycket tid har ni?</p>
      <div className={styles.row}>
        {TIME_OPTIONS.map((o) => (
          <button
            key={o.minutes}
            type="button"
            className={`${styles.chip} ${minutes === o.minutes ? styles.chipActive : ''}`}
            onClick={() => setMinutes(o.minutes)}
            aria-pressed={minutes === o.minutes}
          >
            {o.label}
          </button>
        ))}
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.saveBtn}
          disabled={!zone}
          onClick={() => zone && onSave({ zone, handlerEnergy: energy, minutesAvailable: minutes })}
        >
          Starta dagen
        </button>
        <button type="button" className={styles.skipBtn} onClick={onDismiss}>
          Hoppa över
        </button>
      </div>
    </div>
  )
}
