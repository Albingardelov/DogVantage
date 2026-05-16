'use client'

import { IconDog, LandingFeatureIcon, type LandingFeatureId } from '@/components/icons'
import styles from '@/app/page.module.css'

const FEATURES: { id: LandingFeatureId; title: string; desc: string }[] = [
  {
    id: 'swedish-standards',
    title: 'Byggd på svenska rasstandarder',
    desc: 'Varje träningsplan utgår från RAS-dokument och rasspecifika krav från SKK och rasklubbarna. Din labrador tränas som en labrador — apportering, vattenarbete, stadga — inte med generiska tips som passar alla hundar lika dåligt.',
  },
  {
    id: 'adaptive-ai',
    title: 'En plan som lär sig din hund',
    desc: 'Logga dina träningspass så anpassas nästa veckas schema efter vad som faktiskt fungerar. Svårighetsgrad, övningsval och tempo justeras automatiskt — du följer inte en förinspelad kurs, du får en plan som utvecklas med er.',
  },
  {
    id: 'safety',
    title: 'Tränar med omtanke',
    desc: 'Appen känner igen tecken på hälsoproblem och beteendekriser och hänvisar dig vidare till veterinär eller utbildad beteendekonsult när det behövs. Reaktiva hundar tränas under tröskeln med LAT-metodik — aldrig tvångsexponering.',
  },
]

export function LandingHeroDecor() {
  return (
    <>
      <div className={styles.decorCircleLg} aria-hidden="true" />
      <div className={styles.decorCircleSm} aria-hidden="true" />
      <div className={styles.heroPhoto} aria-hidden="true">
        <IconDog size="hero" color="#fff" />
      </div>
    </>
  )
}

export function LandingFeatureList() {
  return (
    <ul className={styles.features}>
      {FEATURES.map((f) => (
        <li key={f.title} className={styles.featureRow}>
          <span className={styles.featureIcon}>
            <LandingFeatureIcon id={f.id} size="lg" />
          </span>
          <div className={styles.featureText}>
            <span className={styles.featureTitle}>{f.title}</span>
            <span className={styles.featureDesc}>{f.desc}</span>
          </div>
        </li>
      ))}
    </ul>
  )
}
