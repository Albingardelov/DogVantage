'use client'

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
        <span className={styles.week}>Vecka {weekNumber}</span>
        <h2 className={styles.name}>{dogName}</h2>
      </header>

      {loading && (
        <div className={styles.loading} aria-live="polite">
          <span className={styles.spinner} />
          <span>Hämtar träningsplan…</span>
        </div>
      )}

      {!loading && result && (
        <div className={styles.body}>
          <p className={styles.content}>{result.content}</p>
          {result.source && (
            <footer className={styles.source}>
              <span>Källa: {result.source}</span>
              {result.source_url && (
                <a
                  href={result.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.sourceLink}
                >
                  Läs originalet
                </a>
              )}
            </footer>
          )}
        </div>
      )}

      {!loading && !result && (
        <p className={styles.empty}>Ingen träningsplan tillgänglig ännu.</p>
      )}
    </section>
  )
}
