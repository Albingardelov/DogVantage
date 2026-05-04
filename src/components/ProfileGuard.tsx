'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getDogProfile } from '@/lib/dog/profile'
import { getSupabaseBrowser } from '@/lib/supabase/browser'
import styles from './ProfileGuard.module.css'

export default function ProfileGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function run() {
      const { data: { session } } = await getSupabaseBrowser().auth.getSession()
      if (!session) {
        router.replace('/login')
        return
      }

      const profile = await getDogProfile()
      if (cancelled) return

      if (!profile) {
        router.replace('/onboarding')
        return
      }
      setReady(true)
    }

    run().catch((e) => {
      const msg = e instanceof Error ? e.message : String(e)
      console.error('[ProfileGuard]', msg)
      router.replace('/login')
    })

    return () => { cancelled = true }
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
