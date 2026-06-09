'use client'

// BRAND-ALIGNED ZoneCheckIn — fix (3): emoji → ditt ikonbibliotek.
// Återanvänder Phosphor-ikonerna via DvIcon (samma mönster som StreakBadge /
// RatingIcon). Färg per zon sätts via currentColor på .zoneIcon-spannen.

import { Smiley, SmileyMeh, SmileySad } from '@phosphor-icons/react'
import { DvIcon } from '@/components/icons'
import type { PuppyZone } from '@/lib/training/puppy-zone'
import styles from './PuppyDayCard.module.css'

interface Props {
  dogName: string
  onSelect: (zone: PuppyZone) => void
}

const ZONES: {
  zone: PuppyZone
  icon: typeof Smiley
  color: string
  label: string
  desc: string
  cls: string
}[] = [
  { zone: 'green',  icon: Smiley,    color: 'var(--color-primary)', label: 'Grön',  desc: 'Reglerbar, tar kontakt, nyfiken', cls: styles.zoneBtnGreen },
  { zone: 'yellow', icon: SmileyMeh, color: '#c8742f',              label: 'Gul',   desc: 'Lite stissig eller övertrött',    cls: styles.zoneBtnYellow },
  { zone: 'red',    icon: SmileySad, color: 'var(--color-error)',   label: 'Röd',   desc: 'Kaos — svårt att reglera',        cls: styles.zoneBtnRed },
]

export default function ZoneCheckIn({ dogName, onSelect }: Props) {
  return (
    <div className={styles.checkIn}>
      <p className={styles.checkInQ}>Hur är {dogName} idag?</p>
      <p className={styles.checkInLead}>Vi anpassar passet efter dagsformen.</p>
      <div className={styles.zones}>
        {ZONES.map(({ zone, icon, color, label, desc, cls }) => (
          <button
            key={zone}
            type="button"
            className={`${styles.zoneBtn} ${cls}`}
            onClick={() => onSelect(zone)}
          >
            <span className={styles.zoneIcon} style={{ color }}>
              <DvIcon icon={icon} size="lg" weight="fill" />
            </span>
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
