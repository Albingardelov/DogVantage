'use client'

import styles from './ExerciseRow.module.css'
import type { DailyExerciseMetrics, Exercise, LatencyBucket } from '@/types'
import type { ExerciseSpec } from '@/lib/training/exercise-specs'

const EXERCISE_ICONS: Record<string, string> = {
  inkallning: '📣',
  namn: '🏷️',
  namntraning: '🏷️',
  sitt: '🐾',
  ligg: '😴',
  stanna: '✋',
  koppel: '🔗',
  hantering: '🧤',
  apportering: '🎾',
  vatten: '💧',
  socialisering: '👥',
  stoppsignal: '🛑',
  fokus: '👁️',
  stadga: '🧘',
  orientering: '🧭',
  kontrollerat_sok: '👃',
  impulskontroll: '⏳',
}

function getIcon(id: string): string {
  return EXERCISE_ICONS[id] ?? '🐾'
}

interface Props {
  exercise: Exercise
  done: number        // reps completed so far
  onRepClick: () => void
  onOpenGuide?: () => void
  spec: ExerciseSpec | null
  metrics: DailyExerciseMetrics | null
  recommendation: string | null
  showTroubleshooting: boolean
  onMetricsPatch: (patch: Partial<DailyExerciseMetrics>) => void
  ageWeeks?: number
}

const LATENCY_OPTIONS: { id: LatencyBucket; label: string }[] = [
  { id: 'lt1s', label: '<1s' },
  { id: '1to3s', label: '1–3s' },
  { id: 'gt3s', label: '>3s' },
]

export default function ExerciseRow({
  exercise,
  done,
  onRepClick,
  onOpenGuide,
  spec,
  metrics,
  recommendation,
  showTroubleshooting,
  onMetricsPatch,
  ageWeeks,
}: Props) {
  const isComplete = done >= exercise.reps
  const successCount = metrics?.success_count ?? 0
  const failCount = metrics?.fail_count ?? 0
  const attempts = successCount + failCount
  const isPuppy = typeof ageWeeks === 'number' && ageWeeks > 0 && ageWeeks < 16
  const allowedLevels = spec
    ? (isPuppy ? spec.ladder.slice(0, Math.min(2, spec.ladder.length)) : spec.ladder)
    : null
  const criteriaLevelId = metrics?.criteria_level_id ?? (allowedLevels?.[0]?.id ?? null)
  const latencyBucket = metrics?.latency_bucket ?? null
  const successRate = attempts > 0 ? successCount / attempts : null

  return (
    <div className={`${styles.row} ${isComplete ? styles.rowDone : ''}`}>
      <div className={`${styles.iconBox} ${isComplete ? styles.iconBoxDone : ''}`}>
        <span aria-hidden="true">{getIcon(exercise.id)}</span>
      </div>

      <div className={styles.info}>
        <button
          type="button"
          className={`${styles.label} ${isComplete ? styles.labelDone : ''}`}
          onClick={onOpenGuide}
          style={{ background: 'transparent', border: 'none', padding: 0, textAlign: 'left', cursor: onOpenGuide ? 'pointer' : 'default' }}
          aria-label={`Öppna guide: ${exercise.label}`}
        >
          {exercise.label}
        </button>
        {exercise.desc && (
          <span className={styles.desc}>{exercise.desc}</span>
        )}

        {(spec || recommendation) && (
          <div className={styles.metaPanel}>
            {spec && (
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Kriterium</span>
                <select
                  className={styles.select}
                  value={criteriaLevelId ?? ''}
                  onChange={(e) => onMetricsPatch({ criteria_level_id: e.target.value || null })}
                  aria-label="Välj kriterienivå"
                >
                  {(allowedLevels ?? spec.ladder).map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className={styles.metaRow}>
              <span className={styles.metaLabel}>Utfall</span>
              <div className={styles.pillGroup} role="group" aria-label="Registrera utfall">
                <button
                  type="button"
                  className={styles.pillBtn}
                  disabled={isComplete}
                  onClick={() => { onMetricsPatch({ success_count: successCount + 1 }); onRepClick() }}
                >
                  Lyckad
                </button>
                <button
                  type="button"
                  className={styles.pillBtn}
                  disabled={isComplete}
                  onClick={() => { onMetricsPatch({ fail_count: failCount + 1 }); onRepClick() }}
                >
                  Miss
                </button>
              </div>

              <span className={styles.metaLabel}>
                {attempts > 0 ? `${Math.round((successRate ?? 0) * 100)}%` : '—'}
              </span>
            </div>

            <div className={styles.metaRow}>
              <span className={styles.metaLabel}>Latens</span>
              <div className={styles.pillGroup} role="group" aria-label="Välj latens">
                {LATENCY_OPTIONS.map((o) => {
                  const selected = latencyBucket === o.id
                  return (
                    <button
                      key={o.id}
                      type="button"
                      className={`${styles.pillBtn} ${selected ? styles.pillBtnSelected : ''}`}
                      onClick={() => onMetricsPatch({ latency_bucket: o.id })}
                      aria-pressed={selected}
                    >
                      {o.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {recommendation && (
              <div className={`${styles.recommendation} ${showTroubleshooting ? styles.recommendationAlert : ''}`} role={showTroubleshooting ? 'alert' : undefined}>
                {showTroubleshooting ? (
                  <>
                    <span className={styles.recommendationIcon} aria-hidden="true">⚠️</span>
                    <span>{recommendation}</span>
                  </>
                ) : (
                  <><span className={styles.recommendationStrong}>Nästa steg:</span> {recommendation}</>
                )}
              </div>
            )}

            {spec && showTroubleshooting && (
              <ul className={styles.troubleshoot} aria-label="Felsökning">
                {spec.troubleshooting.slice(0, 3).map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            )}
          </div>
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
