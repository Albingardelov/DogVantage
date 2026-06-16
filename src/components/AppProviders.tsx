'use client'

import { SubscriptionProvider } from '@/lib/billing/subscription-context'
import I18nProvider from '@/i18n/I18nProvider'

export default function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <SubscriptionProvider>{children}</SubscriptionProvider>
    </I18nProvider>
  )
}
