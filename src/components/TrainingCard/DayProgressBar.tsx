import styles from './DayProgressBar.module.css'

interface Props {
  repsDone: number
  repsPlanned: number
  isRestDay: boolean
}

function clampPct(value: number): number {
  if (value < 0) return 0
  if (value > 100) return 100
  return value
}

export default function DayProgressBar({ repsDone, repsPlanned, isRestDay }: Props) {
  if (isRestDay) {
    return (
      <div className={styles.rest}>
        Vilodag idag
      </div>
    )
  }

  const safeDone = Math.max(0, repsDone)
  const safePlanned = Math.max(0, repsPlanned)
  const pct = safePlanned > 0 ? clampPct((safeDone / safePlanned) * 100) : 0

  return (
    <section className={styles.section} aria-label="Dagens progress">
      <div className={styles.row}>
        <span className={styles.label}>Dagens progress</span>
        <span className={styles.value}>{safeDone}/{safePlanned} reps</span>
      </div>
      <div className={styles.track} role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
        <div className={styles.fill} style={{ width: `${pct}%` }} />
      </div>
    </section>
  )
}
