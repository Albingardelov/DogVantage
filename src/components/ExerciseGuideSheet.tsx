'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { getExerciseSpec } from '@/lib/training/exercise-specs'
import type { ExerciseSpec } from '@/lib/training/exercise-specs'
import type { DailyExerciseMetrics } from '@/types'
import styles from './ExerciseGuideSheet.module.css'

export default function ExerciseGuideSheet({
  exerciseId,
  exerciseLabel,
  onClose,
  metrics,
  customSpecs,
}: {
  exerciseId: string
  exerciseLabel?: string
  metrics?: DailyExerciseMetrics | null
  onClose: () => void
  customSpecs?: Record<string, ExerciseSpec>
}) {
  const router = useRouter()
  const spec = customSpecs?.[exerciseId] ?? getExerciseSpec(exerciseId)

  const coachQuestion = useMemo(() => {
    const attempts = (metrics?.success_count ?? 0) + (metrics?.fail_count ?? 0)
    const rate = attempts > 0 ? Math.round(((metrics?.success_count ?? 0) / attempts) * 100) : null
    const bits = [
      `Jag tränar övningen "${exerciseId}".`,
      spec?.definition ? `Målet är: ${spec.definition}` : null,
      metrics?.criteria_level_id ? `Kriterienivå: ${metrics.criteria_level_id}.` : null,
      rate != null ? `Resultat idag: ${rate}% (${metrics?.success_count ?? 0}/${attempts}).` : null,
      metrics?.latency_bucket ? `Latens: ${metrics.latency_bucket}.` : null,
      'Ge mig en konkret plan för nästa 5 försök: setup, exakt timing för belöning, och när jag ska sänka/höja kriteriet.',
    ].filter(Boolean)
    return bits.join(' ')
  }, [exerciseId, metrics, spec?.definition])

  if (!spec) return null

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Övningsguide">
      <div className={styles.sheet}>
        <div className={styles.header}>
          <div>
            <div className={styles.title}>{exerciseLabel ?? prettyLabel(exerciseId)}</div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Stäng">
            ✕
          </button>
        </div>

        <div className={styles.definition}>
          <strong>Lyckad rep:</strong> {spec.definition}
        </div>

        {spec.guide && (
          <>
            <Section title="Setup" items={spec.guide.setup} />
            <Section title="Steg-för-steg (förare)" items={spec.guide.steps} />
            <Section title="Hur du loggar i appen" items={spec.guide.logging} />
            <Section title="Vanliga fel" items={spec.guide.commonMistakes} />
            <Section title="Stop-regler" items={spec.guide.stopRules} />
          </>
        )}

        {!spec.guide && (
          <div className={styles.definition}>
            Den här övningen saknar ännu en full guide. Använd definitionen + troubleshooting och tryck “Förklara mer”.
          </div>
        )}

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.primary}
            onClick={() => router.push(`/chat?question=${encodeURIComponent(coachQuestion)}`)}
          >
            Förklara mer (fråga assistenten)
          </button>
          <button type="button" className={styles.secondary} onClick={onClose}>
            Tillbaka
          </button>
        </div>
      </div>
    </div>
  )
}

function Section({ title, items }: { title: string; items: string[] }) {
  if (!items?.length) return null
  return (
    <section className={styles.section}>
      <div className={styles.sectionTitle}>{title}</div>
      <ul className={styles.list}>
        {items.map((t) => <li key={t}>{t}</li>)}
      </ul>
    </section>
  )
}

function prettyLabel(id: string): string {
  const map: Record<string, string> = {
    namn: 'Namnkontakt',
    inkallning: 'Inkallning',
    koppel: 'Koppel',
    stanna: 'Stanna',
    sitt: 'Sitt',
    ligg: 'Ligg',
    stoppsignal: 'Stoppsignal',
    stadga: 'Stadga',
    orientering: 'Orientering',
    kontrollerat_sok: 'Kontrollerat sök',
    impulskontroll: 'Impulskontroll',
    hantering: 'Hantering',
  }
  return map[id] ?? id
}

