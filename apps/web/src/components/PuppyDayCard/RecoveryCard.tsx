// BRAND-ALIGNED RecoveryCard — fix (3): röd prick → ikon ur ditt bibliotek,
// och paw-ikon framför varje återhämtningstips. Tokens via CSS-modulen.

import { SmileySad } from '@phosphor-icons/react'
import { DvIcon, IconPaw } from '@/components/icons'
import { getRecoveryTips } from '@dogvantage/core'
import styles from './PuppyDayCard.module.css'

export default function RecoveryCard() {
  return (
    <div className={styles.recovery}>
      <div className={styles.recoveryHeader}>
        <span style={{ color: 'var(--color-error)', display: 'inline-flex' }}>
          <DvIcon icon={SmileySad} size="lg" weight="fill" />
        </span>
        <span className={styles.recoveryTitle}>Röd dag — bara återhämtning idag</span>
      </div>
      <p className={styles.recoveryDesc}>Inga träningskrav. Låt hjärnan vila.</p>
      <ul className={styles.tipList}>
        {getRecoveryTips().map((tip) => (
          <li key={tip} className={styles.tipItem}>
            <span className={styles.tipIcon}>
              <IconPaw size="sm" />
            </span>
            <span>{tip}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
