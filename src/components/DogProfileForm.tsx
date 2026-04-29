'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { saveDogProfile } from '@/lib/dog/profile'
import { saveDogPhoto } from '@/lib/dog/photo'
import { getAgeInWeeks } from '@/lib/dog/age'
import type { Breed, DogProfile } from '@/types'
import styles from './DogProfileForm.module.css'

const BREEDS: { value: Breed; label: string }[] = [
  { value: 'braque_francais', label: 'Braque Français' },
  { value: 'labrador', label: 'Labrador Retriever' },
  { value: 'italian_greyhound', label: 'Italiensk Vinthund' },
]

const TOTAL_STEPS = 3
const STEP_TITLES = ['Lägg till ett foto', 'Om din hund', 'När är hunden född?']

export default function DogProfileForm() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState(0)
  const [photo, setPhoto] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [breed, setBreed] = useState<Breed | ''>('')
  const [birthdate, setBirthdate] = useState('')

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const result = ev.target?.result
      if (typeof result === 'string') setPhoto(result)
    }
    reader.readAsDataURL(file)
  }

  const canContinue = [
    true,
    name.trim().length > 0 && breed.length > 0,
    birthdate.length > 0,
  ]

  function handleNext() {
    if (step < TOTAL_STEPS - 1) {
      setStep((s) => s + 1)
      return
    }
    finish()
  }

  function finish() {
    if (!name.trim() || !breed || !birthdate) return
    if (photo) saveDogPhoto(photo)
    const profile: DogProfile = { name: name.trim(), breed, birthdate }
    saveDogProfile(profile)
    router.replace('/dashboard')
  }

  return (
    <div className={styles.wizard}>
      <div className={styles.progress} aria-hidden="true">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <span
            key={i}
            className={`${styles.progressBar} ${i <= step ? styles.progressBarActive : ''}`}
          />
        ))}
      </div>

      <header className={styles.header}>
        <p className={styles.stepCounter}>Steg {step + 1} av {TOTAL_STEPS}</p>
        <h2 className={styles.title}>{STEP_TITLES[step]}</h2>
      </header>

      <div className={styles.body}>
        {step === 0 && (
          <div className={styles.stepPhoto}>
            <p className={styles.lead}>
              Lägg till ett foto på din hund — det gör appen personligare.
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className={styles.hiddenInput}
              onChange={handlePhoto}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`${styles.photoZone} ${photo ? styles.photoZoneFilled : ''}`}
              aria-label={photo ? 'Byt foto' : 'Välj foto'}
            >
              {photo ? (
                <img src={photo} alt="Vald hundbild" className={styles.photoPreview} />
              ) : (
                <>
                  <CameraIcon />
                  <span className={styles.photoLabel}>Välj foto</span>
                </>
              )}
            </button>

            {photo && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={styles.linkBtn}
              >
                Byt foto
              </button>
            )}

            <p className={styles.helper}>Du kan hoppa över detta och lägga till senare.</p>
          </div>
        )}

        {step === 1 && (
          <div className={styles.stepFields}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="dog-name">Hundens namn</label>
              <input
                id="dog-name"
                className={styles.input}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="T.ex. Bella"
                autoComplete="off"
              />
            </div>

            <div className={styles.field}>
              <span className={styles.label}>Ras</span>
              <div className={styles.breedList} role="radiogroup" aria-label="Ras">
                {BREEDS.map((b) => {
                  const selected = breed === b.value
                  return (
                    <button
                      key={b.value}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setBreed(b.value)}
                      className={`${styles.breedOption} ${selected ? styles.breedOptionSelected : ''}`}
                    >
                      <span>{b.label}</span>
                      {selected && <span aria-hidden="true">✓</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className={styles.stepFields}>
            <p className={styles.lead}>
              Vi beräknar vilket träningsstadium din hund befinner sig i baserat på födelsedag.
            </p>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="dog-birthdate">Födelsedag</label>
              <input
                id="dog-birthdate"
                className={styles.input}
                type="date"
                value={birthdate}
                onChange={(e) => setBirthdate(e.target.value)}
                max={new Date().toISOString().slice(0, 10)}
              />
            </div>

            {birthdate && (
              <div className={styles.weekPreview}>
                <span className={styles.weekPreviewLabel}>Beräknad vecka</span>
                <span className={styles.weekPreviewValue}>
                  Vecka {Math.max(1, getAgeInWeeks(birthdate))}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <footer className={styles.footer}>
        <button
          type="button"
          onClick={handleNext}
          disabled={!canContinue[step]}
          className={styles.primaryBtn}
        >
          {step < TOTAL_STEPS - 1 ? 'Fortsätt' : 'Starta appen →'}
        </button>
        {step === 0 && (
          <button type="button" onClick={handleNext} className={styles.skipBtn}>
            Hoppa över
          </button>
        )}
      </footer>
    </div>
  )
}

function CameraIcon() {
  return (
    <svg
      width="36"
      height="36"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  )
}
