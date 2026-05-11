import { TRAINING_CURRICULUM, getPhaseForWeek } from '@/lib/ai/breed-profiles'
import styles from './ProgramWeekTimeline.module.css'

interface Props {
  ageWeeks: number
}

/**
 * Mini-timeline that explains what "Programvecka X" means in plain language:
 * which curriculum phase the dog is in, how many weeks remain until the next
 * milestone phase, and what comes next. Hides itself for adult dogs (>52 v)
 * where the phase concept stops being useful.
 */
export default function ProgramWeekTimeline({ ageWeeks }: Props) {
  if (!Number.isFinite(ageWeeks) || ageWeeks <= 0 || ageWeeks > 60) return null

  const currentPhase = getPhaseForWeek(ageWeeks)
  const currentIdx = TRAINING_CURRICULUM.indexOf(currentPhase)
  const nextPhase = TRAINING_CURRICULUM[currentIdx + 1] ?? null

  // Position within current phase (0-1) — clamp so we don't go past 100%.
  const phaseStart = currentPhase.weeks.from
  const phaseEnd = currentPhase.weeks.to === 9999 ? phaseStart + 52 : currentPhase.weeks.to
  const phaseSpan = Math.max(1, phaseEnd - phaseStart)
  const progress = Math.min(1, Math.max(0, (ageWeeks - phaseStart) / phaseSpan))
  const weeksToNext = nextPhase ? Math.max(0, nextPhase.weeks.from - ageWeeks) : null

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.label}>Du är här</span>
        <span className={styles.phaseName}>{currentPhase.label}</span>
      </div>
      <div className={styles.bar} aria-hidden="true">
        <div className={styles.barFill} style={{ width: `${Math.round(progress * 100)}%` }} />
      </div>
      <div className={styles.footer}>
        <span className={styles.weeks}>v. {phaseStart}–{currentPhase.weeks.to === 9999 ? '∞' : phaseEnd}</span>
        {nextPhase && weeksToNext !== null && (
          <span className={styles.next}>
            {weeksToNext === 0
              ? `Nästa fas startar nu: ${nextPhase.label}`
              : `Nästa fas om ${weeksToNext} v: ${nextPhase.label}`}
          </span>
        )}
      </div>
    </div>
  )
}
