'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import ProfileGuard from '@/components/ProfileGuard'
import TrainingCard from '@/components/TrainingCard'
import SessionLogForm from '@/components/SessionLogForm'
import { getDogProfile } from '@/lib/dog/profile'
import { getAgeInWeeks } from '@/lib/dog/age'
import type { DogProfile, TrainingResult } from '@/types'
import styles from './page.module.css'

export default function DashboardPage() {
  return (
    <ProfileGuard>
      <Dashboard />
    </ProfileGuard>
  )
}

function Dashboard() {
  const [profile, setProfile] = useState<DogProfile | null>(null)
  const [training, setTraining] = useState<TrainingResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState('')
  const [showLogForm, setShowLogForm] = useState(false)

  const weekNumber = profile ? getAgeInWeeks(profile.birthdate) : 0

  const fetchTraining = useCallback(async (p: DogProfile, week: number) => {
    setLoading(true)
    setApiError('')
    try {
      const res = await fetch('/api/training', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ breed: p.breed, weekNumber: week }),
      })
      const data = await res.json()
      if (!res.ok) {
        setApiError(data.error ?? `Fel ${res.status}`)
      } else {
        setTraining(data)
      }
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Nätverksfel')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const p = getDogProfile()
    if (p) {
      setProfile(p)
      const week = getAgeInWeeks(p.birthdate)
      fetchTraining(p, week)
    }
  }, [fetchTraining])

  function handleLogSaved() {
    setShowLogForm(false)
    if (profile) fetchTraining(profile, weekNumber)
  }

  return (
    <main className={styles.main}>
      <header className={styles.topBar}>
        <span className={styles.appName}>DogVantage</span>
        <nav className={styles.nav}>
          <Link href="/chat" className={styles.navLink}>Chatt</Link>
          <Link href="/onboarding" className={styles.navLink}>Inställningar</Link>
        </nav>
      </header>

      <div className={styles.content}>
        {apiError && (
          <p style={{ color: 'var(--color-error)', fontSize: 'var(--text-sm)', padding: 'var(--space-4)' }}>
            Fel: {apiError}
          </p>
        )}
        <TrainingCard
          weekNumber={weekNumber}
          dogName={profile?.name ?? '…'}
          result={training}
          loading={loading}
        />

        {!showLogForm ? (
          <button
            className={styles.logBtn}
            onClick={() => setShowLogForm(true)}
          >
            + Logga träningspass
          </button>
        ) : (
          profile && (
            <SessionLogForm
              breed={profile.breed}
              weekNumber={weekNumber}
              onSaved={handleLogSaved}
            />
          )
        )}
      </div>
    </main>
  )
}
