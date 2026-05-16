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

        <h1 className={styles.title}>Träning byggd för din hunds ras — inte för "hund" i allmänhet</h1>
        <p className={styles.tagline}>
          DogVantage skapar ett veckoschema utifrån rasprofiler och svenska rasstandarder där källdokument finns, och anpassar det efter hur din hund faktiskt utvecklas.
        </p>
      </section>

      <LandingFeatureList />

      <div className={styles.actions}>
        <p className={styles.ctaLead}>Kom igång gratis i 14 dagar — ingen betalning krävs.</p>
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
