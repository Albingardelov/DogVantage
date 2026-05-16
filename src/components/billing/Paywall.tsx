'use client'

import { useState } from 'react'
import styles from './Paywall.module.css'

async function startCheckout(tier: 'basic' | 'pro', interval: 'month' | 'year' = 'month'): Promise<string> {
  const res = await fetch('/api/billing/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tier, interval }),
  })
  const payload = await res.json() as { url?: string; error?: string }
  if (!res.ok || !payload.url) {
    throw new Error(payload.error ?? 'Kunde inte starta checkout')
  }
  return payload.url
}

export function Paywall() {
  const [loading, setLoading] = useState<'basic' | 'pro_month' | 'pro_year' | null>(null)

  async function handleCheckout(tier: 'basic' | 'pro', interval: 'month' | 'year' = 'month') {
    const actionKey = tier === 'basic' ? 'basic' : interval === 'year' ? 'pro_year' : 'pro_month'
    setLoading(actionKey)
    try {
      const url = await startCheckout(tier, interval)
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
          <p className={styles.priceAlt}>eller 599 kr/år (spara 37%)</p>
          <ul>
            <li>Allt i Basic</li>
            <li>AI-chat</li>
            <li>Flera hundar</li>
            <li>Egna AI-övningar</li>
          </ul>
          <button type="button" onClick={() => handleCheckout('pro', 'month')} disabled={loading !== null}>
            {loading === 'pro_month' ? 'Öppnar checkout…' : 'Starta Pro 79 kr/mån'}
          </button>
          <button type="button" className={styles.secondaryBtn} onClick={() => handleCheckout('pro', 'year')} disabled={loading !== null}>
            {loading === 'pro_year' ? 'Öppnar checkout…' : 'Starta Pro 599 kr/år'}
          </button>
        </article>
      </section>
    </main>
  )
}
