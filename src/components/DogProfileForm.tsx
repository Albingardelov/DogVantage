'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { saveDogProfile } from '@/lib/dog/profile'
import { saveDogPhoto } from '@/lib/dog/photo'
import { getAgeInWeeks } from '@/lib/dog/age'
import type { Breed, DogProfile, OnboardingPrefs, RewardPreference, TrainingEnvironment, TrainingGoal } from '@/types'
import styles from './DogProfileForm.module.css'

const BREEDS: { value: Breed; label: string }[] = [
  { value: 'braque_francais', label: 'Braque Français' },
  { value: 'labrador', label: 'Labrador Retriever' },
  { value: 'italian_greyhound', label: 'Italiensk Vinthund' },
]

const TOTAL_STEPS = 4
const STEP_TITLES = ['Lägg till ett foto', 'Om din hund', 'När är hunden född?', 'Hur vill du använda appen?']

export const GOALS: { value: TrainingGoal; label: string }[] = [
  { value: 'everyday_obedience', label: 'Vardagslydnad' },
  { value: 'sport', label: 'Sport / tävling' },
  { value: 'hunting', label: 'Jakt / bruk' },
  { value: 'problem_solving', label: 'Lösa problem (t.ex. koppel/inkallning)' },
]

export const ENVIRONMENTS: { value: TrainingEnvironment; label: string }[] = [
  { value: 'city', label: 'Stad (mycket folk/hundar)' },
  { value: 'suburb', label: 'Förort / blandat' },
  { value: 'rural', label: 'Land / natur' },
]

export const REWARDS: { value: RewardPreference; label: string }[] = [
  { value: 'food', label: 'Mat' },
  { value: 'toy', label: 'Leksak' },
  { value: 'social', label: 'Socialt (beröm/lek)' },
  { value: 'mixed', label: 'Blandat' },
]

export default function DogProfileForm() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState(0)
  const [photo, setPhoto] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [breed, setBreed] = useState<Breed | ''>('')
  const [birthdate, setBirthdate] = useState('')
  const [goals, setGoals] = useState<TrainingGoal[]>(['everyday_obedience'])
  const [environment, setEnvironment] = useState<TrainingEnvironment>('suburb')
  const [rewardPreference, setRewardPreference] = useState<RewardPreference>('mixed')
  const [takesRewardsOutdoors, setTakesRewardsOutdoors] = useState(true)

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
    true,
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
    const onboarding: OnboardingPrefs = {
      goals,
      environment,
      rewardPreference,
      takesRewardsOutdoors,
    }
    const profile: DogProfile = {
      name: name.trim(),
      breed,
      birthdate,
      dogKey: undefined, // generated in saveDogProfile
      trainingWeek: 1,
      onboarding,
      assessment: { status: 'not_started' },
    }
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

        {step === 3 && (
          <div className={styles.stepFields}>
            <p className={styles.lead}>
              Det här hjälper oss att prioritera rätt typ av träning för dig och din hund.
            </p>

            <MultiChoiceField
              label="Mål (välj ett eller flera)"
              values={goals}
              onChange={(v) => setGoals(v as TrainingGoal[])}
              options={GOALS}
            />

            <ChoiceField
              label="Miljö där ni tränar mest"
              value={environment}
              onChange={(v) => setEnvironment(v as TrainingEnvironment)}
              options={ENVIRONMENTS}
            />

            <ChoiceField
              label="Belöning som funkar bäst"
              value={rewardPreference}
              onChange={(v) => setRewardPreference(v as RewardPreference)}
              options={REWARDS}
            />

            <div className={styles.field}>
              <span className={styles.label}>Tar hunden belöningar utomhus?</span>
              <div className={styles.breedList} role="radiogroup" aria-label="Tar belöningar utomhus">
                {[
                  { value: true, label: 'Ja, oftast' },
                  { value: false, label: 'Nej, sällan' },
                ].map((o) => {
                  const selected = takesRewardsOutdoors === o.value
                  return (
                    <button
                      key={String(o.value)}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setTakesRewardsOutdoors(o.value)}
                      className={`${styles.breedOption} ${selected ? styles.breedOptionSelected : ''}`}
                    >
                      <span>{o.label}</span>
                      {selected && <span aria-hidden="true">✓</span>}
                    </button>
                  )
                })}
              </div>
            </div>
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

function ChoiceField({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div className={styles.field}>
      <span className={styles.label}>{label}</span>
      <div className={styles.breedList} role="radiogroup" aria-label={label}>
        {options.map((o) => {
          const selected = value === o.value
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(o.value)}
              className={`${styles.breedOption} ${selected ? styles.breedOptionSelected : ''}`}
            >
              <span>{o.label}</span>
              {selected && <span aria-hidden="true">✓</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function MultiChoiceField({
  label,
  values,
  onChange,
  options,
}: {
  label: string
  values: string[]
  onChange: (v: string[]) => void
  options: { value: string; label: string }[]
}) {
  function toggle(v: string) {
    if (values.includes(v)) {
      if (values.length === 1) return // minst ett val
      onChange(values.filter((x) => x !== v))
    } else {
      onChange([...values, v])
    }
  }

  return (
    <div className={styles.field}>
      <span className={styles.label}>{label}</span>
      <div className={styles.breedList} role="group" aria-label={label}>
        {options.map((o) => {
          const selected = values.includes(o.value)
          return (
            <button
              key={o.value}
              type="button"
              role="checkbox"
              aria-checked={selected}
              onClick={() => toggle(o.value)}
              className={`${styles.breedOption} ${selected ? styles.breedOptionSelected : ''}`}
            >
              <span>{o.label}</span>
              {selected && <span aria-hidden="true">✓</span>}
            </button>
          )
        })}
      </div>
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
