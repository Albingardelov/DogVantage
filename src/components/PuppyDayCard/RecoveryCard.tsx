import { getRecoveryTips } from '@/lib/training/puppy-zone'
import styles from './PuppyDayCard.module.css'

export default function RecoveryCard() {
  return (
    <div className={styles.recovery}>
      <div className={styles.recoveryHeader}>
        <span className={styles.zoneDot} style={{ background: '#ef4444' }} aria-hidden="true" />
        <span className={styles.recoveryTitle}>Röd dag — bara återhämtning idag</span>
      </div>
      <p className={styles.recoveryDesc}>Inga träningskrav. Låt hjärnan vila.</p>
      <ul className={styles.tipList}>
        {getRecoveryTips().map((tip) => (
          <li key={tip} className={styles.tipItem}>{tip}</li>
        ))}
      </ul>
    </div>
  )
}
