'use client'

import { useEffect, useState } from 'react'
import styles from './PreSessionChecklist.module.css'
import { getLifeStage, isPuppy } from '@/lib/dog/age'

function storageKey(dogId: string, dateKey: string): string {
  return `dv_pre_ready_${dogId}_${dateKey}`
}

function durationHint(ageWeeks: number): string {
  if (isPuppy(ageWeeks)) {
    return 'Håll passet kort — ungefär 3–8 minuter räcker ofta för valpar.'
  }
  const stage = getLifeStage(ageWeeks)
  if (stage === 'junior' || stage === 'adolescent') {
    return 'Planera gärna 8–12 minuter fokuserad träning; korta pass ofta slår långa.'
  }
  return 'Planera gärna 10–15 minuter; bryt gärna upp i kortare block om hunden tappar fokus.'
}

interface Props {
  ageWeeks: number
  dateKey: string
  dogId: string
  items?: string[]
}

const GENERIC_BULLETS = [
  'Belöning och godbitar inom räckhåll — belöna i rätt ögonblick.',
  'Lugn plats; stäng bort onödiga störningar om du kan.',
  'En övning i taget: stabilisera innan du höjer kravet.',
] as const

export default function PreSessionChecklist({ ageWeeks, dateKey, dogId, items }: Props) {
  const [ready, setReady] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    try {
      setDismissed(typeof window !== 'undefined' && localStorage.getItem(storageKey(dogId, dateKey)) === '1')
    } catch {
      setDismissed(false)
    }
    setReady(true)
  }, [dateKey, dogId])

  if (!ready || dismissed) return null

  function acknowledge() {
    try {
      localStorage.setItem(storageKey(dogId, dateKey), '1')
    } catch {
      /* ignore */
    }
    setDismissed(true)
  }

  const bullets =
    items && items.length >= 1
      ? items
      : [...GENERIC_BULLETS.slice(0, 2), durationHint(ageWeeks), GENERIC_BULLETS[2]]

  return (
    <div className={styles.wrap} role="region" aria-labelledby="pre-session-title">
      <h2 id="pre-session-title" className={styles.title}>
        Före passet
      </h2>
      <ul className={styles.list}>
        {bullets.map((text) => (
          <li key={text}>{text}</li>
        ))}
      </ul>
      <button type="button" className={styles.cta} onClick={acknowledge}>
        Jag är redo att träna
      </button>
    </div>
  )
}
