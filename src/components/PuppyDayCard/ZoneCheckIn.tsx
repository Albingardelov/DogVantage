'use client'

import type { PuppyZone } from '@/lib/training/puppy-zone'
import styles from './PuppyDayCard.module.css'

interface Props {
  dogName: string
  onSelect: (zone: PuppyZone) => void
}

const ZONES: { zone: PuppyZone; emoji: string; label: string; desc: string; cls: string }[] = [
  { zone: 'green',  emoji: '🟢', label: 'Grön',  desc: 'Reglerbar, tar kontakt, nyfiken', cls: styles.zoneBtnGreen },
  { zone: 'yellow', emoji: '🟡', label: 'Gul',   desc: 'Lite stissig eller övertrött',    cls: styles.zoneBtnYellow },
  { zone: 'red',    emoji: '🔴', label: 'Röd',   desc: 'Kaos — svårt att reglera',        cls: styles.zoneBtnRed },
]

export default function ZoneCheckIn({ dogName, onSelect }: Props) {
  return (
    <div className={styles.checkIn}>
      <p className={styles.checkInQ}>Hur är {dogName} idag?</p>
      <div className={styles.zones}>
        {ZONES.map(({ zone, emoji, label, desc, cls }) => (
          <button
            key={zone}
            type="button"
            className={`${styles.zoneBtn} ${cls}`}
            onClick={() => onSelect(zone)}
          >
            <span className={styles.zoneEmoji} aria-hidden="true">{emoji}</span>
            <span className={styles.zoneBtnText}>
              <span className={styles.zoneLabel}>{label}</span>
              <span className={styles.zoneDesc}>{desc}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
