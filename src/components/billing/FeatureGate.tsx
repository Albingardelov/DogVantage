'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { useSubscription } from '@/lib/billing/subscription-context'
import styles from './FeatureGate.module.css'

type ProFeature = 'ai_chat' | 'multiple_dogs' | 'custom_exercises'

const LABELS: Record<ProFeature, string> = {
  ai_chat: 'AI-chatten',
  multiple_dogs: 'flera hundar',
  custom_exercises: 'egna övningar',
}

export function FeatureGate({ feature, children }: { feature: ProFeature; children: ReactNode }) {
  const { state, isLoading } = useSubscription()

  if (isLoading) return null
  if (state.tier === 'pro' && state.isActive) return <>{children}</>

  return (
    <div className={styles.gate}>
      <h3>Uppgradera till Pro för att låsa upp {LABELS[feature]}</h3>
      <p>Inkluderar AI-chat, flera hundar, egna AI-genererade övningar och specialprogram för reaktiva hundar.</p>
      <Link href="/profile?section=billing" className={styles.cta}>
        Uppgradera 79 kr/mån
      </Link>
    </div>
  )
}
