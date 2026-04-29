'use client'

import Link from 'next/link'
import styles from './TrainingCard.module.css'
import type { TrainingResult } from '@/types'

interface Props {
  weekNumber: number
  dogName: string
  result: TrainingResult | null
  loading: boolean
}

export default function TrainingCard({ weekNumber, dogName, result, loading }: Props) {
  return (
    <section className={styles.card}>
      <header className={styles.header}>
        <span className={styles.weekLabel}>Veckans träning</span>
        <span className={styles.badge}>RAS-baserat</span>
      </header>

      {loading && (
        <div className={styles.loading} aria-live="polite">
          <span className={styles.spinner} />
          <span>Hämtar träningsplan…</span>
        </div>
      )}

      {!loading && result && (
        <div className={styles.body}>
          <h3 className={styles.title}>
            Vecka {weekNumber} – Plan för {dogName}
          </h3>
          <p className={styles.content}>{result.content}</p>
          {result.source && (
            <p className={styles.source}>
              Källa: {result.source}
              {result.source_url && (
                <>
                  {' · '}
                  <a
                    href={result.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.sourceLink}
                  >
                    Läs originalet
                  </a>
                </>
              )}
            </p>
          )}
          <Link href="/chat" className={styles.askBtn}>
            <span>Fråga om träningen</span>
            <ChevronRight />
          </Link>
        </div>
      )}

      {!loading && !result && (
        <p className={styles.empty}>Ingen träningsplan tillgänglig ännu.</p>
      )}
    </section>
  )
}

function ChevronRight() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}
