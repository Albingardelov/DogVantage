'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useSubscription } from '@/lib/billing/subscription-context'
import styles from './FeatureGate.module.css'

type ProFeature = 'ai_chat' | 'multiple_dogs' | 'custom_exercises'

export function FeatureGate({ feature, children }: { feature: ProFeature; children: ReactNode }) {
  const { t } = useTranslation()
  const { state, isLoading } = useSubscription()

  if (isLoading) return null
  if (state.tier === 'pro' && state.isActive) return <>{children}</>

  return (
    <div className={styles.gate}>
      <h3>{t('billing.featureGateTitle', { feature: t(`billing.featureLabels.${feature}`) })}</h3>
      <p>{t('billing.proIncludes')}</p>
      <Link href="/profile?section=billing" className={styles.cta}>
        {t('billing.upgradeToPro')}
      </Link>
    </div>
  )
}
