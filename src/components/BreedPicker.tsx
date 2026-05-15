// src/components/BreedPicker.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { BREED_REGISTRY } from '@/lib/breeds/registry'
import type { BreedEntry } from '@/lib/breeds/registry'
import styles from './BreedPicker.module.css'

interface Props {
  value: string
  onChange: (slug: string) => void
  placeholder?: string
}

export default function BreedPicker({ value, onChange, placeholder = 'Sök ras…' }: Props) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const selectedEntry = BREED_REGISTRY.find((b) => b.slug === value)

  const matches: BreedEntry[] = query.length < 1
    ? []
    : BREED_REGISTRY.filter((b) =>
        b.nameSv.toLowerCase().includes(query.toLowerCase()) ||
        b.nameEn.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8)

  function handleSelect(entry: BreedEntry) {
    onChange(entry.slug)
    setQuery('')
    setOpen(false)
  }

  function handleClear() {
    onChange('')
    setQuery('')
    setOpen(false)
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (selectedEntry) {
    return (
      <button type="button" onClick={handleClear} className={styles.selected}>
        <span>{selectedEntry.nameSv}</span>
        <span aria-hidden="true">✕</span>
      </button>
    )
  }

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <input
        className={styles.input}
        type="text"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        autoComplete="off"
        aria-label="Sök ras"
        aria-expanded={open}
        aria-autocomplete="list"
      />
      {open && query.length > 0 && (
        <div className={styles.dropdown} role="listbox">
          {matches.length === 0 ? (
            <p className={styles.empty}>Hittade ingen ras — kontrollera stavningen</p>
          ) : (
            matches.map((entry) => (
              <button
                key={entry.slug}
                type="button"
                role="option"
                aria-selected={false}
                className={styles.option}
                onMouseDown={() => handleSelect(entry)}
              >
                {entry.nameSv}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
