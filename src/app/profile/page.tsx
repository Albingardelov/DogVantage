'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ProfileGuard from '@/components/ProfileGuard'
import Avatar from '@/components/Avatar'
import BottomNav from '@/components/BottomNav'
import { getDogProfile, updateDogProfile } from '@/lib/dog/profile'
import { getAgeInWeeks } from '@/lib/dog/age'
import { GOALS, ENVIRONMENTS, REWARDS } from '@/components/DogProfileForm'
import type { DogProfile, TrainingGoal, TrainingEnvironment, RewardPreference } from '@/types'
import styles from './page.module.css'

export default function ProfilePage() {
  return (
    <ProfileGuard>
      <ProfileView />
    </ProfileGuard>
  )
}

function ProfileView() {
  const router = useRouter()
  const [profile, setProfile] = useState<DogProfile | null>(null)
  const [goals, setGoals] = useState<TrainingGoal[]>(['everyday_obedience'])
  const [environment, setEnvironment] = useState<TrainingEnvironment>('suburb')
  const [rewardPreference, setRewardPreference] = useState<RewardPreference>('mixed')
  const [takesRewardsOutdoors, setTakesRewardsOutdoors] = useState(true)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    let alive = true
    ;(async () => {
      const p = await getDogProfile()
      if (!alive || !p) return
      setProfile(p)
      setGoals(p.onboarding?.goals ?? ['everyday_obedience'])
      setEnvironment(p.onboarding?.environment ?? 'suburb')
      setRewardPreference(p.onboarding?.rewardPreference ?? 'mixed')
      setTakesRewardsOutdoors(p.onboarding?.takesRewardsOutdoors ?? true)
    })().catch((e) => console.error('[profile getDogProfile]', e))
    return () => { alive = false }
  }, [])

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

  async function handleSave() {
    if (!profile) return
    const updated: DogProfile = {
      ...profile,
      onboarding: {
        ...(profile.onboarding ?? { takesRewardsOutdoors: true }),
        goals,
        environment,
        rewardPreference,
        takesRewardsOutdoors,
      },
    }
    try {
      await updateDogProfile({ onboarding: updated.onboarding })
      setProfile(updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
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
            <BackIcon />
          </button>
          <span className={styles.headerTitle}>Profil</span>
        </div>
      </header>

      <div className={styles.dogInfo}>
        <Avatar name={profile.name} size={72} />
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
                    {selected && <span aria-hidden="true">✓</span>}
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

        {saved ? (
          <p className={styles.savedMsg}>Sparat!</p>
        ) : (
          <button type="button" className={styles.saveBtn} onClick={handleSave}>
            Spara ändringar
          </button>
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
              {selected && <span aria-hidden="true">✓</span>}
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
  }
  return map[breed] ?? breed
}

function BackIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}
