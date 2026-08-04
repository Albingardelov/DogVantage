'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRouter } from 'next/navigation'
import ProfileGuard from '@/components/ProfileGuard'
import BottomNav from '@/components/BottomNav'
import ExerciseGuideSheet from '@/components/ExerciseGuideSheet'
import { useActiveDog } from '@/lib/dog/active-dog-context'
import { getAgeInWeeks, isPuppyMode } from '@/lib/dog/age'
import type { PuppyZone } from '@/lib/training/puppy-zone'
import type { DayPlan, Exercise, QuickRating, SessionLog, WeekPlan } from '@dogvantage/core'
import { IconCaretLeft, IconClose } from '@/components/icons'
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

function DaySheet({
  dayPlan,
  dayLabel,
  onClose,
  onExerciseClick,
  onLogClick,
}: {
  dayPlan: DayPlan
  dayLabel: string
  onClose: () => void
  onExerciseClick: (ex: Exercise) => void
  onLogClick?: () => void
}) {
  return (
    <div className={styles.sheetOverlay} onClick={onClose} role="dialog" aria-modal="true" aria-label={dayLabel}>
      <div className={styles.sheetPanel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.sheetHeader}>
          <span className={styles.sheetTitle}>{dayLabel}</span>
          <button type="button" className={styles.sheetClose} onClick={onClose} aria-label="Stäng">
            <IconClose size="md" />
          </button>
        </div>
        {dayPlan.exercises?.map((ex) => (
          <div key={ex.id} className={styles.sheetExercise}>
            <div className={styles.sheetExerciseTop}>
              <span className={styles.sheetExerciseName}>{ex.label}</span>
              <span className={styles.sheetExerciseReps}>{ex.reps}×</span>
            </div>
            {ex.desc && <p className={styles.sheetExerciseDesc}>{ex.desc}</p>}
            <button type="button" className={styles.sheetGuideBtn} onClick={() => onExerciseClick(ex)}>
              Se guide
            </button>
          </div>
        ))}
        {onLogClick && (
          <button type="button" className={styles.sheetLogBtn} onClick={onLogClick}>
            Logga passet
          </button>
        )}
      </div>
    </div>
  )
}

function AgendaDay({
  dateStr,
  todayStr,
  dayPlan,
  log,
  zone,
  onClick,
}: {
  dateStr: string
  todayStr: string
  dayPlan: DayPlan | null
  log: SessionLog | null
  zone?: PuppyZone
  onClick?: () => void
}) {
  const { t } = useTranslation()
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
        <span className={styles.restBadge}>{t('calendar.restDay')}</span>
      </div>
    )
  }

  const rating = log ? RATING_CONFIG[log.quick_rating] : null

  return (
    <div
      className={`${styles.trainingDay} ${isToday ? styles.trainingDayToday : ''} ${onClick ? styles.trainingDayClickable : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick() } : undefined}
    >
      <div className={styles.trainingDayHeader}>
        <div className={styles.trainingDayMeta}>
          {isToday && <span className={styles.todayPip} aria-hidden="true" />}
            {zone && (
              <span
                aria-label={`Zon: ${zone}`}
                style={{
                  display: 'inline-block',
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: zone === 'green' ? '#22c55e' : zone === 'yellow' ? '#eab308' : '#ef4444',
                  marginRight: 4,
                  flexShrink: 0,
                }}
              />
            )}
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
  const { activeDog: profile } = useActiveDog()
  const [logs, setLogs] = useState<Record<string, SessionLog>>({})
  const [weekPlan, setWeekPlan] = useState<WeekPlan | null>(null)
  const [checkIns, setCheckIns] = useState<Record<string, PuppyZone>>({})
  const [loading, setLoading] = useState(true)
  const [sheetDay, setSheetDay] = useState<{ plan: DayPlan; label: string; dateStr: string } | null>(null)
  const [guideExercise, setGuideExercise] = useState<Exercise | null>(null)
  const todayRef = useRef<HTMLDivElement>(null)

  const todayStr = new Date().toISOString().slice(0, 10)
  const ageWeeks = profile ? Math.max(1, getAgeInWeeks(profile.birthdate)) : undefined

  const fetchData = useCallback(async () => {
    if (!profile) return
    setLoading(true)
    try {
      setCheckIns({})
      const ageWeeks = Math.max(1, getAgeInWeeks(profile.birthdate))
      const trainingWeek = profile.trainingWeek ?? 1
      const goals = profile.onboarding?.goals
      const goalsParam = goals && goals.length > 0 ? `&goals=${goals.join(',')}` : ''

      const pets = profile.onboarding?.householdPets
      const petsParam = pets && pets.length > 0 ? `&householdPets=${pets.join(',')}` : ''
      const dogIdParam = profile.id ? `&dogId=${encodeURIComponent(profile.id)}` : ''

      const puppyMode = isPuppyMode(ageWeeks)
      const visibleStart = addDays(getMondayOf(todayStr), -14)
      const visibleEnd   = addDays(getMondayOf(todayStr), 34)

      const [logsRes, planRes, checkInRes] = await Promise.all([
        fetch(`/api/logs?dogId=${encodeURIComponent(profile.id ?? '')}`),
        fetch(`/api/training/week?week=${trainingWeek}&ageWeeks=${ageWeeks}${goalsParam}${petsParam}${dogIdParam}`),
        puppyMode && profile.id
          ? fetch(`/api/training/checkin?dogId=${encodeURIComponent(profile.id)}&from=${visibleStart}&to=${visibleEnd}`)
          : Promise.resolve(null),
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
      } else {
        setWeekPlan(null)
        console.error('[calendar week-plan]', planRes.status, await planRes.text())
      }

      if (checkInRes?.ok) {
        const body = await checkInRes.json().catch(() => null)
        if (body?.zones) setCheckIns(body.zones as Record<string, PuppyZone>)
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
          <button type="button" className={styles.backBtn} onClick={() => router.push('/dashboard')} aria-label="Tillbaka">
            <IconCaretLeft size="md" />
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
                <span className={styles.weekLabel}>Kalendervecka {week.isoWeek}</span>
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
                        zone={checkIns[dateStr]}
                        onClick={dayPlan && !dayPlan.rest && dayPlan.exercises?.length ? () => {
                          const d = new Date(dateStr + 'T12:00:00')
                          const label = `${WEEKDAY_NAMES[d.getDay()]} ${d.getDate()} ${MONTH_NAMES_SHORT[d.getMonth()]}`
                          setSheetDay({ plan: dayPlan, label, dateStr })
                        } : undefined}
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

      {sheetDay && !guideExercise && (
        <DaySheet
          dayPlan={sheetDay.plan}
          dayLabel={sheetDay.label}
          onClose={() => setSheetDay(null)}
          onExerciseClick={(ex) => setGuideExercise(ex)}
          onLogClick={sheetDay.dateStr <= todayStr && !logs[sheetDay.dateStr]
            ? () => router.push('/dashboard?log=1')
            : undefined}
        />
      )}

      {guideExercise && (
        <ExerciseGuideSheet
          exerciseId={guideExercise.id}
          exerciseLabel={guideExercise.label}
          ageWeeks={ageWeeks}
          onClose={() => setGuideExercise(null)}
        />
      )}
    </main>
  )
}
