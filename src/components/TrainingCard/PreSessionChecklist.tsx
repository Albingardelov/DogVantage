'use client'

import { useEffect, useState } from 'react'
import styles from './PreSessionChecklist.module.css'

function storageKey(dateKey: string): string {
  return `dv_pre_ready_${dateKey}`
}

function durationHint(ageWeeks: number): string {
  if (ageWeeks > 0 && ageWeeks < 16) {
    return 'Håll passet kort — ungefär 3–8 minuter räcker ofta för valpar.'
  }
  if (ageWeeks >= 16 && ageWeeks < 52) {
    return 'Planera gärna 8–12 minuter fokuserad träning; korta pass ofta slår långa.'
  }
  return 'Planera gärna 10–15 minuter; bryt gärna upp i kortare block om hunden tappar fokus.'
}

interface Props {
  ageWeeks: number
  dateKey: string
}

export default function PreSessionChecklist({ ageWeeks, dateKey }: Props) {
  const [ready, setReady] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    try {
      setDismissed(typeof window !== 'undefined' && localStorage.getItem(storageKey(dateKey)) === '1')
    } catch {
      setDismissed(false)
    }
    setReady(true)
  }, [dateKey])

  if (!ready || dismissed) return null

  function acknowledge() {
    try {
      localStorage.setItem(storageKey(dateKey), '1')
    } catch {
      /* ignore */
    }
    setDismissed(true)
  }

  return (
    <div className={styles.wrap} role="region" aria-labelledby="pre-session-title">
      <h2 id="pre-session-title" className={styles.title}>
        Före passet
      </h2>
      <ul className={styles.list}>
        <li>Belöning och godbitar inom räckhåll — belöna i rätt ögonblick.</li>
        <li>Lugn plats; stäng bort onödiga störningar om du kan.</li>
        <li>{durationHint(ageWeeks)}</li>
        <li>En övning i taget: stabilisera innan du höjer kravet.</li>
      </ul>
      <button type="button" className={styles.cta} onClick={acknowledge}>
        Jag är redo att träna
      </button>
    </div>
  )
}
