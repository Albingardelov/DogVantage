'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import ProfileGuard from '@/components/ProfileGuard'
import BottomNav from '@/components/BottomNav'
import { getDogProfile } from '@/lib/dog/profile'
import { getAgeInWeeks } from '@/lib/dog/age'
import type { DayPlan, DogProfile, QuickRating, SessionLog, WeekPlan } from '@/types'
import styles from './page.module.css'

// Indexed by Date.getDay() (0 = Sunday)
const WEEKDAY_NAMES = ['Söndag', 'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag']
const MONTH_NAMES_SHORT = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']

export default function CalendarPage() {
  return (
    <ProfileGuard>
      <CalendarView />
    </ProfileGuard>
  )
}

function getISOWeek(date: Date): number {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7))
  const week1 = new Date(d.getFullYear(), 0, 4)
  return 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7)
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function getMondayOf(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() - (d.getDay() + 6) % 7)
  return d.toISOString().slice(0, 10)
}

const RATING_CONFIG: Record<QuickRating, { label: string; cls: string }> = {
  good:  { label: 'Bra',     cls: styles.ratingGood },
  mixed: { label: 'Blandat', cls: styles.ratingMixed },
  bad:   { label: 'Svårt',   cls: styles.ratingBad },
}

function AgendaDay({
  dateStr,
  todayStr,
  dayPlan,
  log,
}: {
  dateStr: string
  todayStr: string
  dayPlan: DayPlan | null
  log: SessionLog | null
}) {
  const d = new Date(dateStr + 'T12:00:00')
  const dayName = WEEKDAY_NAMES[d.getDay()]
  const dateLabel = `${d.getDate()} ${MONTH_NAMES_SHORT[d.getMonth()]}`
  const isToday = dateStr === todayStr
  const isFuture = dateStr > todayStr
  const isRest = !dayPlan || dayPlan.rest

  if (isRest) {
    return (
      <div className={styles.restDay}>
        <span className={styles.restDayText}>{dayName} {dateLabel}</span>
        <span className={styles.restBadge}>Vila</span>
      </div>
    )
  }

  const rating = log ? RATING_CONFIG[log.quick_rating] : null

  return (
    <div className={`${styles.trainingDay} ${isToday ? styles.trainingDayToday : ''}`}>
      <div className={styles.trainingDayHeader}>
        <div className={styles.trainingDayMeta}>
          {isToday && <span className={styles.todayPip} aria-hidden="true" />}
          <span className={`${styles.trainingDayName} ${isToday ? styles.trainingDayNameToday : ''}`}>
            {dayName}
          </span>
          <span className={styles.trainingDayDate}>{dateLabel}</span>
        </div>
        {log ? (
          <span className={`${styles.badge} ${rating!.cls}`}>{rating!.label}</span>
        ) : isFuture ? (
          <span className={`${styles.badge} ${styles.badgePlanned}`}>Planerat</span>
        ) : (
          <span className={`${styles.badge} ${styles.badgeMissed}`}>Missat</span>
        )}
      </div>

      {log ? (
        <div className={styles.logContent}>
          <div className={styles.logStats}>
            <span><strong>{log.focus}/5</strong> fokus</span>
            <span><strong>{log.obedience}/5</strong> lydnad</span>
          </div>
          {log.exercises && log.exercises.length > 0 && (
            <ul className={styles.exerciseList}>
              {log.exercises.map((ex) => {
                const attempts = ex.success_count + ex.fail_count
                const rate = attempts > 0 ? Math.round((ex.success_count / attempts) * 100) : null
                return (
                  <li key={ex.id} className={styles.exerciseItem}>
                    <span>{ex.label}</span>
                    {rate !== null && (
                      <span className={styles.exerciseMeta}>{ex.success_count}/{attempts} ({rate}%)</span>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
          {log.notes && <p className={styles.logNotes}>"{log.notes}"</p>}
        </div>
      ) : isFuture && dayPlan.exercises && dayPlan.exercises.length > 0 ? (
        <ul className={styles.exerciseList}>
          {dayPlan.exercises.map((ex) => (
            <li key={ex.id} className={`${styles.exerciseItem} ${styles.exerciseItemPlanned}`}>
              <span>{ex.label}</span>
              <span className={styles.exerciseMeta}>{ex.reps}×</span>
            </li>
          ))}
        </ul>
      ) : !isFuture ? (
        <p className={styles.missedText}>Inget pass loggat</p>
      ) : null}
    </div>
  )
}

function CalendarView() {
  const router = useRouter()
  const [profile, setProfile] = useState<DogProfile | null>(null)
  const [logs, setLogs] = useState<Record<string, SessionLog>>({})
  const [weekPlan, setWeekPlan] = useState<WeekPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const todayRef = useRef<HTMLDivElement>(null)

  const todayStr = new Date().toISOString().slice(0, 10)

  useEffect(() => {
    const p = getDogProfile()
    if (p) setProfile(p)
  }, [])

  const fetchData = useCallback(async () => {
    if (!profile) return
    setLoading(true)
    try {
      const ageWeeks = Math.max(1, getAgeInWeeks(profile.birthdate))
      const trainingWeek = profile.trainingWeek ?? 1
      const goals = profile.onboarding?.goals
      const goalsParam = goals && goals.length > 0 ? `&goals=${goals.join(',')}` : ''

      const [logsRes, planRes] = await Promise.all([
        fetch(`/api/logs?breed=${profile.breed}`),
        fetch(`/api/training/week?breed=${profile.breed}&week=${trainingWeek}&ageWeeks=${ageWeeks}${goalsParam}`),
      ])

      if (logsRes.ok) {
        const allLogs: SessionLog[] = await logsRes.json()
        const byDate: Record<string, SessionLog> = {}
        for (const log of allLogs) {
          const date = log.created_at.slice(0, 10)
          if (!byDate[date]) byDate[date] = log
        }
        setLogs(byDate)
      }

      if (planRes.ok) {
        setWeekPlan(await planRes.json())
      }
    } finally {
      setLoading(false)
    }
  }, [profile])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    if (!loading) {
      todayRef.current?.scrollIntoView({ behavior: 'instant', block: 'start' })
    }
  }, [loading])

  if (!profile) return null

  const dayPlanByWeekday: Record<string, DayPlan> = {}
  if (weekPlan) {
    for (const dp of weekPlan.days) dayPlanByWeekday[dp.day] = dp
  }

  // 2 weeks back → 5 weeks forward, always starting on Monday
  const startStr = addDays(getMondayOf(todayStr), -14)
  const endStr   = addDays(getMondayOf(todayStr), 34)

  type WeekGroup = { isoWeek: number; year: number; dates: string[] }
  const weeks: WeekGroup[] = []
  let cur = startStr
  while (cur <= endStr) {
    const d = new Date(cur + 'T12:00:00')
    const iso = getISOWeek(d)
    const yr  = d.getFullYear()
    if (weeks.length === 0 || weeks[weeks.length - 1].isoWeek !== iso) {
      weeks.push({ isoWeek: iso, year: yr, dates: [] })
    }
    weeks[weeks.length - 1].dates.push(cur)
    cur = addDays(cur, 1)
  }

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div className={styles.decorCircle} aria-hidden="true" />
        <div className={styles.headerContent}>
          <button type="button" className={styles.backBtn} onClick={() => router.back()} aria-label="Tillbaka">
            <BackIcon />
          </button>
          <span className={styles.headerTitle}>Träningsschema</span>
        </div>
      </header>

      <div className={styles.scrollArea}>
        {loading ? (
          <p className={styles.loadingText}>Laddar…</p>
        ) : (
          weeks.map((week) => (
            <div key={`${week.year}-${week.isoWeek}`} className={styles.weekSection}>
              <div className={styles.weekHeader}>
                <span className={styles.weekLabel}>Vecka {week.isoWeek}</span>
              </div>
              <div className={styles.weekDays}>
                {week.dates.map((dateStr) => {
                  const d = new Date(dateStr + 'T12:00:00')
                  const dayPlan = dayPlanByWeekday[WEEKDAY_NAMES[d.getDay()]] ?? null
                  return (
                    <div key={dateStr} ref={dateStr === todayStr ? todayRef : undefined}>
                      <AgendaDay
                        dateStr={dateStr}
                        todayStr={todayStr}
                        dayPlan={dayPlan}
                        log={logs[dateStr] ?? null}
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )}
      </div>

      <BottomNav active="dashboard" />
    </main>
  )
}

function BackIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}
