import DogProfileForm from '@/components/DogProfileForm'
import styles from './page.module.css'

export default function OnboardingPage() {
  return (
    <main className={styles.main}>
      <DogProfileForm />
    </main>
  )
}
