'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getDogProfile } from '@/lib/dog/profile'
import styles from './ProfileGuard.module.css'

export default function ProfileGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const profile = getDogProfile()
    if (!profile) {
      router.replace('/onboarding')
    } else {
      setReady(true)
    }
  }, [router])

  if (!ready) {
    return (
      <div className={styles.loader} aria-label="Laddar…">
        <span className={styles.spinner} />
      </div>
    )
  }

  return <>{children}</>
}
