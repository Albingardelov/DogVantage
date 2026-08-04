'use client'

import { useState } from 'react'
import { useSubscription } from '@/lib/billing/subscription-context'
import styles from './ManageSubscription.module.css'

export function ManageSubscription() {
  const { state } = useSubscription()
  const [loading, setLoading] = useState(false)

  async function openPortal() {
    setLoading(true)
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' })
      const payload = await res.json() as { url?: string; error?: string }
      if (!res.ok || !payload.url) {
        alert(`Kunde inte öppna portalen: ${payload.error ?? 'okänt fel'}`)
        return
      }
      window.location.href = payload.url
    } catch (err) {
      alert('Kunde inte öppna portalen just nu')
      console.error('[manage-subscription]', err)
    } finally {
      setLoading(false)
    }
  }

  if (!state.isActive) return null
  if (state.tier === 'free') return null
  if (!state.stripeSubscriptionId && state.status === 'trialing') return null

  return (
    <section className={styles.section}>
      <h3>Hantera prenumeration</h3>
      <p>
        <strong>{state.tier === 'pro' ? 'Pro' : 'Basic'}</strong>
        {state.cancelAtPeriodEnd && state.currentPeriodEnd && (
          <> — avslutas {new Date(state.currentPeriodEnd).toLocaleDateString('sv-SE')}</>
        )}
      </p>
      <button type="button" onClick={openPortal} className={styles.button} disabled={loading}>
        {loading ? 'Öppnar portal…' : 'Hantera prenumeration'}
      </button>
      <p className={styles.hint}>Byt plan, uppdatera kort, se kvitton eller avsluta abonnemang.</p>
    </section>
  )
}
