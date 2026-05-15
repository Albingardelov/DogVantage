'use client'

import { useEffect, useState } from 'react'
import ProfileGuard from '@/components/ProfileGuard'
import Avatar from '@/components/Avatar'
import BottomNav from '@/components/BottomNav'
import { getDogProfile } from '@/lib/dog/profile'
import { IconCaretRight, RatingIcon } from '@/components/icons'
import SkillProgressSection from '@/components/SkillProgressSection'
import type { DogProfile, QuickRating, SessionLog } from '@/types'
import { apiFetch } from '@/lib/api/fetch'
import { SessionLogArraySchema } from '@/types/api/schemas'
import styles from './page.module.css'

export default function LogPage() {
  return (
    <ProfileGuard>
      <Log />
    </ProfileGuard>
  )
}

const RATING_META: Record<QuickRating, { label: string; tone: string }> = {
  good: { label: 'Bra', tone: 'good' },
  mixed: { label: 'Blandat', tone: 'mixed' },
  bad: { label: 'Svårt', tone: 'bad' },
}

const DATE_FMT = new Intl.DateTimeFormat('sv-SE', { day: 'numeric', month: 'short' })

function Log() {
  const [profile, setProfile] = useState<DogProfile | null>(null)
  const [logs, setLogs] = useState<SessionLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      const p = await getDogProfile()
      if (!alive || !p) return
      setProfile(p)

      try {
        if (!p.id) return
        const params = new URLSearchParams({ dogId: p.id })
        if (!alive) return
        const data = await apiFetch(`/api/logs?${params}`, SessionLogArraySchema)
        setLogs(data)
      } catch (err) {
        if (alive) setError(err instanceof Error ? err.message : 'Nätverksfel')
      } finally {
        if (alive) setLoading(false)
      }
    })().catch((e) => {
      if (alive) setError(e instanceof Error ? e.message : 'Nätverksfel')
      if (alive) setLoading(false)
    })

    return () => {
      alive = false
    }
  }, [])

  const dogName = profile?.name ?? 'Din hund'
  const focusBars = buildFocusBars(logs)

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <Avatar name={dogName} size={36} bordered={false} />
          <div className={styles.headerText}>
            <h1 className={styles.title}>{dogName}s logg</h1>
            <span className={styles.subtitle}>
              {loading ? 'Laddar…' : `${logs.length} pass loggade`}
            </span>
            {!loading && logs.length > 0 && (
              <span className={styles.listHint}>
                Tryck på ett pass för att visa övningar och mer information.
              </span>
            )}
          </div>
        </div>

        {logs.length > 0 && (
          <>
            <div className={styles.chart} aria-hidden="true">
              {focusBars.map((v, i) => (
                <span
                  key={i}
                  className={`${styles.bar} ${i === focusBars.length - 1 ? styles.barLast : ''}`}
                  style={{ height: `${(v / 5) * 100}%` }}
                />
              ))}
            </div>
            <span className={styles.chartLabel}>Fokus senaste 7 dagarna</span>
          </>
        )}
      </header>

      <div className={styles.body}>
        {error && (
          <p className={styles.error} role="alert">Fel: {error}</p>
        )}

        {profile && profile.id && logs.length > 0 && (
          <SkillProgressSection breed={profile.breed} dogId={profile.id} />
        )}

        {!loading && !error && logs.length === 0 && (
          <p className={styles.empty}>Inga pass loggade ännu — börja logga från Hem-fliken.</p>
        )}

        {logs.map((log) => {
          const meta = RATING_META[log.quick_rating]
          const date = DATE_FMT.format(new Date(log.created_at))
          const isExpanded = expandedId === log.id
          const hasExercises = log.exercises && log.exercises.length > 0
          const detailLabel = `${meta.label} ${date}, programvecka ${log.week_number}`
          return (
            <article
              key={log.id}
              className={`${styles.card} ${styles[`card_${meta.tone}`]} ${isExpanded ? styles.cardExpanded : ''}`}
              onClick={() => setExpandedId(isExpanded ? null : log.id)}
              role="button"
              tabIndex={0}
              aria-expanded={isExpanded}
              aria-label={
                isExpanded
                  ? `Dölj detaljer för pass: ${detailLabel}`
                  : `Visa detaljer för pass: ${detailLabel}`
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setExpandedId(isExpanded ? null : log.id)
                }
              }}
            >
              <div className={styles.cardTop}>
                <RatingIcon rating={log.quick_rating} size="lg" className={styles.cardIcon} />
                <div className={styles.cardLabel}>
                  <span className={styles.ratingLabel}>{meta.label}</span>
                  <span className={styles.dateLabel}>{date}</span>
                </div>
                <span className={styles.weekLabel}>v.{log.week_number}</span>
                <div className={styles.cardAction}>
                  <span className={styles.expandHint}>{isExpanded ? 'Dölj' : 'Visa mer'}</span>
                  <IconCaretRight
                    size="sm"
                    className={`${styles.chevron} ${isExpanded ? styles.chevronOpen : ''}`}
                  />
                </div>
              </div>

              <div className={styles.dotsRow}>
                <DotMetric label="Fokus" value={log.focus} />
                <DotMetric label="Lydnad" value={log.obedience} />
              </div>

              {log.notes && (
                <p className={styles.notes}>&ldquo;{log.notes}&rdquo;</p>
              )}

              {isExpanded && hasExercises && (
                <div className={styles.exercises}>
                  <span className={styles.exercisesLabel}>Övningar</span>
                  <ul className={styles.exerciseList}>
                    {log.exercises!.map((ex) => {
                      const attempts = ex.success_count + ex.fail_count
                      const rate = attempts > 0 ? Math.round((ex.success_count / attempts) * 100) : null
                      const latencyLabel = ex.latency_bucket
                        ? ({ lt1s: '< 1 s', '1to3s': '1–3 s', gt3s: '> 3 s' } as Record<string, string>)[ex.latency_bucket]
                        : null
                      const latencyTone = ex.latency_bucket === 'lt1s' ? styles.latencyFast
                        : ex.latency_bucket === '1to3s' ? styles.latencyMid
                        : ex.latency_bucket === 'gt3s' ? styles.latencySlow
                        : ''
                      return (
                        <li key={ex.id} className={styles.exerciseItem}>
                          <span className={styles.exerciseName}>{ex.label}</span>
                          <div className={styles.exerciseMeta}>
                            {attempts > 0 && (
                              <span className={styles.exerciseRate}>
                                {ex.success_count}/{attempts}{rate !== null ? ` (${rate}%)` : ''}
                              </span>
                            )}
                            {latencyLabel && (
                              <span className={`${styles.latencyBadge} ${latencyTone}`}>
                                {latencyLabel}
                              </span>
                            )}
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}

              {isExpanded && (log.handler_timing || log.handler_consistency || log.handler_reading) && (
                <div className={styles.handlerSection}>
                  <span className={styles.exercisesLabel}>Din insats</span>
                  <div className={styles.handlerRow}>
                    {log.handler_timing && <HandlerStat label="Timing" value={log.handler_timing} />}
                    {log.handler_consistency && <HandlerStat label="Konsekvens" value={log.handler_consistency} />}
                    {log.handler_reading && <HandlerStat label="Läsa hunden" value={log.handler_reading} />}
                  </div>
                </div>
              )}

              {isExpanded && !hasExercises && !log.notes && !log.handler_timing && (
                <p className={styles.noDetails}>Inga övningsdetaljer sparade.</p>
              )}
            </article>
          )
        })}
      </div>

      <BottomNav active="log" />
    </main>
  )
}

function HandlerStat({ label, value }: { label: string; value: number }) {
  return (
    <div className={styles.handlerStat}>
      <span className={styles.handlerStatValue}>{value}/5</span>
      <span className={styles.handlerStatLabel}>{label}</span>
    </div>
  )
}

function DotMetric({ label, value, max = 5 }: { label: string; value: number; max?: number }) {
  return (
    <div className={styles.metric}>
      <span className={styles.metricLabel}>{label}</span>
      <div className={styles.dots} aria-label={`${label} ${value} av ${max}`}>
        {Array.from({ length: max }).map((_, i) => (
          <span
            key={i}
            className={`${styles.dot} ${i < value ? styles.dotFilled : ''}`}
          />
        ))}
      </div>
    </div>
  )
}

function buildFocusBars(logs: SessionLog[]): number[] {
  const today = new Date()
  const days: number[] = []
  for (let i = 6; i >= 0; i--) {
    const day = new Date(today)
    day.setHours(0, 0, 0, 0)
    day.setDate(today.getDate() - i)
    const next = new Date(day)
    next.setDate(day.getDate() + 1)

    const inDay = logs.filter((l) => {
      const t = new Date(l.created_at).getTime()
      return t >= day.getTime() && t < next.getTime()
    })
    if (inDay.length === 0) {
      days.push(0)
    } else {
      const avg = inDay.reduce((sum, l) => sum + l.focus, 0) / inDay.length
      days.push(avg)
    }
  }
  return days
}
