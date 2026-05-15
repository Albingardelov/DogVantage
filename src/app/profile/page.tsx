'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowser } from '@/lib/supabase/browser'
import ProfileGuard from '@/components/ProfileGuard'
import Avatar from '@/components/Avatar'
import BottomNav from '@/components/BottomNav'
import { updateDogProfile } from '@/lib/dog/profile'
import { saveDogPhoto } from '@/lib/dog/photo'
import { useActiveDog } from '@/lib/dog/active-dog-context'
import { getAgeInWeeks, daysUntilHomecoming } from '@/lib/dog/age'
import { GOALS, ENVIRONMENTS, REWARDS } from '@/components/DogProfileForm'
import { HOUSEHOLD_PET_LABELS } from '@/lib/dog/behavior'
import {
  IconCaretLeft,
  IconCircleFilled,
  IconCircleOutline,
  IconWarningCircle,
  SelectionCheck,
} from '@/components/icons'
import type { DogProfile, DogSex, CastrationStatus, TrainingGoal, TrainingEnvironment, RewardPreference, HouseholdPet } from '@/types'

const ALL_HOUSEHOLD_PETS = Object.keys(HOUSEHOLD_PET_LABELS) as HouseholdPet[]
import styles from './page.module.css'
import CustomExerciseList from '@/components/CustomExerciseList'

export default function ProfilePage() {
  return (
    <ProfileGuard>
      <ProfileView />
    </ProfileGuard>
  )
}

function ProfileView() {
  const router = useRouter()
  const { activeDog, refreshDogs } = useActiveDog()
  const [profile, setProfile] = useState<DogProfile | null>(null)
  const [goals, setGoals] = useState<TrainingGoal[]>(['everyday_obedience'])
  const [environment, setEnvironment] = useState<TrainingEnvironment>('suburb')
  const [rewardPreference, setRewardPreference] = useState<RewardPreference>('mixed')
  const [takesRewardsOutdoors, setTakesRewardsOutdoors] = useState(true)
  const [householdPets, setHouseholdPets] = useState<HouseholdPet[]>([])
  const [ownerNotes, setOwnerNotes] = useState('')
  const [trainingWeek, setTrainingWeek] = useState(1)
  const [sex, setSex] = useState<DogSex | ''>('')
  const [castrationStatus, setCastrationStatus] = useState<CastrationStatus | ''>('')
  const [homecomeDate, setHomecomeDate] = useState('')
  const [isInHeat, setIsInHeat] = useState(false)
  const [skenfasActive, setSkenfasActive] = useState(false)
  const [heatLoading, setHeatLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [photoKey, setPhotoKey] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Initialize edit state from the active dog (context) — re-runs when dog switches
  useEffect(() => {
    if (!activeDog) return
    setProfile(activeDog)
    setGoals(activeDog.onboarding?.goals ?? ['everyday_obedience'])
    setEnvironment(activeDog.onboarding?.environment ?? 'suburb')
    setRewardPreference(activeDog.onboarding?.rewardPreference ?? 'mixed')
    setTakesRewardsOutdoors(activeDog.onboarding?.takesRewardsOutdoors ?? true)
    setHouseholdPets(activeDog.onboarding?.householdPets ?? [])
    setOwnerNotes(activeDog.onboarding?.ownerNotes ?? '')
    setTrainingWeek(activeDog.trainingWeek ?? 1)
    setSex(activeDog.sex ?? '')
    setCastrationStatus(activeDog.castrationStatus ?? '')
    setHomecomeDate(activeDog.onboarding?.homecomeDate ?? '')
    setSaved(false)
    if (activeDog.id) {
      fetch(`/api/training/heat?dogId=${encodeURIComponent(activeDog.id)}`)
        .then((r) => r.ok ? r.json() : null)
        .then((d) => {
          if (d) {
            setIsInHeat(d.isInHeat ?? false)
            setSkenfasActive(d.skenfasActive ?? false)
          }
        })
        .catch(() => {})
    }
  }, [activeDog?.id])

  function toggleGoal(goal: TrainingGoal) {
    setGoals((prev) => {
      if (prev.includes(goal)) {
        if (prev.length === 1) return prev
        return prev.filter((g) => g !== goal)
      }
      return [...prev, goal]
    })
    setSaved(false)
  }

  async function handleHeatToggle() {
    if (!profile?.id) return
    setHeatLoading(true)
    try {
      const method = isInHeat ? 'DELETE' : 'POST'
      const res = await fetch('/api/training/heat', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dogId: profile.id }),
      })
      if (res.ok) {
        const d = await res.json()
        setIsInHeat(d.isInHeat ?? false)
        setSkenfasActive(d.skenfasActive ?? false)
      }
    } catch (e) {
      console.error('[heatToggle]', e)
    } finally {
      setHeatLoading(false)
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true)
    try {
      const res = await fetch('/api/account', { method: 'DELETE' })
      if (!res.ok) throw new Error('Fel vid radering')
      await getSupabaseBrowser().auth.signOut()
      router.replace('/login')
    } catch (e) {
      console.error('[deleteAccount]', e)
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !profile) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result
      if (typeof dataUrl !== 'string') return
      await saveDogPhoto(dataUrl, profile.id)
      setPhotoKey((k) => k + 1)
    }
    reader.readAsDataURL(file)
  }

  async function handleSave() {
    if (!profile) return
    const trimmedNotes = ownerNotes.trim()
    const safeWeek = Math.max(1, Math.min(520, Math.round(trainingWeek)))
    const updated: DogProfile = {
      ...profile,
      trainingWeek: safeWeek,
      onboarding: {
        ...(profile.onboarding ?? { takesRewardsOutdoors: true, goals, environment, rewardPreference }),
        goals,
        environment,
        rewardPreference,
        takesRewardsOutdoors,
        householdPets: householdPets.length > 0 ? householdPets : undefined,
        ownerNotes: trimmedNotes.length > 0 ? trimmedNotes : undefined,
        homecomeDate: homecomeDate || undefined,
      },
    }
    try {
      await updateDogProfile({
        id: profile.id,
        onboarding: updated.onboarding,
        trainingWeek: safeWeek,
        sex: sex || undefined,
        castrationStatus: castrationStatus || undefined,
      })
      setProfile(updated)
      setTrainingWeek(safeWeek)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      refreshDogs()
    } catch (e) {
      console.error('[profile save]', e)
    }
  }

  if (!profile) return null

  const ageWeeks = Math.max(1, getAgeInWeeks(profile.birthdate))
  const ageYears = Math.floor(ageWeeks / 52)
  const ageMonths = Math.floor((ageWeeks % 52) / 4)
  const ageLabel = ageYears > 0
    ? `${ageYears} år${ageMonths > 0 ? ` ${ageMonths} mån` : ''}`
    : `${ageMonths} månader`

  const OUTDOOR_OPTS = [
    { value: 'true', label: 'Ja, oftast' },
    { value: 'false', label: 'Nej, sällan' },
  ]

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div className={styles.decorCircle} aria-hidden="true" />
        <div className={styles.headerContent}>
          <button
            type="button"
            className={styles.backBtn}
            onClick={() => router.back()}
            aria-label="Tillbaka"
          >
            <IconCaretLeft size="md" />
          </button>
          <span className={styles.headerTitle}>Profil</span>
        </div>
      </header>

      <div className={styles.dogInfo}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handlePhotoChange}
        />
        <button
          type="button"
          className={styles.avatarBtn}
          onClick={() => fileInputRef.current?.click()}
          aria-label="Byt profilbild"
        >
          <Avatar key={photoKey} name={profile.name} dogId={profile.id} size={72} bordered={false} />
          <span className={styles.avatarEditBadge}>✎</span>
        </button>
        <span className={styles.dogName}>{profile.name}</span>
        <span className={styles.dogMeta}>{breedLabel(profile.breed)} · {ageLabel} · Vecka {profile.trainingWeek ?? 1}</span>
      </div>

      <div className={styles.scrollArea}>
        <div className={styles.section}>
          <span className={styles.sectionTitle}>Träningsmål</span>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Mål (välj ett eller flera)</span>
            <div className={styles.optionList} role="group" aria-label="Mål">
              {GOALS.map((o) => {
                const selected = goals.includes(o.value)
                return (
                  <button
                    key={o.value}
                    type="button"
                    role="checkbox"
                    aria-checked={selected}
                    onClick={() => toggleGoal(o.value)}
                    className={`${styles.optionBtn} ${selected ? styles.optionBtnSelected : ''}`}
                  >
                    <span>{o.label}</span>
                    {selected && <SelectionCheck />}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <span className={styles.sectionTitle}>Träningsinställningar</span>

          <OptionField
            label="Miljö där ni tränar mest"
            value={environment}
            options={ENVIRONMENTS}
            onChange={(v) => { setEnvironment(v as TrainingEnvironment); setSaved(false) }}
          />

          <OptionField
            label="Belöning som funkar bäst"
            value={rewardPreference}
            options={REWARDS}
            onChange={(v) => { setRewardPreference(v as RewardPreference); setSaved(false) }}
          />

          <OptionField
            label="Tar hunden belöningar utomhus?"
            value={String(takesRewardsOutdoors)}
            options={OUTDOOR_OPTS}
            onChange={(v) => { setTakesRewardsOutdoors(v === 'true'); setSaved(false) }}
          />
        </div>

        <div className={styles.section}>
          <span className={styles.sectionTitle}>Husdjur i hemmet</span>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Finns det andra husdjur hemma? <span style={{ fontWeight: 400, color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>(valfritt)</span></span>
            <div className={styles.optionList} role="group" aria-label="Husdjur hemma">
              {ALL_HOUSEHOLD_PETS.map((p) => {
                const selected = householdPets.includes(p)
                return (
                  <button
                    key={p}
                    type="button"
                    role="checkbox"
                    aria-checked={selected}
                    onClick={() => {
                      setHouseholdPets((prev) =>
                        prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
                      )
                      setSaved(false)
                    }}
                    className={`${styles.optionBtn} ${selected ? styles.optionBtnSelected : ''}`}
                  >
                    <span>{HOUSEHOLD_PET_LABELS[p]}</span>
                    {selected && <SelectionCheck />}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <span className={styles.sectionTitle}>Kön &amp; hälsa</span>

          <div className={styles.field}>
            <span className={styles.fieldLabel}>Kön <span style={{ fontWeight: 400, color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>(valfritt)</span></span>
            <div className={styles.optionList} role="radiogroup" aria-label="Kön">
              {([{ value: 'male', label: 'Hane' }, { value: 'female', label: 'Tik' }] as const).map((o) => {
                const selected = sex === o.value
                return (
                  <button key={o.value} type="button" role="radio" aria-checked={selected}
                    onClick={() => { setSex(o.value); setCastrationStatus(''); setSaved(false) }}
                    className={`${styles.optionBtn} ${selected ? styles.optionBtnSelected : ''}`}
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
              <span className={styles.fieldLabel}>Kastrerad?</span>
              <div className={styles.optionList} role="radiogroup" aria-label="Kastrerad">
                {([
                  { value: 'intact', label: 'Nej, intakt' },
                  { value: 'castrated', label: 'Ja, kastrerad' },
                  { value: 'unknown', label: 'Vet ej' },
                ] as const).map((o) => {
                  const selected = castrationStatus === o.value
                  return (
                    <button key={o.value} type="button" role="radio" aria-checked={selected}
                      onClick={() => { setCastrationStatus(o.value); setSaved(false) }}
                      className={`${styles.optionBtn} ${selected ? styles.optionBtnSelected : ''}`}
                    >
                      <span>{o.label}</span>
                      {selected && <SelectionCheck />}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {sex === 'female' && castrationStatus === 'intact' && (
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Löpcykel</span>
              <button
                type="button"
                className={`${styles.heatToggleBtn} ${isInHeat ? styles.heatToggleBtnActive : ''}`}
                onClick={handleHeatToggle}
                disabled={heatLoading}
                aria-pressed={isInHeat}
              >
                {heatLoading ? (
                  'Uppdaterar…'
                ) : (
                  <span className={styles.heatToggleContent}>
                    {isInHeat ? (
                      <IconCircleFilled size="sm" color="var(--color-danger)" className={styles.heatDot} />
                    ) : (
                      <IconCircleOutline size="sm" className={styles.heatDot} />
                    )}
                    <span>
                      {isInHeat
                        ? 'Min tik löper just nu — klicka för att avsluta'
                        : 'Min tik löper just nu'}
                    </span>
                  </span>
                )}
              </button>
              {skenfasActive && !isInHeat && (
                <span className={styles.skenfasAlert}>
                  <IconWarningCircle size="sm" className={styles.skenfasIcon} />
                  Skenfas-fönster aktivt (6–9 v efter löpet). Läs mer om träning under skenfas.
                </span>
              )}
            </div>
          )}
        </div>

        <div className={styles.section}>
          <span className={styles.sectionTitle}>Om hunden</span>
          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="owner-notes">
              Något vi bör veta?{' '}
              <span style={{ fontWeight: 400, color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>(valfritt)</span>
            </label>
            <textarea
              id="owner-notes"
              className={styles.textarea}
              rows={4}
              value={ownerNotes}
              onChange={(e) => { setOwnerNotes(e.target.value); setSaved(false) }}
              placeholder="T.ex. rädd för barn, koppelaggressiv mot hundar, behöver fokus på avslappning och off-knapp…"
              maxLength={500}
            />
            <span className={styles.helper}>
              Används av träningsassistenten och i veckoplanen för att anpassa råd och övningar.
            </span>
          </div>
        </div>

        <div className={styles.section}>
          <span className={styles.sectionTitle}>Programvecka</span>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Aktuell programvecka</span>
            <div className={styles.weekStepper}>
              <button
                type="button"
                className={styles.stepperBtn}
                onClick={() => { setTrainingWeek((w) => Math.max(1, w - 1)); setSaved(false) }}
                aria-label="Minska programvecka"
                disabled={trainingWeek <= 1}
              >
                −
              </button>
              <input
                type="number"
                min={1}
                max={520}
                inputMode="numeric"
                className={styles.weekInput}
                value={trainingWeek}
                onChange={(e) => {
                  const n = Number(e.target.value)
                  if (Number.isFinite(n)) {
                    setTrainingWeek(Math.max(1, Math.min(520, Math.round(n))))
                    setSaved(false)
                  }
                }}
                aria-label="Programvecka"
              />
              <button
                type="button"
                className={styles.stepperBtn}
                onClick={() => { setTrainingWeek((w) => Math.min(520, w + 1)); setSaved(false) }}
                aria-label="Öka programvecka"
              >
                +
              </button>
            </div>
            <span className={styles.helper}>
              {homecomeDate
                ? 'Veckan beräknas automatiskt från hämtningsdatumet nedan — justera bara om du vill avvika.'
                : 'Justera om du vill backa eller hoppa fram i programmet. Påverkar nästa veckoplan.'}
            </span>
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="homecome-date">
              Hämtningsdatum{' '}
              <span style={{ fontWeight: 400, color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>(valfritt)</span>
            </label>
            <input
              id="homecome-date"
              className={styles.textarea}
              type="date"
              value={homecomeDate}
              onChange={(e) => { setHomecomeDate(e.target.value); setSaved(false) }}
            />
            {homecomeDate && (
              <span className={styles.helper}>
                {daysUntilHomecoming(homecomeDate) > 0
                  ? `${daysUntilHomecoming(homecomeDate)} dagar kvar tills hunden är hemma.`
                  : 'Hunden är hemma — schemat räknas från detta datum.'}
              </span>
            )}
          </div>
        </div>

        <div className={styles.section}>
          <span className={styles.sectionTitle}>Egna träningspass</span>
          <CustomExerciseList dogId={profile.id} />
        </div>

        {saved ? (
          <p className={styles.savedMsg}>Sparat!</p>
        ) : (
          <button type="button" className={styles.saveBtn} onClick={handleSave}>
            Spara ändringar
          </button>
        )}

        <div className={styles.section}>
          <span className={styles.sectionTitle}>Dataskydd</span>
          <button
            type="button"
            className={styles.linkBtn}
            onClick={() => router.push('/privacy')}
          >
            Integritetspolicy
          </button>
          <button
            type="button"
            className={styles.dangerBtn}
            onClick={() => setShowDeleteConfirm(true)}
          >
            Radera mitt konto
          </button>
        </div>

        {showDeleteConfirm && (
          <div className={styles.confirmOverlay}>
            <div className={styles.confirmSheet}>
              <p className={styles.confirmText}>
                All din data raderas permanent — träningsloggar, hundprofil och egna övningar. Det går inte att ångra.
              </p>
              <button
                type="button"
                className={styles.dangerBtn}
                onClick={handleDeleteAccount}
                disabled={deleting}
              >
                {deleting ? 'Raderar…' : 'Ja, radera mitt konto'}
              </button>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
              >
                Avbryt
              </button>
            </div>
          </div>
        )}
      </div>

      <BottomNav active="dashboard" />
    </main>
  )
}

function OptionField({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (v: string) => void
}) {
  return (
    <div className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      <div className={styles.optionList} role="radiogroup" aria-label={label}>
        {options.map((o) => {
          const selected = value === o.value
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(o.value)}
              className={`${styles.optionBtn} ${selected ? styles.optionBtnSelected : ''}`}
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

function breedLabel(breed: string): string {
  const map: Record<string, string> = {
    braque_francais: 'Braque Français',
    labrador: 'Labrador Retriever',
    italian_greyhound: 'Italiensk Vinthund',
    miniature_american_shepherd: 'Miniature American Shepherd',
  }
  return map[breed] ?? breed
}

