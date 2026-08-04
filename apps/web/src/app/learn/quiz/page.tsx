'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import ProfileGuard from '@/components/ProfileGuard'
import BottomNav from '@/components/BottomNav'
import QuizSheet from '@/components/QuizSheet'
import { useActiveDog } from '@/lib/dog/active-dog-context'
import styles from '../../page.module.css'

export default function QuizPage() {
  return (
    <ProfileGuard>
      <Suspense>
        <Quiz />
      </Suspense>
    </ProfileGuard>
  )
}

function Quiz() {
  const { activeDog } = useActiveDog()
  const params = useSearchParams()
  const dogId = activeDog?.id
  const contextKey = params.get('contextKey') ?? ''
  const title = params.get('title') ?? 'Lektion'
  const body = params.get('body') ?? ''
  const exerciseId = params.get('exerciseId') ?? undefined

  if (!dogId || !contextKey) {
    return (
      <main className={styles.main}>
        <p className={styles.subtitle}>Ogiltig quiz för quiz.</p>
        <BottomNav active="learn" />
      </main>
    )
  }

  return (
    <QuizSheet
      dogId={dogId}
      contextKey={contextKey}
      title={title}
      body={body}
      exerciseId={exerciseId || undefined}
      onClose={() => { window.history.back() }}
    />
  )
}
