'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { saveDogProfile } from '@/lib/dog/profile'
import type { Breed, DogProfile } from '@/types'
import styles from './DogProfileForm.module.css'

const BREEDS: { value: Breed; label: string }[] = [
  { value: 'labrador', label: 'Labrador retriever' },
  { value: 'italian_greyhound', label: 'Italiensk vinthund' },
  { value: 'braque_francais', label: 'Braque français' },
]

export default function DogProfileForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [breed, setBreed] = useState<Breed | ''>('')
  const [birthdate, setBirthdate] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !breed || !birthdate) {
      setError('Fyll i alla fält.')
      return
    }
    const profile: DogProfile = { name: name.trim(), breed, birthdate }
    saveDogProfile(profile)
    router.replace('/dashboard')
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="dog-name">
          Hundens namn
        </label>
        <input
          id="dog-name"
          className={styles.input}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="t.ex. Bella"
          autoComplete="off"
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="dog-breed">
          Ras
        </label>
        <select
          id="dog-breed"
          className={styles.input}
          value={breed}
          onChange={(e) => setBreed(e.target.value as Breed)}
        >
          <option value="" disabled>Välj ras</option>
          {BREEDS.map((b) => (
            <option key={b.value} value={b.value}>{b.label}</option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="dog-birthdate">
          Födelsedatum
        </label>
        <input
          id="dog-birthdate"
          className={styles.input}
          type="date"
          value={birthdate}
          onChange={(e) => setBirthdate(e.target.value)}
          max={new Date().toISOString().slice(0, 10)}
        />
      </div>

      {error && <p className={styles.error} role="alert">{error}</p>}

      <button type="submit" className={styles.submit}>
        Spara och börja träna
      </button>
    </form>
  )
}
