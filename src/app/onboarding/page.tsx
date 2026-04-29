import DogProfileForm from '@/components/DogProfileForm'
import styles from './page.module.css'

export default function OnboardingPage() {
  return (
    <main className={styles.main}>
      <h1 className={styles.heading}>Berätta om din hund</h1>
      <p className={styles.sub}>Vi anpassar träningen efter ras och ålder.</p>
      <DogProfileForm />
    </main>
  )
}
