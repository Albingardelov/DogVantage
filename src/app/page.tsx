import Link from 'next/link'
import styles from './page.module.css'

export default function LandingPage() {
  return (
    <main className={styles.main}>
      <div className={styles.hero}>
        <h1 className={styles.title}>DogVantage</h1>
        <p className={styles.tagline}>
          Träningsplan anpassad för din hunds ras och ålder —
          baserad på rasklubbens egna dokument.
        </p>
      </div>

      <ul className={styles.features}>
        <li>Veckovis träningsschema utifrån valpdagar</li>
        <li>Råd hämtade direkt från RAS-dokument</li>
        <li>Anpassas efter dina träningspass</li>
      </ul>

      <div className={styles.actions}>
        <Link href="/onboarding" className={styles.btnPrimary}>
          Kom igång
        </Link>
        <Link href="/dashboard" className={styles.btnSecondary}>
          Öppna appen
        </Link>
      </div>
    </main>
  )
}
