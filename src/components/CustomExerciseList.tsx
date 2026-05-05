'use client'

import { useEffect, useState } from 'react'
import styles from './CustomExerciseList.module.css'

interface CustomExercise {
  id: string
  label: string
  prompt: string
  active: boolean
}

export default function CustomExerciseList() {
  const [exercises, setExercises] = useState<CustomExercise[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/training/custom')
      .then((r) => r.ok ? r.json() : [])
      .then((data: CustomExercise[]) => { setExercises(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function handleToggle(id: string, active: boolean) {
    setExercises((prev) => prev.map((e) => e.id === id ? { ...e, active } : e))
    await fetch('/api/training/custom', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, active }),
    }).catch(() => {})
  }

  async function handleDelete(id: string) {
    setExercises((prev) => prev.filter((e) => e.id !== id))
    await fetch('/api/training/custom', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    }).catch(() => {})
  }

  if (loading) return null
  if (exercises.length === 0) return (
    <p className={styles.empty}>Inga egna pass skapade ännu.</p>
  )

  return (
    <ul className={styles.list}>
      {exercises.map((ex) => (
        <li key={ex.id} className={styles.item}>
          <div className={styles.info}>
            <span className={styles.label}>{ex.label}</span>
            <span className={styles.prompt}>{ex.prompt}</span>
          </div>
          <div className={styles.actions}>
            <button
              type="button"
              role="switch"
              aria-checked={ex.active}
              className={`${styles.toggle} ${ex.active ? styles.toggleOn : ''}`}
              onClick={() => handleToggle(ex.id, !ex.active)}
              aria-label={ex.active ? 'Inaktivera' : 'Aktivera'}
            >
              {ex.active ? 'På' : 'Av'}
            </button>
            <button
              type="button"
              className={styles.deleteBtn}
              onClick={() => handleDelete(ex.id)}
              aria-label={`Ta bort ${ex.label}`}
            >
              Ta bort
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}
