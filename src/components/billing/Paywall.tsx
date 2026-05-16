'use client'

import { useState } from 'react'
import styles from './Paywall.module.css'

async function startCheckout(tier: 'basic' | 'pro'): Promise<string> {
  const res = await fetch('/api/billing/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tier }),
  })
  const payload = await res.json() as { url?: string; error?: string }
  if (!res.ok || !payload.url) {
    throw new Error(payload.error ?? 'Kunde inte starta checkout')
  }
  return payload.url
}

export function Paywall() {
  const [loading, setLoading] = useState<'basic' | 'pro' | null>(null)

  async function handleCheckout(tier: 'basic' | 'pro') {
    setLoading(tier)
    try {
      const url = await startCheckout(tier)
      window.location.href = url
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Kunde inte starta checkout'
      alert(message)
      setLoading(null)
    }
  }

  return (
    <main className={styles.main}>
      <section className={styles.hero}>
        <h1>Starta DogVantage</h1>
        <p>Välj en plan för att fortsätta med veckoplan, loggning och personlig träning.</p>
      </section>

      <section className={styles.cards}>
        <article className={styles.card}>
          <h2>Basic</h2>
          <p className={styles.price}>39 kr/mån</p>
          <ul>
            <li>Veckoplan</li>
            <li>Logg & kalender</li>
            <li>Lär-bibliotek</li>
          </ul>
          <button type="button" onClick={() => handleCheckout('basic')} disabled={loading !== null}>
            {loading === 'basic' ? 'Öppnar checkout…' : 'Starta Basic 39 kr'}
          </button>
        </article>

        <article className={`${styles.card} ${styles.cardPro}`}>
          <h2>Pro</h2>
          <p className={styles.price}>79 kr/mån</p>
          <ul>
            <li>Allt i Basic</li>
            <li>AI-chat</li>
            <li>Flera hundar</li>
            <li>Egna AI-övningar</li>
          </ul>
          <button type="button" onClick={() => handleCheckout('pro')} disabled={loading !== null}>
            {loading === 'pro' ? 'Öppnar checkout…' : 'Starta Pro 79 kr'}
          </button>
        </article>
      </section>
    </main>
  )
}
