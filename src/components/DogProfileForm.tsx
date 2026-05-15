'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { saveDogProfile } from '@/lib/dog/profile'
import { saveDogPhoto } from '@/lib/dog/photo'
import { getAgeInWeeks } from '@/lib/dog/age'
import { BREED_PROFILES } from '@/lib/ai/breed-profiles'
import { HOUSEHOLD_PET_LABELS } from '@/lib/dog/behavior'
import { getSupabaseBrowser } from '@/lib/supabase/browser'
import { IconCamera, SelectionCheck } from '@/components/icons'
import type { Breed, DogProfile, DogSex, CastrationStatus, HouseholdPet, OnboardingPrefs, RewardPreference, TrainingBackground, TrainingEnvironment, TrainingGoal } from '@/types'
import styles from './DogProfileForm.module.css'

export const BREEDS: { value: Breed; label: string }[] = [
  { value: 'braque_francais', label: 'Braque Français' },
  { value: 'labrador', label: 'Labrador Retriever' },
  { value: 'italian_greyhound', label: 'Italiensk Vinthund' },
  { value: 'miniature_american_shepherd', label: 'Miniature American Shepherd' },
]

const ALL_HOUSEHOLD_PETS = Object.keys(HOUSEHOLD_PET_LABELS) as HouseholdPet[]

export const GOALS: { value: TrainingGoal; label: string }[] = [
  { value: 'everyday_obedience', label: 'Vardagslydnad' },
  { value: 'sport', label: 'Sport / tävling' },
  { value: 'hunting', label: 'Jakt / bruk' },
  { value: 'herding', label: 'Vallning' },
  { value: 'impulse_control', label: 'Impulskontroll & lugn' },
  { value: 'nosework', label: 'Nosework / doftsök' },
  { value: 'problem_solving', label: 'Lösa problem (t.ex. koppel/inkallning)' },
]

function getGoalsForBreed(breed: Breed | ''): { value: TrainingGoal; label: string }[] {
  if (!breed) return GOALS
  const profile = BREED_PROFILES[breed]
  return GOALS.filter((g) => !profile.hiddenGoals.includes(g.value))
}

function getDefaultGoalsForBreed(breed: Breed | ''): TrainingGoal[] {
  if (!breed) return ['everyday_obedience']
  return BREED_PROFILES[breed].suggestedGoals
}

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

interface Props {
  onSaved?: (profile: DogProfile, photo: string | null) => Promise<void>
}

export default function DogProfileForm({ onSaved }: Props = {}) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isAddMode = !!onSaved
  const totalSteps = isAddMode ? 4 : 5
  const stepTitles = isAddMode
    ? ['Lägg till ett foto', 'Om din hund', 'När är hunden född?', 'Hur vill du använda appen?']
    : ['Lägg till ett foto', 'Om din hund', 'När är hunden född?', 'Hur vill du använda appen?', 'Skapa konto']

  const [step, setStep] = useState(0)
  const [photo, setPhoto] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [breed, setBreed] = useState<Breed | ''>('')
  const [sex, setSex] = useState<DogSex | ''>('')
  const [castrationStatus, setCastrationStatus] = useState<CastrationStatus | ''>('')
  const [birthdate, setBirthdate] = useState('')
  const [homecomeDate, setHomecomeDate] = useState('')
  const [goals, setGoals] = useState<TrainingGoal[]>(['everyday_obedience'])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [signupError, setSignupError] = useState<string | null>(null)
  const [signingUp, setSigningUp] = useState(false)

  function handleBreedChange(value: Breed) {
    setBreed(value)
    setGoals(getDefaultGoalsForBreed(value))
  }
  const [environment, setEnvironment] = useState<TrainingEnvironment>('suburb')
  const [rewardPreference, setRewardPreference] = useState<RewardPreference>('mixed')
  const [takesRewardsOutdoors, setTakesRewardsOutdoors] = useState(true)
  const [householdPets, setHouseholdPets] = useState<HouseholdPet[]>([])
  const [ownerNotes, setOwnerNotes] = useState('')
  const [trainingBackground, setTrainingBackground] = useState<TrainingBackground>('some_training')

  function togglePet(p: HouseholdPet) {
    setHouseholdPets((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    )
  }

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

  const canContinue = isAddMode
    ? [true, name.trim().length > 0 && breed.length > 0, birthdate.length > 0, true]
    : [true, name.trim().length > 0 && breed.length > 0, birthdate.length > 0, true, email.trim().length > 3 && password.length >= 8 && !signingUp]

  function handleNext() {
    setSignupError(null)
    if (step < totalSteps - 1) {
      setStep((s) => s + 1)
      return
    }
    finish()
  }

  async function finish() {
    if (!name.trim() || !breed || !birthdate) return
    setSigningUp(true)
    setSignupError(null)

    const onboarding: OnboardingPrefs = {
      goals,
      environment,
      rewardPreference,
      takesRewardsOutdoors,
      householdPets: householdPets.length > 0 ? householdPets : undefined,
      ownerNotes: ownerNotes.trim() || undefined,
      homecomeDate: homecomeDate || undefined,
      trainingBackground,
    }
    const profile: DogProfile = {
      name: name.trim(),
      breed,
      birthdate,
      sex: sex || undefined,
      castrationStatus: castrationStatus || undefined,
      trainingWeek: 1,
      onboarding,
      assessment: { status: 'not_started' },
    }

    try {
      if (onSaved) {
        await onSaved(profile, photo)
        return
      }

      if (!email.trim() || password.length < 8) return
      const { data, error } = await getSupabaseBrowser().auth.signUp({
        email: email.trim(),
        password,
      })
      if (error) {
        setSignupError('Kunde inte skapa konto. Kontrollera e-post och lösenord.')
        return
      }
      const userId = data.user?.id
      if (!userId) {
        setSignupError('Kontot skapades, men kunde inte starta session. Försök logga in.')
        return
      }

      await saveDogProfile(profile, userId)
      if (photo) await saveDogPhoto(photo)
      router.replace('/dashboard')
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      console.error('[onboarding signup]', msg)
      setSignupError('Något gick fel. Försök igen.')
    } finally {
      setSigningUp(false)
    }
  }

  return (
    <div className={styles.wizard}>
      <div className={styles.progress} aria-hidden="true">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <span
            key={i}
            className={`${styles.progressBar} ${i <= step ? styles.progressBarActive : ''}`}
          />
        ))}
      </div>

      <header className={styles.header}>
        <p className={styles.stepCounter}>Steg {step + 1} av {totalSteps}</p>
        <h2 className={styles.title}>{stepTitles[step]}</h2>
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
                  <IconCamera size="xl" />
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
                      onClick={() => handleBreedChange(b.value)}
                      className={`${styles.breedOption} ${selected ? styles.breedOptionSelected : ''}`}
                    >
                      <span>{b.label}</span>
                      {selected && <SelectionCheck />}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className={styles.field}>
              <span className={styles.label}>Kön <span style={{ fontWeight: 400, color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>(valfritt)</span></span>
              <div className={styles.breedList} role="radiogroup" aria-label="Kön">
                {([{ value: 'male', label: 'Hane' }, { value: 'female', label: 'Tik' }] as const).map((o) => {
                  const selected = sex === o.value
                  return (
                    <button key={o.value} type="button" role="radio" aria-checked={selected}
                      onClick={() => { setSex(o.value); setCastrationStatus('') }}
                      className={`${styles.breedOption} ${selected ? styles.breedOptionSelected : ''}`}
                    >
                      <span>{o.label}</span>
                      {selected && <SelectionCheck />}
                    </button>
                  )
                })}
              </div>
            </div>

            {sex && (
              <div className={styles.field}>
                <span className={styles.label}>Kastrerad?</span>
                <div className={styles.breedList} role="radiogroup" aria-label="Kastrerad">
                  {([
                    { value: 'intact', label: 'Nej, intakt' },
                    { value: 'castrated', label: 'Ja, kastrerad' },
                    { value: 'unknown', label: 'Vet ej' },
                  ] as const).map((o) => {
                    const selected = castrationStatus === o.value
                    return (
                      <button key={o.value} type="button" role="radio" aria-checked={selected}
                        onClick={() => setCastrationStatus(o.value)}
                        className={`${styles.breedOption} ${selected ? styles.breedOptionSelected : ''}`}
                      >
                        <span>{o.label}</span>
                        {selected && <SelectionCheck />}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
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

            <div className={styles.field}>
              <label className={styles.label} htmlFor="homecome-date">
                Hämtningsdatum{' '}
                <span style={{ fontWeight: 400, color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>(valfritt)</span>
              </label>
              <input
                id="homecome-date"
                className={styles.input}
                type="date"
                value={homecomeDate}
                onChange={(e) => setHomecomeDate(e.target.value)}
                min={new Date().toISOString().slice(0, 10)}
              />
              <p style={{ margin: '4px 0 0', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>
                Träningsschemat börjar räkna från detta datum. Visar nedräkning tills dess.
              </p>
            </div>
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
              options={getGoalsForBreed(breed)}
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
                      {selected && <SelectionCheck />}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className={styles.field}>
              <span className={styles.label}>Finns det andra husdjur hemma? <span style={{ fontWeight: 400, color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>(valfritt)</span></span>
              <div className={styles.breedList} role="group" aria-label="Husdjur hemma">
                {ALL_HOUSEHOLD_PETS.map((p) => {
                  const selected = householdPets.includes(p)
                  return (
                    <button
                      key={p}
                      type="button"
                      role="checkbox"
                      aria-checked={selected}
                      onClick={() => togglePet(p)}
                      className={`${styles.breedOption} ${selected ? styles.breedOptionSelected : ''}`}
                    >
                      <span>{HOUSEHOLD_PET_LABELS[p]}</span>
                      {selected && <SelectionCheck />}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className={styles.field}>
              <span className={styles.label}>Är det här din första hund?</span>
              <div className={styles.breedList} role="radiogroup" aria-label="Träningsbakgrund">
                {[
                  { value: 'beginner' as const, label: 'Ja — första hunden' },
                  { value: 'some_training' as const, label: 'Har tränat lite tidigare' },
                  { value: 'experienced' as const, label: 'Erfaren — har tränat länge' },
                ].map((o) => {
                  const selected = trainingBackground === o.value
                  return (
                    <button
                      key={o.value}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setTrainingBackground(o.value)}
                      className={`${styles.breedOption} ${selected ? styles.breedOptionSelected : ''}`}
                    >
                      <span>{o.label}</span>
                      {selected && <SelectionCheck />}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="owner-notes">
                Något vi bör veta om hunden?{' '}
                <span style={{ fontWeight: 400, color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>(valfritt)</span>
              </label>
              <textarea
                id="owner-notes"
                className={styles.input}
                rows={3}
                value={ownerNotes}
                onChange={(e) => setOwnerNotes(e.target.value)}
                placeholder="T.ex. rädd för barn, koppelaggressiv mot hundar, behöver fokus på avslappning och off-knapp…"
                style={{ resize: 'vertical' }}
              />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className={styles.stepFields}>
            <p className={styles.lead}>
              Skapa ett konto så att din hundprofil och loggar kan synkas mellan enheter.
            </p>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="signup-email">E-post</label>
              <input
                id="signup-email"
                className={styles.input}
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="din@email.se"
                disabled={signingUp}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="signup-password">Lösenord</label>
              <input
                id="signup-password"
                className={styles.input}
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minst 8 tecken"
                disabled={signingUp}
              />
            </div>

            {signupError && (
              <p style={{ color: 'var(--color-error)', fontSize: 'var(--text-sm)', margin: 0 }} role="alert">
                {signupError}
              </p>
            )}

            <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
              Har du redan ett konto? Logga in via <a href="/login" style={{ color: 'var(--color-primary)' }}>Logga in</a>.
            </p>
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
          {step < totalSteps - 1 ? 'Fortsätt' : (isAddMode ? (signingUp ? 'Sparar…' : 'Lägg till hund →') : (signingUp ? 'Skapar konto…' : 'Skapa konto →'))}
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
              {selected && <SelectionCheck />}
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
              {selected && <SelectionCheck />}
            </button>
          )
        })}
      </div>
    </div>
  )
}
