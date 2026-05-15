import { IconChevronRight, IconRestDay } from '@/components/icons'
import styles from './TrainingCard.module.css'

export function NextBanner({ label }: { label: string }) {
  return (
    <div className={styles.nextBanner} role="status" aria-live="polite">
      <span className={styles.nextBannerLabel}>Nästa</span>
      <span className={styles.nextBannerName}>{label}</span>
    </div>
  )
}

export function LoadingIndicator() {
  return (
    <div className={styles.loading} aria-live="polite">
      <span className={styles.spinner} />
      <span>Hämtar träningsplan…</span>
    </div>
  )
}

export function ReferralCard({ text }: { text: string }) {
  return (
    <div className={styles.referralCard} role="alert">
      <p className={styles.referralTitle}>Behöver professionell hjälp</p>
      <p className={styles.referralText}>{text}</p>
    </div>
  )
}

export function RestDay() {
  return (
    <div className={styles.restDay}>
      <IconRestDay size="xl" className={styles.restIcon} />
      <span className={styles.restTitle}>Vilodag idag</span>
      <span className={styles.restSub}>Vila och återhämtning — bra jobbat i veckan!</span>
    </div>
  )
}

export function ChevronRight() {
  return <IconChevronRight size="sm" />
}
