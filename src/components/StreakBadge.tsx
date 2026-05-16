'use client'

import { Fire } from '@phosphor-icons/react'
import { DvIcon } from '@/components/icons'
import styles from './StreakBadge.module.css'

export default function StreakBadge({ streak }: { streak: number | null }) {
  return (
    <span className={styles.badge} aria-live="polite">
      <DvIcon icon={Fire} size="sm" weight="fill" className={styles.icon} />
      {streak === null ? 'Laddar streak...' : `${streak} dagar i rad`}
    </span>
  )
}
