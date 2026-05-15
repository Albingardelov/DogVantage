import Link from 'next/link'
import { redirect } from 'next/navigation'
import { LandingFeatureList, LandingHeroDecor } from '@/components/landing/LandingMarketing'
import { createSupabaseServer } from '@/lib/supabase/server'
import styles from './page.module.css'

export default async function LandingPage() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  return (
    <main className={styles.main}>
      <section className={styles.hero}>
        <LandingHeroDecor />

        <h1 className={styles.title}>DogVantage</h1>
        <p className={styles.tagline}>
          Träningsplan anpassad för din hund — baserad på rasklubbens egna dokument.
        </p>
      </section>

      <LandingFeatureList />

      <div className={styles.actions}>
        <Link href="/onboarding" className={styles.btnPrimary}>
          Kom igång
        </Link>
        <Link href="/login" className={styles.btnGhost}>
          Logga in
        </Link>
      </div>
    </main>
  )
}
