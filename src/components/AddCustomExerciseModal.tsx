'use client'

import { useState } from 'react'
import styles from './AddCustomExerciseModal.module.css'

export default function AddCustomExerciseModal({ onClose, onCreated }: {
  onClose: () => void
  onCreated: () => void
}) {
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = prompt.trim()
    if (!trimmed) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/training/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: trimmed }),
      })
      const data = await res.json() as { error?: string }
      if (!res.ok) {
        setError(data.error ?? 'Något gick fel')
        return
      }
      onCreated()
    } catch {
      setError('Nätverksfel — försök igen')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Lägg till eget pass">
      <div className={styles.sheet}>
        <div className={styles.header}>
          <span className={styles.title}>Lägg till eget pass</span>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Stäng">✕</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.label} htmlFor="custom-prompt">
            Beskriv vad du vill träna
          </label>
          <textarea
            id="custom-prompt"
            className={styles.textarea}
            placeholder="t.ex. Cykla med hunden (canicross)"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            maxLength={300}
            rows={3}
            disabled={loading}
          />
          <span className={styles.charCount}>{prompt.length}/300</span>

          {error && <p className={styles.error} role="alert">{error}</p>}

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={loading || !prompt.trim()}
          >
            {loading ? 'Skapar pass…' : 'Skapa pass med AI'}
          </button>
        </form>
      </div>
    </div>
  )
}
