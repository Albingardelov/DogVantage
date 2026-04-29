'use client'

import { useEffect, useState } from 'react'
import ProfileGuard from '@/components/ProfileGuard'
import TrainingCard from '@/components/TrainingCard/TrainingCard'
import SessionLogForm from '@/components/SessionLogForm'
import Avatar from '@/components/Avatar'
import BottomNav from '@/components/BottomNav'
import { getDogProfile } from '@/lib/dog/profile'
import { getAgeInWeeks } from '@/lib/dog/age'
import type { DogProfile } from '@/types'
import styles from './page.module.css'

export default function DashboardPage() {
  return (
    <ProfileGuard>
      <Dashboard />
    </ProfileGuard>
  )
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 5) return 'God natt!'
  if (hour < 11) return 'God morgon!'
  if (hour < 17) return 'God dag!'
  return 'God kväll!'
}

function Dashboard() {
  const [profile, setProfile] = useState<DogProfile | null>(null)
  const [showLogForm, setShowLogForm] = useState(false)

  const weekNumber = profile ? Math.max(1, getAgeInWeeks(profile.birthdate)) : 0

  useEffect(() => {
    const p = getDogProfile()
    if (p) setProfile(p)
  }, [])

  function handleLogSaved() {
    setShowLogForm(false)
  }

  const dogName = profile?.name ?? '…'

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div className={styles.decorCircle} aria-hidden="true" />
        <div className={styles.headerContent}>
          <div className={styles.headerText}>
            <span className={styles.greeting}>{getGreeting()}</span>
            <h1 className={styles.dogName}>{dogName}</h1>
            <span className={styles.weekBadge}>
              <span aria-hidden="true">📅</span> Vecka {weekNumber || '–'}
            </span>
          </div>
          <Avatar name={dogName} size={64} />
        </div>
      </header>

      <div className={styles.scrollArea}>
        {profile && (
          <TrainingCard
            weekNumber={weekNumber}
            breed={profile.breed}
            dogName={dogName}
          />
        )}

        <div className={styles.statsGrid}>
          <StatCard label="Pass loggade" value="3" sub="denna vecka" tone="primary" />
          <StatCard label="Snittbetyg" value="4.2" sub="fokus & lydnad" tone="accent" />
        </div>

        {!showLogForm ? (
          <button
            className={styles.logCta}
            onClick={() => setShowLogForm(true)}
            type="button"
          >
            <span aria-hidden="true">✍️</span>
            <span>Logga träningspass</span>
          </button>
        ) : (
          profile && (
            <SessionLogForm
              breed={profile.breed}
              weekNumber={weekNumber}
              onSaved={handleLogSaved}
              onCancel={() => setShowLogForm(false)}
            />
          )
        )}
      </div>

      <BottomNav active="dashboard" />
    </main>
  )
}

function StatCard({
  label,
  value,
  sub,
  tone,
}: {
  label: string
  value: string
  sub: string
  tone: 'primary' | 'accent'
}) {
  return (
    <div className={styles.statCard}>
      <span className={`${styles.statValue} ${tone === 'accent' ? styles.statValueAccent : ''}`}>
        {value}
      </span>
      <span className={styles.statLabel}>{label}</span>
      <span className={styles.statSub}>{sub}</span>
    </div>
  )
}
