'use client'

import { IconCaretLeft, IconRestDay } from '@/components/icons'
import styles from './WeekView.module.css'
import type { WeekPlan } from '@/types'

const SWEDISH_DAYS = ['Söndag', 'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag']

interface Props {
  plan: WeekPlan
  onClose: () => void
  getReasonBadges?: (exerciseId: string) => Array<{
    label: string
    tone: 'priority' | 'focus' | 'weak'
    detail?: string
  }>
}

export default function WeekView({ plan, onClose, getReasonBadges }: Props) {
  const todayName = SWEDISH_DAYS[new Date().getDay()]

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Veckans schema">
      <div className={styles.sheet}>
        <div className={styles.header}>
          <button type="button" className={styles.backBtn} onClick={onClose} aria-label="Stäng">
            <IconCaretLeft size="md" />
          </button>
          <span className={styles.title}>Veckans schema</span>
        </div>

        <div className={styles.days}>
          {plan.days.map((day) => {
            const isToday = day.day === todayName
            return (
              <div
                key={day.day}
                className={`${styles.dayCard} ${isToday ? styles.dayCardToday : ''}`}
              >
                <div className={styles.dayHeader}>
                  <span className={`${styles.dayName} ${isToday ? styles.dayNameToday : ''}`}>
                    {day.day}
                    {isToday && <span className={styles.todayBadge}> · idag</span>}
                  </span>
                  {day.rest && <span className={styles.restBadge}>Vilodag</span>}
                </div>

                {day.rest ? (
                  <p className={styles.restText}>
                    <IconRestDay size="md" className={styles.restIcon} />
                    Vila och återhämtning
                  </p>
                ) : (
                  <ul className={styles.exerciseList}>
                    {(day.exercises ?? []).map((ex) => (
                      <li key={ex.id} className={styles.exerciseItem}>
                        <span className={styles.exerciseName}>{ex.label}</span>
                        <span className={styles.exerciseMeta}>{ex.reps}× · {ex.desc}</span>
                        {ex.sources && ex.sources.length > 0 && (
                          <div className={styles.sourceRow}>
                            <span className={styles.sourceLabel}>Läs mer:</span>
                            {ex.sources.map((source, i) =>
                              source.source_url ? (
                                <a
                                  key={`${ex.id}-src-${i}`}
                                  href={source.source_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={styles.sourceLink}
                                >
                                  {source.source}
                                </a>
                              ) : (
                                <span key={`${ex.id}-src-${i}`} className={styles.sourceText}>
                                  {source.source}
                                </span>
                              ),
                            )}
                          </div>
                        )}
                        {getReasonBadges && (
                          <div className={styles.reasonRow}>
                            {getReasonBadges(ex.id).map((badge) => (
                              <span
                                key={`${day.day}-${ex.id}-${badge.label}`}
                                className={`${styles.reasonBadge} ${
                                  badge.tone === 'priority'
                                    ? styles.reasonPriority
                                    : badge.tone === 'focus'
                                      ? styles.reasonFocus
                                      : styles.reasonWeak
                                }`}
                                title={badge.detail}
                              >
                                {badge.label}
                              </span>
                            ))}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
