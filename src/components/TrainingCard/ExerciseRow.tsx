'use client'

import { useState } from 'react'
import {
  ExerciseIcon,
  IconArrowsClockwise,
  IconCaretRight,
  IconCheck,
  IconFire,
  IconLightning,
  IconMedal,
  IconSwap,
  IconTarget,
  IconWarning,
  IconX,
} from '@/components/icons'
import styles from './ExerciseRow.module.css'
import type { DailyExerciseMetrics, Exercise, LatencyBucket, TrainingSourceRef } from '@/types'
import type { ExerciseSpec } from '@/lib/training/exercise-specs'
import { isPuppy as isPuppyAge } from '@/lib/dog/age'
import { buildCoachAction, latencyMeaning, type SessionGuard } from '@/lib/training/session-coach'
import type { ExerciseMaturity } from './maturity'
import { topBadge } from './badges'
import { normalizeHandlerGuide } from '@/lib/training/normalize-handler-guide'

interface Props {
  exercise: Exercise
  done: number
  onRepClick: () => void
  onOpenGuide?: () => void
  spec: ExerciseSpec | null
  metrics: DailyExerciseMetrics | null
  guard: SessionGuard
  advanceThresholdDelta?: number
  onEndExercise?: () => void
  onMetricsPatch: (patch: Partial<DailyExerciseMetrics>) => void
  ageWeeks?: number
  /** Primär "nästa övning" i dagens pass (visuell ram, ej samma som rep-prickarnas nästa) */
  sessionNext?: boolean
  /** Ankare för scroll när nästa övning byts (t.ex. `training-session-next`) */
  rootId?: string
  /** Finns det en kvarvarande övning idag? Styr "Nästa övning" vs "klar för idag". */
  hasNextExercise?: boolean
  /** Visas bara om callbacken är satt — byt ut till annan övning ur veckofokus */
  onSwap?: () => void
  reasonBadges?: Array<{
    label: string
    tone: 'priority' | 'focus' | 'weak'
    detail?: string
  }>
  /** Dokumentkällor från kunskapsbasen — visas som "Läs mer"-länkar */
  sources?: TrainingSourceRef[]
  /** 'new' = aldrig loggad → lugnt "Lär dig"-läge; 'practiced' = full kraftvy */
  maturity?: ExerciseMaturity
  /** Hela dagens pass är klart → rad-meddelandet dämpas, DayComplete tar över på sidnivå */
  dayComplete?: boolean
}

const LATENCY_OPTIONS: { id: LatencyBucket; label: string }[] = [
  { id: 'lt1s', label: '<1s' },
  { id: '1to3s', label: '1–3s' },
  { id: 'gt3s', label: '>3s' },
]

const BURST_PALETTE = ['#52b788', '#f4a261', '#fbbf24', '#ffffff']

function Burst({ show }: { show: boolean }) {
  if (!show) return null
  const bits = Array.from({ length: 14 }, (_, i) => {
    const ang = (i / 14) * Math.PI * 2
    const dist = 46 + (i % 3) * 16
    return {
      x: Math.cos(ang) * dist,
      y: Math.sin(ang) * dist,
      c: BURST_PALETTE[i % BURST_PALETTE.length],
      d: (i % 5) * 30,
    }
  })
  return (
    <div className={styles.burst}>
      {bits.map((b, i) => (
        <span
          key={i}
          className={styles.burstBit}
          style={{
            background: b.c,
            animationDelay: `${b.d}ms`,
            ['--bx' as string]: `${b.x}px`,
            ['--by' as string]: `${b.y}px`,
          }}
        />
      ))}
    </div>
  )
}

function Ring({ reps, successCount, failCount }: { reps: number; successCount: number; failCount: number }) {
  const size = 152
  const stroke = 13
  const r = (size - stroke) / 2
  const C = 2 * Math.PI * r
  const N = reps
  const seg = C / N - 6
  return (
    <svg width={size} height={size} style={{ display: 'block' }}>
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        {Array.from({ length: N }, (_, i) => {
          const col =
            i < successCount
              ? '#52b788'
              : i < successCount + failCount
                ? '#f4a261'
                : 'rgba(255,255,255,0.16)'
          return (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={col}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={`${seg} ${C - seg}`}
              strokeDashoffset={-i * (C / N)}
              style={{ transition: 'stroke 280ms ease' }}
            />
          )
        })}
      </g>
    </svg>
  )
}

export default function ExerciseRow({
  exercise,
  done,
  onRepClick,
  onOpenGuide,
  spec,
  metrics,
  guard,
  advanceThresholdDelta,
  onEndExercise,
  onMetricsPatch,
  ageWeeks,
  sessionNext: _sessionNext,
  rootId,
  hasNextExercise = true,
  onSwap,
  reasonBadges = [],
  sources = [],
  maturity = 'practiced',
  dayComplete = false,
}: Props) {
  const [combo, setCombo] = useState(0)
  const [floats, setFloats] = useState<{ id: number; kind: 'success' | 'miss' }[]>([])

  const isComplete = done >= exercise.reps
  const successCount = metrics?.success_count ?? 0
  const failCount = metrics?.fail_count ?? 0
  const attempts = successCount + failCount
  const successRate = attempts > 0 ? Math.round((successCount / attempts) * 100) : null
  const latencyBucket = metrics?.latency_bucket ?? null

  const isPuppy = isPuppyAge(ageWeeks)
  const allowedLevels = spec
    ? isPuppy
      ? spec.ladder.slice(0, Math.min(2, spec.ladder.length))
      : spec.ladder
    : null
  const criteriaLevelId = metrics?.criteria_level_id ?? (allowedLevels?.[0]?.id ?? null)
  const activeLevel = allowedLevels?.find((l) => l.id === criteriaLevelId) ?? allowedLevels?.[0] ?? null
  const currentLevelLabel = activeLevel?.label ?? null
  const currentLevelCriteria = activeLevel?.criteria ?? null

  const isNew = maturity === 'new'
  const previewGuide =
    spec?.guide != null
      ? normalizeHandlerGuide(spec.guide, {
          definition: spec.definition,
          troubleshooting: spec.troubleshooting,
        })
      : null
  const firstStepPreview =
    previewGuide?.steps?.[0]?.how ?? previewGuide?.todaySummary ?? null
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [badgeOpen, setBadgeOpen] = useState(false)
  const badge = topBadge(reasonBadges)

  const coach = buildCoachAction({
    successCount,
    failCount,
    latencyBucket,
    ageWeeks,
    guard,
    ladder: allowedLevels,
    currentLevelId: criteriaLevelId,
    advanceThresholdDelta,
  })
  const showTroubleshooting = coach?.kind === 'lower' || coach?.kind === 'stop'
  const suggestedLevel =
    coach?.suggestedLevelId && allowedLevels
      ? allowedLevels.find((l) => l.id === coach.suggestedLevelId) ?? null
      : null

  function spawnFloat(kind: 'success' | 'miss') {
    const id = Date.now() + Math.random()
    setFloats((f) => [...f, { id, kind }])
    setTimeout(() => setFloats((f) => f.filter((x) => x.id !== id)), 850)
  }

  function handleSuccess() {
    if (isComplete) return
    setCombo((c) => c + 1)
    spawnFloat('success')
    onMetricsPatch({ success_count: successCount + 1 })
    onRepClick()
  }

  function handleMiss() {
    if (isComplete) return
    setCombo(0)
    spawnFloat('miss')
    onMetricsPatch({ fail_count: failCount + 1 })
    onRepClick()
  }

  function handleUndo() {
    setCombo(0)
    setFloats([])
  }

  function cycleCriteria() {
    if (!allowedLevels || allowedLevels.length === 0) return
    const idx = allowedLevels.findIndex((l) => l.id === criteriaLevelId)
    const next = allowedLevels[(idx + 1) % allowedLevels.length]
    onMetricsPatch({ criteria_level_id: next.id })
  }

  return (
    <div id={rootId} className={styles.card}>
      <Burst show={isComplete} />

      {/* Head */}
      <div className={styles.head}>
        <div className={styles.headLeft}>
          <div className={styles.nameRow}>
            <ExerciseIcon exerciseId={exercise.id} size="md" />
            <span className={styles.exerciseName}>{exercise.label}</span>
          </div>
          {badge && (
            <div className={styles.reasonRow}>
              <span
                className={`${styles.reasonBadge} ${
                  badge.tone === 'priority'
                    ? styles.reasonPriority
                    : badge.tone === 'focus'
                      ? styles.reasonFocus
                      : styles.reasonWeak
                }`}
              >
                {badge.label}
              </span>
              {badge.detail && (
                <button
                  type="button"
                  className={styles.badgeInfo}
                  onClick={() => setBadgeOpen((v) => !v)}
                  aria-label={`Förklara: ${badge.label}`}
                >
                  ?
                </button>
              )}
            </div>
          )}
          {badgeOpen && badge?.detail && (
            <p className={styles.badgeHelp}>{badge.detail}</p>
          )}
          {spec?.definition && (
            <p className={styles.definitionText}>{spec.definition}</p>
          )}
          {allowedLevels && currentLevelLabel && (
            isNew ? (
              <span className={styles.criteriaChip}>
                <IconTarget size="sm" />
                <span>{currentLevelLabel}</span>
              </span>
            ) : (
              <button
                type="button"
                className={styles.criteriaChip}
                onClick={cycleCriteria}
                aria-label="Byt kriterienivå"
              >
                <IconTarget size="sm" />
                <span>{currentLevelLabel}</span>
                <IconArrowsClockwise size="sm" />
              </button>
            )
          )}
          {currentLevelCriteria && (
            <p className={styles.criteriaText}>
              <strong>Dagens kriterium:</strong> {currentLevelCriteria}
            </p>
          )}
          {isNew && firstStepPreview && (
            <p className={styles.firstStep}>
              <strong>Så gör du:</strong> {firstStepPreview}
            </p>
          )}
          {sources.length > 0 && (
            <p className={styles.sourcesRow}>
              Läs mer:{' '}
              {sources.map((s, i) => (
                <span key={s.source_url || s.source}>
                  {i > 0 && ' · '}
                  {s.source_url ? (
                    <a
                      href={s.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.sourceLink}
                    >
                      {s.source}
                    </a>
                  ) : (
                    s.source
                  )}
                </span>
              ))}
            </p>
          )}
        </div>
        {onOpenGuide && (
          <button
            type="button"
            className={styles.guideChip}
            onClick={onOpenGuide}
            aria-label={`Öppna guide: ${exercise.label}`}
          >
            Guide <IconCaretRight size="sm" />
          </button>
        )}
      </div>

      {/* Ring */}
      <div className={styles.ringWrap}>
        <div className={styles.ringContainer}>
          <Ring reps={exercise.reps} successCount={successCount} failCount={failCount} />
          <div className={styles.ringCenter}>
            {isComplete ? (
              <div className={styles.ringComplete}>
                <IconMedal size="xl" />
                <span className={styles.ringCompleteText}>Klart!</span>
              </div>
            ) : (
              <>
                <span className={styles.ringCountBig}>
                  {done}
                  <span className={styles.ringCountSmall}>/{exercise.reps}</span>
                </span>
                <span className={styles.ringRate}>
                  {successRate !== null ? `${successRate}% lyckade` : 'reps'}
                </span>
              </>
            )}
          </div>
          {floats.map((f) => (
            <span
              key={f.id}
              className={`${styles.floatLabel} ${f.kind === 'success' ? styles.floatSuccess : styles.floatMiss}`}
            >
              {f.kind === 'success' ? '+1' : 'miss'}
            </span>
          ))}
        </div>
      </div>

      {/* Combo */}
      <div className={styles.comboRow}>
        {combo >= 2 && !isComplete && (
          <span className={styles.comboPill}>
            <IconFire size="sm" />
            {combo} i rad!
          </span>
        )}
      </div>

      {/* Coach */}
      {coach && (
        <div
          className={`${styles.recommendation} ${showTroubleshooting ? styles.recommendationAlert : ''}`}
          role={showTroubleshooting ? 'alert' : undefined}
        >
          {showTroubleshooting && <IconWarning size="sm" />}
          <span>{coach.message}</span>
        </div>
      )}
      {!isComplete && suggestedLevel && (coach?.kind === 'lower' || coach?.kind === 'stop' || coach?.kind === 'raise') && (
        <button
          type="button"
          className={styles.coachActionBtn}
          onClick={() => onMetricsPatch({ criteria_level_id: suggestedLevel.id })}
        >
          {coach.kind === 'raise' ? `Höj till: ${suggestedLevel.label}` : `Sänk till: ${suggestedLevel.label}`}
        </button>
      )}
      {!isComplete && coach?.kind === 'end_on_success' && onEndExercise && (
        <button type="button" className={styles.coachActionBtn} onClick={onEndExercise}>
          Avsluta på topp
        </button>
      )}

      {/* Incomplete actions */}
      {!isComplete ? (
        <>
          <div className={styles.actionRow}>
            <button type="button" className={styles.btnSuccess} onClick={handleSuccess}>
              <IconCheck size="md" /> Lyckad
            </button>
            <button type="button" className={styles.btnMiss} onClick={handleMiss}>
              <IconX size="sm" /> Miss
            </button>
          </div>
          {(!isNew || showAdvanced) && (
            <>
              <div className={styles.latencyRow}>
                {LATENCY_OPTIONS.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    className={`${styles.latencyBtn} ${latencyBucket === o.id ? styles.latencyBtnSelected : ''}`}
                    onClick={() => onMetricsPatch({ latency_bucket: o.id })}
                    aria-pressed={latencyBucket === o.id}
                  >
                    <IconLightning size="sm" />
                    {o.label}
                  </button>
                ))}
              </div>
              <p className={styles.latencyHint}>
                {latencyBucket ? latencyMeaning(latencyBucket) : 'Svarstid efter signal'}
              </p>
              {onSwap && (
                <button type="button" className={styles.swapBtn} onClick={onSwap}>
                  <IconSwap size="sm" /> Byt mot fokus
                </button>
              )}
            </>
          )}
          {isNew && !showAdvanced && (
            <button type="button" className={styles.showMoreBtn} onClick={() => setShowAdvanced(true)}>
              Visa mer
            </button>
          )}
        </>
      ) : (
        /* Complete actions */
        <div className={styles.completeArea}>
          <div className={styles.statsRow}>
            <div className={styles.statBox}>
              <div className={styles.statValue}>{successRate !== null ? `${successRate}%` : '—'}</div>
              <div className={styles.statLabel}>lyckade</div>
            </div>
            <div className={styles.statBox}>
              <div className={styles.statValue}>{successCount}/{done}</div>
              <div className={styles.statLabel}>reps satt</div>
            </div>
          </div>
          {hasNextExercise ? (
            <button
              type="button"
              className={styles.ctaBtn}
              onClick={() => {
                document.getElementById('training-session-next')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
              }}
            >
              Nästa övning <IconCaretRight size="sm" />
            </button>
          ) : !dayComplete ? (
            <p className={styles.allDoneMsg}>Du är klar för idag — bra jobbat!</p>
          ) : null}
          <button type="button" className={styles.undoBtn} onClick={handleUndo}>
            Starta om kombo
          </button>
        </div>
      )}
    </div>
  )
}
