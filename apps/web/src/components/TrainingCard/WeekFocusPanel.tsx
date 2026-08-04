'use client'

import type { WeekFocusCopy } from '@/lib/training/week-focus-copy'
import styles from './TrainingCard.module.css'

interface Props {
  copy: WeekFocusCopy
  simpleFocus: boolean
  onToggleSimple: () => void
  totalExercises: number
  canSimple: boolean
}

export default function WeekFocusPanel({ copy, simpleFocus, onToggleSimple, totalExercises, canSimple }: Props) {
  return (
    <div className={styles.weekFocus}>
      <p className={styles.weekFocusLead}>{copy.whyLine}</p>
      <details className={styles.weekFocusDetails}>
        <summary className={styles.weekFocusSummary}>Delmål, metod & mätning</summary>
        <ul className={styles.weekFocusList}>
          {copy.subGoalBullets.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
        <p className={styles.weekFocusMethod}>{copy.methodVsDocumentsNote}</p>
        <p className={styles.weekFocusQuality}>{copy.qualityMeasurementHint}</p>
      </details>
      {canSimple && (
        <div className={styles.simpleRow}>
          <button type="button" className={styles.simpleToggle} onClick={onToggleSimple}>
            {simpleFocus
              ? `Visa alla ${totalExercises} övningar idag`
              : 'Enkel vy — bara nästa övning'}
          </button>
          {simpleFocus && totalExercises > 2 && (
            <span className={styles.simpleHint}>
              Du ser första ofullständiga övningen i ordning. Växla vy för hela dagens lista.
            </span>
          )}
        </div>
      )}
    </div>
  )
}
