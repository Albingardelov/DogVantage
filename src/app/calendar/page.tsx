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

  useEffect(() => {
    const p = getDogProfile()
    if (p) setProfile(p)
  }, [])

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
        <p className={styles.noData}>Laddar…</p>
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
