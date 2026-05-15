'use client'

import { useState } from 'react'
import { useActiveDog } from '@/lib/dog/active-dog-context'
import { IconCaretDown, IconPlus, SelectionCheck } from '@/components/icons'
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
        <IconCaretDown size="sm" className={styles.chevron} />
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
                  {isActive && <SelectionCheck />}
                </button>
              )
            })}
            <button
              type="button"
              className={styles.addBtn}
              onClick={() => { setOpen(false); onAddDog() }}
            >
              <IconPlus size="sm" className={styles.addIcon} />
              Lägg till hund
            </button>
          </div>
        </div>
      )}
    </>
  )
}
