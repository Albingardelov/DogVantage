'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ProfileGuard from '@/components/ProfileGuard'
import TrainingCard from '@/components/TrainingCard/TrainingCard'
import SessionLogForm from '@/components/SessionLogForm'
import Avatar from '@/components/Avatar'
import BottomNav from '@/components/BottomNav'
import { getDogProfile } from '@/lib/dog/profile'
import { getAgeInWeeks } from '@/lib/dog/age'
import { formatBehaviorProfile } from '@/lib/dog/behavior'
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
  const router = useRouter()
  const [profile, setProfile] = useState<DogProfile | null>(null)
  const [showLogForm, setShowLogForm] = useState(false)

  const ageWeeks = profile ? Math.max(1, getAgeInWeeks(profile.birthdate)) : 0
  const trainingWeek = profile?.trainingWeek ?? 1

  useEffect(() => {
    const p = getDogProfile()
    if (p) setProfile(p)
  }, [])

  function handleLogSaved() {
    setShowLogForm(false)
  }

  const dogName = profile?.name ?? '…'
  const needsAssessment = Boolean(profile) && (profile?.assessment?.status ?? 'not_started') !== 'completed' && ageWeeks >= 26

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div className={styles.decorCircle} aria-hidden="true" />
        <div className={styles.headerContent}>
          <div className={styles.headerText}>
            <span className={styles.greeting}>{getGreeting()}</span>
            <h1 className={styles.dogName}>{dogName}</h1>
            <span className={styles.weekBadge}>
              <span aria-hidden="true">🗓️</span> Programvecka {trainingWeek}
            </span>
          </div>
          <button
            type="button"
            onClick={() => router.push('/profile')}
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', borderRadius: '50%' }}
            aria-label="Öppna profil"
          >
            <Avatar name={dogName} size={64} />
          </button>
        </div>
      </header>

      <div className={styles.scrollArea}>
        {needsAssessment && (
          <button
            className={styles.logCta}
            onClick={() => (window.location.href = '/assessment')}
            type="button"
          >
            <span aria-hidden="true">🧪</span>
            <span>Gör snabb screening (10–12 min)</span>
          </button>
        )}
        {profile && (
          <TrainingCard
            trainingWeek={trainingWeek}
            ageWeeks={ageWeeks}
            breed={profile.breed}
            dogName={dogName}
            dogKey={profile.dogKey ?? 'default'}
            goals={profile.onboarding?.goals}
            environment={profile.onboarding?.environment}
            rewardPreference={profile.onboarding?.rewardPreference}
            takesRewardsOutdoors={profile.onboarding?.takesRewardsOutdoors}
            behaviorContext={profile.assessment?.behaviorProfile
              ? formatBehaviorProfile(profile.assessment.behaviorProfile)
              : undefined}
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
              weekNumber={trainingWeek}
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
