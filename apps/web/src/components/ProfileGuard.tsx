'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { getSupabaseBrowser } from '@/lib/supabase/browser'
import { ActiveDogProvider, useActiveDog } from '@/lib/dog/active-dog-context'
import { useSubscription } from '@/lib/billing/subscription-context'
import { TrialBanner } from '@/components/billing/TrialBanner'
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
  const pathname = usePathname()
  const { activeDog, isLoading } = useActiveDog()
  const { state, isLoading: billingLoading } = useSubscription()
  const basicGated = pathname === '/dashboard' || pathname === '/log' || pathname === '/calendar' || pathname === '/learn' || pathname === '/chat'

  useEffect(() => {
    if (!isLoading && !activeDog) {
      router.replace('/onboarding')
    }
  }, [isLoading, activeDog, router])

  useEffect(() => {
    if (!billingLoading && basicGated && !state.isActive) {
      router.replace('/paywall')
    }
  }, [billingLoading, basicGated, state.isActive, router])

  if (isLoading || billingLoading || (basicGated && !state.isActive)) {
    return (
      <div className={styles.loader} aria-label="Laddar…">
        <span className={styles.spinner} />
      </div>
    )
  }

  if (!activeDog) return null

  return (
    <>
      {state.isOnTrial && state.trialDaysLeft <= 7 && state.trialDaysLeft > 0 && (
        <TrialBanner daysLeft={state.trialDaysLeft} />
      )}
      {children}
    </>
  )
}
