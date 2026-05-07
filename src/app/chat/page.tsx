'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import ProfileGuard from '@/components/ProfileGuard'
import ChatInterface from '@/components/ChatInterface'
import Avatar from '@/components/Avatar'
import BottomNav from '@/components/BottomNav'
import { getDogProfile } from '@/lib/dog/profile'
import { getAgeInWeeks } from '@/lib/dog/age'
import { buildBehaviorContext } from '@/lib/dog/behavior'
import type { DogProfile, TrainingEnvironment, RewardPreference } from '@/types'

const ENV_LABELS: Record<TrainingEnvironment, string> = {
  city:   'Stad (mycket folk och hundar)',
  suburb: 'Förort / blandat',
  rural:  'Land / natur',
}

const REWARD_LABELS: Record<RewardPreference, string> = {
  food:   'Mat',
  toy:    'Leksak',
  social: 'Socialt (beröm/lek)',
  mixed:  'Blandat',
}

function buildOnboardingContext(profile: DogProfile): string | undefined {
  const prefs = profile.onboarding
  const lines: string[] = []
  if (prefs?.environment) lines.push(`Miljö: ${ENV_LABELS[prefs.environment] ?? prefs.environment}`)
  if (prefs?.rewardPreference) lines.push(`Belöning som funkar bäst: ${REWARD_LABELS[prefs.rewardPreference] ?? prefs.rewardPreference}`)
  if (prefs?.takesRewardsOutdoors != null) {
    lines.push(`Tar belöning utomhus: ${prefs.takesRewardsOutdoors ? 'Ja' : 'Nej — prioritera inne-träning eller extra hög-värde belöning ute'}`)
  }
  const behaviorContext = buildBehaviorContext(profile)
  if (behaviorContext) {
    lines.push('')
    lines.push(behaviorContext)
  }
  return lines.length > 0 ? lines.join('\n') : undefined
}
import styles from './page.module.css'

export default function ChatPage() {
  return (
    <ProfileGuard>
      <Chat />
    </ProfileGuard>
  )
}

function Chat() {
  const [profile, setProfile] = useState<DogProfile | null>(null)
  const searchParams = useSearchParams()
  const initialQuestion = searchParams.get('question') ?? undefined

  useEffect(() => {
    let alive = true
    ;(async () => {
      const p = await getDogProfile()
      if (alive) setProfile(p)
    })().catch((e) => console.error('[chat getDogProfile]', e))
    return () => { alive = false }
  }, [])

  const ageWeeks = profile ? Math.max(1, getAgeInWeeks(profile.birthdate)) : 0
  const trainingWeek = profile?.trainingWeek ?? 1
  const dogName = profile?.name ?? 'din hund'

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <Avatar name={dogName} size={36} bordered={false} />
        <div className={styles.headerText}>
          <span className={styles.title}>Träningsassistenten</span>
          <span className={styles.status}>● Online</span>
        </div>
      </header>

      {profile && (
        <ChatInterface
          breed={profile.breed}
          ageWeeks={ageWeeks}
          trainingWeek={trainingWeek}
          initialQuestion={initialQuestion}
          dogId={profile.id}
          onboardingContext={buildOnboardingContext(profile)}
        />
      )}

      <BottomNav active="chat" />
    </main>
  )
}
