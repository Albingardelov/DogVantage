'use client'

import { useSearchParams } from 'next/navigation'
import ProfileGuard from '@/components/ProfileGuard'
import ChatInterface from '@/components/ChatInterface'
import { FeatureGate } from '@/components/billing/FeatureGate'
import Avatar from '@/components/Avatar'
import BottomNav from '@/components/BottomNav'
import { useActiveDog } from '@/lib/dog/active-dog-context'
import styles from './page.module.css'

export default function ChatPage() {
  return (
    <ProfileGuard>
      <Chat />
    </ProfileGuard>
  )
}

function Chat() {
  const { activeDog: profile } = useActiveDog()
  const searchParams = useSearchParams()
  const initialQuestion = searchParams.get('question') ?? undefined

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

      {profile?.id && (
        <FeatureGate feature="ai_chat">
          <ChatInterface
            trainingWeek={trainingWeek}
            initialQuestion={initialQuestion}
            dogId={profile.id}
          />
        </FeatureGate>
      )}

      <BottomNav active="chat" />
    </main>
  )
}
