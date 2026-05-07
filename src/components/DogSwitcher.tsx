'use client'

import { useState } from 'react'
import { useActiveDog } from '@/lib/dog/active-dog-context'
import Avatar from './Avatar'
import styles from './DogSwitcher.module.css'

interface DogSwitcherProps {
  onAddDog: () => void
}

export default function DogSwitcher({ onAddDog }: DogSwitcherProps) {
  const { activeDog, allDogs, switchDog } = useActiveDog()
  const [open, setOpen] = useState(false)
  const [switching, setSwitching] = useState<string | null>(null)

  if (!activeDog) return null

  async function handleSwitch(id: string) {
    if (id === activeDog!.id || switching) return
    setSwitching(id)
    try {
      await switchDog(id)
    } finally {
      setSwitching(null)
      setOpen(false)
    }
  }

  return (
    <>
      <button
        type="button"
        className={styles.chip}
        onClick={() => setOpen(true)}
        aria-label="Byt hund"
      >
        <Avatar name={activeDog.name} size={28} />
        {activeDog.name}
        <ChevronDown className={styles.chevron} />
      </button>

      {open && (
        <div className={styles.overlay} onClick={() => setOpen(false)}>
          <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
            <p className={styles.sheetTitle}>Välj hund</p>
            {allDogs.map((dog) => {
              const isActive = dog.id === activeDog.id
              return (
                <button
                  key={dog.id}
                  type="button"
                  className={`${styles.dogRow} ${isActive ? styles.dogRowActive : ''}`}
                  onClick={() => handleSwitch(dog.id!)}
                  disabled={switching !== null}
                >
                  <Avatar name={dog.name} size={32} />
                  <span>{dog.name}</span>
                  {isActive && <span className={styles.check} aria-hidden="true">✓</span>}
                </button>
              )
            })}
            <button
              type="button"
              className={styles.addBtn}
              onClick={() => { setOpen(false); onAddDog() }}
            >
              + Lägg till hund
            </button>
          </div>
        </div>
      )}
    </>
  )
}

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true" className={className}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}
