'use client'

import { useEffect, useState } from 'react'
import styles from './LearningChecklistCard.module.css'

const STORAGE_KEY = 'dv_learning_checklist_v1'

export default function LearningChecklistCard() {
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(STORAGE_KEY) === '1')
    } catch {
      setDismissed(false)
    }
  }, [])

  if (dismissed) return null

  function dismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch { /* ignore */ }
    setDismissed(true)
  }

  return (
    <section className={styles.card} aria-labelledby="learning-checklist-title">
      <div className={styles.content}>
        <h2 id="learning-checklist-title" className={styles.title}>
          Tre vanor som maxar inlärning
        </h2>
        <p className={styles.intro}>Gäller särskilt första veckorna — sedan blir de automatiska.</p>
        <ol className={styles.list}>
          <li><strong>Belöning redo</strong> innan du börjar — godis/leksak inom räckhåll så timingen blir rätt.</li>
          <li><strong>Ett steg i taget</strong> — höj bara ett kriterium (miljö, avstånd eller störning) per pass.</li>
          <li><strong>Hunden tar inte belöning?</strong> Gör övningen lättare, öka avstånd till det svåra, eller avsluta och vila.</li>
        </ol>
        <p className={styles.restNote}>Vilodagar är lika viktiga som träningsdagar för återhämtning.</p>
      </div>
      <button type="button" className={styles.dismiss} onClick={dismiss} aria-label="Visa inte checklistan igen">
        Visa inte igen
      </button>
    </section>
  )
}
