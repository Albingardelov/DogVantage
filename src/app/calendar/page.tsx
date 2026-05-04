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

// Swedish weekday name lookup — matches Date.getDay() (0 = Sunday)
const WEEKDAY_NAMES = ['Söndag', 'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag']
const WEEKDAY_ABBR  = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön']
const MONTH_NAMES   = [
  'januari', 'februari', 'mars', 'april', 'maj', 'juni',
  'juli', 'augusti', 'september', 'oktober', 'november', 'december',
]
const DAY_NAMES_LC  = ['söndag', 'måndag', 'tisdag', 'onsdag', 'torsdag', 'fredag', 'lördag']

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
        {loading
          ? <p className={styles.noData}>Laddar…</p>
          : <p className={styles.noData}>Data laddad: {Object.keys(logs).length} loggade pass</p>
        }
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
