'use client'

import { useEffect, useState } from 'react'
import {
  WEEKLY_FOCUS_AREAS,
  WEEKLY_FOCUS_LABELS,
  MAX_WEEKLY_FOCUS,
  type WeeklyFocusArea,
} from '@/lib/training/weekly-focus'
import { IconCaretRight, IconTarget } from '@/components/icons'
import styles from './WeeklyFocusPicker.module.css'

interface Props {
  dogId: string
  onLoaded?: (areas: WeeklyFocusArea[]) => void
  onChange?: (areas: WeeklyFocusArea[]) => void
}

interface ApiResponse {
  isoWeek: string
  areas: WeeklyFocusArea[]
}

export default function WeeklyFocusPicker({ dogId, onLoaded, onChange }: Props) {
  const [areas, setAreas] = useState<WeeklyFocusArea[]>([])
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!dogId) return
    let alive = true
    ;(async () => {
      try {
        const res = await fetch(`/api/training/focus?dogId=${encodeURIComponent(dogId)}`)
        if (!res.ok) return
        const body = (await res.json()) as ApiResponse
        if (alive) {
          setAreas(body.areas)
          setLoaded(true)
          onLoaded?.(body.areas)
        }
      } catch (e) {
        console.error('[focus load]', e)
      }
    })()
    return () => { alive = false }
    // onLoaded intentionally excluded — initial load should fire once per dog
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dogId])

  async function persist(next: WeeklyFocusArea[]) {
    setAreas(next)
    setSaving(true)
    try {
      const res = await fetch('/api/training/focus', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dogId, areas: next }),
      })
      if (res.ok) {
        const body = (await res.json()) as ApiResponse
        setAreas(body.areas)
        onChange?.(body.areas)
      }
    } catch (e) {
      console.error('[focus save]', e)
    } finally {
      setSaving(false)
    }
  }

  function toggle(a: WeeklyFocusArea) {
    const isSelected = areas.includes(a)
    if (isSelected) {
      persist(areas.filter((x) => x !== a))
    } else {
      if (areas.length >= MAX_WEEKLY_FOCUS) return
      persist([...areas, a])
    }
  }

  function clear() {
    if (areas.length === 0) return
    persist([])
  }

  if (!loaded) return null

  const summary =
    areas.length === 0
      ? 'Vad vill du fokusera på denna vecka?'
      : areas.map((a) => WEEKLY_FOCUS_LABELS[a]).join(' + ')

  return (
    <div className={styles.wrap}>
      <button
        type="button"
        className={`${styles.summary} ${areas.length > 0 ? styles.summaryActive : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <IconTarget size="md" className={styles.summaryIcon} />
        <span className={styles.summaryText}>
          <span className={styles.summaryLabel}>Veckofokus</span>
          <span className={styles.summaryValue}>{summary}</span>
        </span>
        <IconCaretRight
          size="sm"
          className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`}
        />
      </button>

      {open && (
        <div className={styles.panel}>
          <p className={styles.help}>
            Välj upp till {MAX_WEEKLY_FOCUS} fokusområden. Veckoplanen viktas mot dina val.
          </p>
          <div className={styles.chips}>
            {WEEKLY_FOCUS_AREAS.map((a) => {
              const selected = areas.includes(a)
              const disabled = !selected && areas.length >= MAX_WEEKLY_FOCUS
              return (
                <button
                  key={a}
                  type="button"
                  className={`${styles.chip} ${selected ? styles.chipSelected : ''}`}
                  onClick={() => toggle(a)}
                  aria-pressed={selected}
                  disabled={saving || disabled}
                >
                  {WEEKLY_FOCUS_LABELS[a]}
                </button>
              )
            })}
          </div>
          {areas.length > 0 && (
            <button type="button" className={styles.clearBtn} onClick={clear} disabled={saving}>
              Rensa veckofokus
            </button>
          )}
        </div>
      )}
    </div>
  )
}
