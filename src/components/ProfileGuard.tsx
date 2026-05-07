'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowser } from '@/lib/supabase/browser'
import { ActiveDogProvider, useActiveDog } from '@/lib/dog/active-dog-context'
import styles from './ProfileGuard.module.css'

export default function ProfileGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    getSupabaseBrowser().auth.getSession().then(({ data: { session } }) => {
      if (!session) router.replace('/login')
      else setAuthed(true)
    }).catch(() => router.replace('/login'))
  }, [router])

  if (!authed) {
    return (
      <div className={styles.loader} aria-label="Laddar…">
        <span className={styles.spinner} />
      </div>
    )
  }

  return (
    <ActiveDogProvider>
      <ProfileGuardInner>{children}</ProfileGuardInner>
    </ActiveDogProvider>
  )
}

function ProfileGuardInner({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { activeDog, isLoading } = useActiveDog()

  useEffect(() => {
    if (!isLoading && !activeDog) {
      router.replace('/onboarding')
    }
  }, [isLoading, activeDog, router])

  if (isLoading) {
    return (
      <div className={styles.loader} aria-label="Laddar…">
        <span className={styles.spinner} />
      </div>
    )
  }

  if (!activeDog) return null

  return <>{children}</>
}
