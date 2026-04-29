'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import ProfileGuard from '@/components/ProfileGuard'
import ChatInterface from '@/components/ChatInterface'
import Avatar from '@/components/Avatar'
import BottomNav from '@/components/BottomNav'
import { getDogProfile } from '@/lib/dog/profile'
import { getAgeInWeeks } from '@/lib/dog/age'
import type { DogProfile } from '@/types'
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
    setProfile(getDogProfile())
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
        />
      )}

      <BottomNav active="chat" />
    </main>
  )
}
