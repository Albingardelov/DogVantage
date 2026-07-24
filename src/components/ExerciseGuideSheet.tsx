'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getExerciseSpec } from '@/lib/training/exercise-specs'
import type { ExerciseSpec } from '@/lib/training/exercise-specs'
import { normalizeHandlerGuide } from '@/lib/training/normalize-handler-guide'
import type { DailyExerciseMetrics } from '@/types'
import { IconClose } from '@/components/icons'
import styles from './ExerciseGuideSheet.module.css'

const EXERCISE_ARTICLE: Record<string, { id: string; label: string }> = {
  namn:            { id: 'timing',          label: 'Timing' },
  fokus:           { id: 'timing',          label: 'Timing' },
  inkallning:      { id: 'basis-kommandon', label: 'Grundsignalerna' },
  stanna:          { id: 'basis-kommandon', label: 'Grundsignalerna' },
  koppel:          { id: 'basis-kommandon', label: 'Grundsignalerna' },
  fot:             { id: 'basis-kommandon', label: 'Grundsignalerna' },
  plats:           { id: 'basis-kommandon', label: 'Grundsignalerna' },
  sitt:            { id: 'criteria',        label: 'Kriterier' },
  ligg:            { id: 'criteria',        label: 'Kriterier' },
  socialisering:   { id: 'over-threshold',  label: 'Over threshold' },
  impulskontroll:  { id: 'over-threshold',  label: 'Over threshold' },
  stadga:          { id: 'over-threshold',  label: 'Over threshold' },
  hantering:       { id: 'stress-signals',  label: 'Stresssignaler' },
  nosework:        { id: 'generalization',  label: 'Generalisering' },
  apportering:     { id: 'reinforcement',   label: 'Förstärkning' },
}

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
  const [showVariants, setShowVariants] = useState(false)
  const spec = customSpecs?.[exerciseId] ?? getExerciseSpec(exerciseId)
  const guide = useMemo(
    () =>
      spec?.guide
        ? normalizeHandlerGuide(spec.guide, {
            definition: spec.definition,
            troubleshooting: spec.troubleshooting,
          })
        : null,
    [spec?.definition, spec?.guide, spec?.troubleshooting],
  )

  const coachQuestion = useMemo(() => {
    const label = exerciseLabel ?? prettyLabel(exerciseId)
    const attempts = (metrics?.success_count ?? 0) + (metrics?.fail_count ?? 0)
    const rate = attempts > 0 ? Math.round(((metrics?.success_count ?? 0) / attempts) * 100) : null
    const levelLabel = spec?.ladder.find((r) => r.id === metrics?.criteria_level_id)?.label
    const bits = [
      `Jag tränar övningen "${label}".`,
      spec?.definition ? `Målet är: ${spec.definition}` : null,
      guide?.successLooksLike ? `Lyckad rep: ${guide.successLooksLike}` : null,
      levelLabel ? `Kriterienivå: ${levelLabel}.` : null,
      rate != null ? `Resultat idag: ${rate}% (${metrics?.success_count ?? 0}/${attempts}).` : null,
      metrics?.latency_bucket
        ? `Svarstid: ${
            ({ lt1s: 'under 1 sek', '1to3s': '1–3 sek', gt3s: 'över 3 sek' } as const)[
              metrics.latency_bucket
            ]
          }.`
        : null,
      'Ge mig en konkret plan för nästa 5 försök: setup, exakt timing för belöning, och när jag ska sänka/höja kriteriet.',
    ].filter(Boolean)
    return bits.join(' ')
  }, [exerciseId, exerciseLabel, guide?.successLooksLike, metrics, spec?.definition, spec?.ladder])

  if (!spec) return null

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Övningsguide">
      <div className={styles.sheet}>
        <div className={styles.header}>
          <div>
            <div className={styles.title}>{exerciseLabel ?? prettyLabel(exerciseId)}</div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Stäng">
            <IconClose size="md" />
          </button>
        </div>

        {guide ? (
          <>
            <div className={styles.summary}>{guide.todaySummary}</div>
            <Section title="Setup" items={guide.setup} />
            <section className={styles.section}>
              <div className={styles.sectionTitle}>Gör så här</div>
              <ol className={styles.steps}>
                {guide.steps.map((step) => (
                  <li key={step.how}>
                    <div className={styles.stepHow}>{step.how}</div>
                    {step.why ? <div className={styles.stepWhy}>{step.why}</div> : null}
                  </li>
                ))}
              </ol>
            </section>
            <section className={styles.section}>
              <div className={styles.sectionTitle}>Så vet du att det funkar</div>
              <p className={styles.successText}>{guide.successLooksLike}</p>
            </section>
            <Section title="Om det inte funkar" items={guide.whenItFails} />
            <Section title="Avsluta" items={guide.wrapUp} />
            {guide.variants && guide.variants.length > 0 && (
              <>
                <button
                  type="button"
                  className={styles.variantsToggle}
                  onClick={() => setShowVariants((v) => !v)}
                  aria-expanded={showVariants}
                >
                  Det går inte
                </button>
                {showVariants && (
                  <div className={styles.variantsPanel}>
                    {guide.variants.map((variant) => (
                      <div key={variant.id} className={styles.variantCard}>
                        <div className={styles.variantLabel}>{variant.label}</div>
                        {variant.whenToUse ? (
                          <p className={styles.variantWhen}>{variant.whenToUse}</p>
                        ) : null}
                        {variant.how.length > 0 && (
                          <ul className={styles.list}>
                            {variant.how.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        )}
                        {variant.why ? <p className={styles.variantWhy}>{variant.why}</p> : null}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          <div className={styles.summary}>
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
          {EXERCISE_ARTICLE[exerciseId] && (
            <button
              type="button"
              className={styles.secondary}
              onClick={() => router.push(`/learn?article=${EXERCISE_ARTICLE[exerciseId].id}`)}
            >
              Läs om {EXERCISE_ARTICLE[exerciseId].label}
            </button>
          )}
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
    fot: 'Fot (fotsteg)',
    plats: 'Plats (matta)',
  }
  return map[id] ?? id
}
