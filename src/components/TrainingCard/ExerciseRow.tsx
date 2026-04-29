'use client'

import styles from './ExerciseRow.module.css'
import type { Exercise } from '@/types'

const EXERCISE_ICONS: Record<string, string> = {
  inkallning: '📣',
  namn: '🏷️',
  namntraning: '🏷️',
  sitt: '🐾',
  ligg: '😴',
  stanna: '✋',
  koppel: '🔗',
  apportering: '🎾',
  vatten: '💧',
  socialisering: '👥',
  stoppsignal: '🛑',
  fokus: '👁️',
}

function getIcon(id: string): string {
  return EXERCISE_ICONS[id] ?? '🐾'
}

interface Props {
  exercise: Exercise
  done: number        // reps completed so far
  onRepClick: () => void
}

export default function ExerciseRow({ exercise, done, onRepClick }: Props) {
  const isComplete = done >= exercise.reps

  return (
    <div className={`${styles.row} ${isComplete ? styles.rowDone : ''}`}>
      <div className={`${styles.iconBox} ${isComplete ? styles.iconBoxDone : ''}`}>
        <span aria-hidden="true">{getIcon(exercise.id)}</span>
      </div>

      <div className={styles.info}>
        <span className={`${styles.label} ${isComplete ? styles.labelDone : ''}`}>
          {exercise.label}
        </span>
        {exercise.desc && (
          <span className={styles.desc}>{exercise.desc}</span>
        )}
      </div>

      <div className={styles.counter} aria-label={`${done} av ${exercise.reps} gjorda`}>
        {isComplete ? (
          <div className={styles.checkCircle} aria-hidden="true">✓</div>
        ) : (
          <div className={styles.dots}>
            {Array.from({ length: exercise.reps }, (_, i) => {
              const filled = i < done
              const isNext = i === done
              return (
                <button
                  key={i}
                  type="button"
                  className={`${styles.dot} ${filled ? styles.dotFilled : ''} ${isNext ? styles.dotNext : ''}`}
                  onClick={onRepClick}
                  aria-label={`Markera rep ${i + 1}`}
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
