import Link from 'next/link'
import styles from './page.module.css'

const FEATURES: { icon: string; title: string; desc: string }[] = [
  {
    icon: '📅',
    title: 'Veckovis schema',
    desc: 'Träning anpassad efter valpdagar och ras',
  },
  {
    icon: '📖',
    title: 'Direkt från RAS',
    desc: 'Råd hämtade från rasklubbens officiella dokument',
  },
  {
    icon: '✍️',
    title: 'Följ din hunds framsteg',
    desc: 'Logga pass och se hur träningen utvecklas',
  },
]

export default function LandingPage() {
  return (
    <main className={styles.main}>
      <section className={styles.hero}>
        <div className={styles.decorCircleLg} aria-hidden="true" />
        <div className={styles.decorCircleSm} aria-hidden="true" />

        <div className={styles.heroPhoto} aria-hidden="true">🐕</div>

        <h1 className={styles.title}>DogVantage</h1>
        <p className={styles.tagline}>
          Träningsplan anpassad för din hund — baserad på rasklubbens egna dokument.
        </p>
      </section>

      <ul className={styles.features}>
        {FEATURES.map((f) => (
          <li key={f.title} className={styles.featureRow}>
            <span className={styles.featureIcon} aria-hidden="true">{f.icon}</span>
            <div className={styles.featureText}>
              <span className={styles.featureTitle}>{f.title}</span>
              <span className={styles.featureDesc}>{f.desc}</span>
            </div>
          </li>
        ))}
      </ul>

      <div className={styles.actions}>
        <Link href="/onboarding" className={styles.btnPrimary}>
          Kom igång
        </Link>
        <Link href="/dashboard" className={styles.btnGhost}>
          Jag har redan ett konto
        </Link>
      </div>
    </main>
  )
}
