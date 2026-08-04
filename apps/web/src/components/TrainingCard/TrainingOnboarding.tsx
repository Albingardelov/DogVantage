'use client'

import { useEffect, useState } from 'react'
import styles from './TrainingOnboarding.module.css'

const STEPS = [
  { title: 'Så funkar Dagens pass', body: 'Varje kort är en övning. Ta ett kort i taget — du behöver inte göra allt på en gång.' },
  { title: 'Lyckad eller Miss', body: 'Tryck Lyckad när hunden gör rätt, Miss annars. Appen räknar och anpassar nivån åt dig.' },
  { title: 'Dagens kriterium', body: 'Det är exakt vad som krävs just nu — t.ex. avstånd eller miljö. Vi höjer det först när det sitter.' },
  { title: 'Guiden finns alltid', body: 'Tryck Guide på ett kort för setup, steg-för-steg och vanliga fel.' },
  { title: 'Appen anpassar sig', body: 'Är något för svårt sänker vi nivån automatiskt. Det är inte ett misslyckande — så ska inlärning gå till.' },
]

function storageKey(dogId: string): string {
  return `dv:onboarded:training:${dogId}`
}

export default function TrainingOnboarding({ dogId }: { dogId: string }) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (!dogId) return
    if (localStorage.getItem(storageKey(dogId)) !== '1') setOpen(true)
  }, [dogId])

  function dismiss() {
    localStorage.setItem(storageKey(dogId), '1')
    setOpen(false)
  }

  if (!open) return null
  const isLast = step === STEPS.length - 1
  const current = STEPS[step]

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Introduktion till Dagens pass">
      <div className={styles.sheet}>
        <div className={styles.stepCount}>{step + 1} / {STEPS.length}</div>
        <h2 className={styles.title}>{current.title}</h2>
        <p className={styles.body}>{current.body}</p>
        <div className={styles.actions}>
          <button type="button" className={styles.skip} onClick={dismiss}>Hoppa över</button>
          {isLast ? (
            <button type="button" className={styles.next} onClick={dismiss}>Klar</button>
          ) : (
            <button type="button" className={styles.next} onClick={() => setStep((s) => s + 1)}>Nästa</button>
          )}
        </div>
      </div>
    </div>
  )
}
