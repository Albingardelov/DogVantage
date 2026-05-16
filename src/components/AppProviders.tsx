'use client'

import { SubscriptionProvider } from '@/lib/billing/subscription-context'

export default function AppProviders({ children }: { children: React.ReactNode }) {
  return <SubscriptionProvider>{children}</SubscriptionProvider>
}
