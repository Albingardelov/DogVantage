'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ProfileGuard from '@/components/ProfileGuard'
import BottomNav from '@/components/BottomNav'
import { getDogProfile } from '@/lib/dog/profile'
import { getAgeInWeeks } from '@/lib/dog/age'
import type { DogProfile, SessionLog, WeekPlan } from '@/types'
import styles from './page.module.css'

export default function CalendarPage() {
  return (
    <ProfileGuard>
      <CalendarView />
    </ProfileGuard>
  )
}

// WEEKDAY_NAMES: indexed by Date.getDay() (0 = Sunday)
const WEEKDAY_NAMES = ['Söndag', 'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag']
// WEEKDAY_ABBR: Mon-first order for grid column headers (not getDay() indexed)
const WEEKDAY_ABBR  = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön']
const MONTH_NAMES   = [
  'januari', 'februari', 'mars', 'april', 'maj', 'juni',
  'juli', 'augusti', 'september', 'oktober', 'november', 'december',
]
const DAY_NAMES_LC  = ['söndag', 'måndag', 'tisdag', 'onsdag', 'torsdag', 'fredag', 'lördag']

type DayState = 'good' | 'mixed' | 'bad' | 'missed' | 'planned' | 'rest'

function getDayState(
  dateStr: string,
  todayStr: string,
  logs: Record<string, SessionLog>,
  trainingWeekdays: Set<string>
): DayState {
  const log = logs[dateStr]
  if (log) return log.quick_rating as DayState

  // Use noon to avoid timezone issues when parsing date-only strings
  const date = new Date(dateStr + 'T12:00:00')
  const isTraining = trainingWeekdays.has(WEEKDAY_NAMES[date.getDay()])

  if (dateStr < todayStr) return isTraining ? 'missed' : 'rest'
  return isTraining ? 'planned' : 'rest'
}

// Returns array of YYYY-MM-DD strings (or null for padding cells).
// Grid starts on Monday (offset by Mon=0…Sun=6).
function getMonthCells(year: number, month: number): (string | null)[] {
  const firstDay   = new Date(year, month, 1)
  const startOffset = (firstDay.getDay() + 6) % 7 // Mon = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (string | null)[] = Array(startOffset).fill(null)
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(
      `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    )
  }
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

function DayCell({
  dateStr,
  todayStr,
  selected,
  state,
  onClick,
}: {
  dateStr: string
  todayStr: string
  selected: boolean
  state: DayState
  onClick: () => void
}) {
  const dayNum  = Number(dateStr.slice(8))
  const isToday = dateStr === todayStr

  const dotClass: string | null = {
    good:    styles.dotGood,
    mixed:   styles.dotMixed,
    bad:     styles.dotBad,
    missed:  styles.dotMissed,
    planned: styles.dotPlanned,
    rest:    null,
  }[state]

  return (
    <button
      type="button"
      className={[
        styles.dayCell,
        isToday   ? styles.dayCellToday    : '',
        selected  ? styles.dayCellSelected : '',
      ].join(' ')}
      onClick={onClick}
      aria-label={dateStr}
      aria-pressed={selected}
    >
      <span className={styles.dayNumber}>{dayNum}</span>
      {dotClass && <span className={`${styles.dot} ${dotClass}`} aria-hidden="true" />}
    </button>
  )
}

function CalendarGrid({
  year,
  month,
  todayStr,
  selectedDate,
  logs,
  trainingWeekdays,
  onSelectDate,
}: {
  year: number
  month: number
  todayStr: string
  selectedDate: string
  logs: Record<string, SessionLog>
  trainingWeekdays: Set<string>
  onSelectDate: (date: string) => void
}) {
  const cells = getMonthCells(year, month)
  return (
    <div className={styles.grid}>
      {WEEKDAY_ABBR.map((d) => (
        <div key={d} className={styles.weekdayHeader}>{d}</div>
      ))}
      {cells.map((dateStr, i) => {
        if (!dateStr) return <div key={`pad-${i}`} className={styles.dayCellEmpty} />
        const state = getDayState(dateStr, todayStr, logs, trainingWeekdays)
        return (
          <DayCell
            key={dateStr}
            dateStr={dateStr}
            todayStr={todayStr}
            selected={selectedDate === dateStr}
            state={state}
            onClick={() => onSelectDate(dateStr)}
          />
        )
      })}
    </div>
  )
}

function CalendarView() {
  const router = useRouter()
  const [profile, setProfile] = useState<DogProfile | null>(null)
  const [logs, setLogs] = useState<Record<string, SessionLog>>({})
  const [trainingWeekdays, setTrainingWeekdays] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const [viewYear, setViewYear]     = useState(today.getFullYear())
  const [viewMonth, setViewMonth]   = useState(today.getMonth()) // 0-based
  const [selectedDate, setSelectedDate] = useState<string>(todayStr)

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
          if (!byDate[date]) byDate[date] = log // keep first (most recent) per day
        }
        setLogs(byDate)
      }

      if (planRes.ok) {
        const plan: WeekPlan = await planRes.json()
        setTrainingWeekdays(
          new Set(plan.days.filter((d) => !d.rest).map((d) => d.day))
        )
      }
    } finally {
      setLoading(false)
    }
  }, [profile])

  useEffect(() => { fetchData() }, [fetchData])

  if (!profile) return null

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1) }
    else setViewMonth((m) => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1) }
    else setViewMonth((m) => m + 1)
  }

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div className={styles.decorCircle} aria-hidden="true" />
        <div className={styles.headerContent}>
          <button type="button" className={styles.backBtn} onClick={() => router.back()} aria-label="Tillbaka">
            <BackIcon />
          </button>
          <span className={styles.headerTitle}>Träningskalender</span>
        </div>
      </header>

      <div className={styles.scrollArea}>
        {loading ? (
          <p className={styles.noData}>Laddar…</p>
        ) : (
          <>
            <div className={styles.monthNav}>
              <button type="button" className={styles.monthNavBtn} onClick={prevMonth} aria-label="Föregående månad">
                <ChevronLeft />
              </button>
              <span className={styles.monthLabel}>{MONTH_NAMES[viewMonth]} {viewYear}</span>
              <button type="button" className={styles.monthNavBtn} onClick={nextMonth} aria-label="Nästa månad">
                <ChevronRight />
              </button>
            </div>

            <CalendarGrid
              year={viewYear}
              month={viewMonth}
              todayStr={todayStr}
              selectedDate={selectedDate}
              logs={logs}
              trainingWeekdays={trainingWeekdays}
              onSelectDate={setSelectedDate}
            />

            <DayDetailPanel
              dateStr={selectedDate}
              todayStr={todayStr}
              log={logs[selectedDate] ?? null}
              trainingWeekdays={trainingWeekdays}
            />

            <Legend />
          </>
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

function ChevronLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

function ChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}
