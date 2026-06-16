'use client'

import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { IconPaw } from '@/components/icons'
import styles from './TrialBanner.module.css'

export function TrialBanner({ daysLeft }: { daysLeft: number }) {
  const { t } = useTranslation()
  if (daysLeft <= 0) return null
  return (
    <div className={styles.banner}>
      <span>
        <IconPaw size="sm" /> {t('billing.trialDaysLeft', { count: daysLeft })}
      </span>
      <Link href="/profile?section=billing" className={styles.cta}>
        {t('billing.choosePlan')}
      </Link>
    </div>
  )
}
