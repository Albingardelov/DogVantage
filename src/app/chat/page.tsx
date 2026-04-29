'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import ProfileGuard from '@/components/ProfileGuard'
import ChatInterface from '@/components/ChatInterface'
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

  useEffect(() => {
    setProfile(getDogProfile())
  }, [])

  const weekNumber = profile ? getAgeInWeeks(profile.birthdate) : 0

  return (
    <main className={styles.main}>
      <header className={styles.topBar}>
        <Link href="/dashboard" className={styles.back}>← Tillbaka</Link>
        <span className={styles.title}>
          {profile ? `${profile.name} · vecka ${weekNumber}` : 'Chatt'}
        </span>
      </header>

      {profile && (
        <ChatInterface breed={profile.breed} weekNumber={weekNumber} />
      )}
    </main>
  )
}
