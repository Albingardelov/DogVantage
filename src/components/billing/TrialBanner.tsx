'use client'

import Link from 'next/link'
import styles from './TrialBanner.module.css'

export function TrialBanner({ daysLeft }: { daysLeft: number }) {
  if (daysLeft <= 0) return null
  return (
    <div className={styles.banner}>
      <span>
        🐾 <strong>{daysLeft}</strong> {daysLeft === 1 ? 'dag' : 'dagar'} kvar av Pro-trial
      </span>
      <Link href="/profile?section=billing" className={styles.cta}>
        Välj plan
      </Link>
    </div>
  )
}
