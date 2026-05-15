'use client'

import { IconDog, LandingFeatureIcon, type LandingFeatureId } from '@/components/icons'
import styles from '@/app/page.module.css'

const FEATURES: { id: LandingFeatureId; title: string; desc: string }[] = [
  {
    id: 'schedule',
    title: 'Veckovis schema',
    desc: 'Träning anpassad efter valpdagar och ras',
  },
  {
    id: 'breed-docs',
    title: 'Direkt från RAS',
    desc: 'Råd hämtade från rasklubbens officiella dokument',
  },
  {
    id: 'progress',
    title: 'Följ din hunds framsteg',
    desc: 'Logga pass och se hur träningen utvecklas',
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
