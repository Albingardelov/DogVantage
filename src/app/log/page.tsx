'use client'

import { useEffect, useState } from 'react'
import ProfileGuard from '@/components/ProfileGuard'
import Avatar from '@/components/Avatar'
import BottomNav from '@/components/BottomNav'
import { getDogProfile } from '@/lib/dog/profile'
import type { DogProfile, QuickRating, SessionLog } from '@/types'
import styles from './page.module.css'

export default function LogPage() {
  return (
    <ProfileGuard>
      <Log />
    </ProfileGuard>
  )
}

const RATING_META: Record<QuickRating, { emoji: string; label: string; tone: string }> = {
  good: { emoji: '😄', label: 'Bra', tone: 'good' },
  mixed: { emoji: '😐', label: 'Blandat', tone: 'mixed' },
  bad: { emoji: '😞', label: 'Svårt', tone: 'bad' },
}

const DATE_FMT = new Intl.DateTimeFormat('sv-SE', { day: 'numeric', month: 'short' })

function Log() {
  const [profile, setProfile] = useState<DogProfile | null>(null)
  const [logs, setLogs] = useState<SessionLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const p = getDogProfile()
    if (!p) return
    setProfile(p)

    let alive = true
    ;(async () => {
      try {
        const res = await fetch(`/api/logs?breed=${encodeURIComponent(p.breed)}`)
        const data = await res.json()
        if (!alive) return
        if (!res.ok) {
          setError(data.error ?? `Fel ${res.status}`)
        } else {
          setLogs(data as SessionLog[])
        }
      } catch (err) {
        if (alive) setError(err instanceof Error ? err.message : 'Nätverksfel')
      } finally {
        if (alive) setLoading(false)
      }
    })()

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

        {!loading && !error && logs.length === 0 && (
          <p className={styles.empty}>Inga pass loggade ännu — börja logga från Hem-fliken.</p>
        )}

        {logs.map((log) => {
          const meta = RATING_META[log.quick_rating]
          const date = DATE_FMT.format(new Date(log.created_at))
          return (
            <article
              key={log.id}
              className={`${styles.card} ${styles[`card_${meta.tone}`]}`}
            >
              <div className={styles.cardTop}>
                <span className={styles.cardEmoji} aria-hidden="true">{meta.emoji}</span>
                <div className={styles.cardLabel}>
                  <span className={styles.ratingLabel}>{meta.label}</span>
                  <span className={styles.dateLabel}>{date}</span>
                </div>
                <span className={styles.weekLabel}>v.{log.week_number}</span>
              </div>

              <div className={styles.dotsRow}>
                <DotMetric label="Fokus" value={log.focus} />
                <DotMetric label="Lydnad" value={log.obedience} />
              </div>

              {log.notes && (
                <p className={styles.notes}>&ldquo;{log.notes}&rdquo;</p>
              )}
            </article>
          )
        })}
      </div>

      <BottomNav active="log" />
    </main>
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
