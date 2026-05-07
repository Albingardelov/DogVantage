'use client'

import { useState } from 'react'
import { useActiveDog } from '@/lib/dog/active-dog-context'
import { saveDogProfile } from '@/lib/dog/profile'
import { getSupabaseBrowser } from '@/lib/supabase/browser'
import { BREEDS, GOALS, ENVIRONMENTS, REWARDS } from '@/components/DogProfileForm'
import type { Breed, TrainingGoal, TrainingEnvironment, RewardPreference } from '@/types'
import styles from './AddDogModal.module.css'

interface Props {
  onClose: () => void
}

export default function AddDogModal({ onClose }: Props) {
  const { switchDog, refreshDogs } = useActiveDog()

  const [name, setName] = useState('')
  const [breed, setBreed] = useState<Breed | ''>('')
  const [birthdate, setBirthdate] = useState('')
  const [goals, setGoals] = useState<TrainingGoal[]>(['everyday_obedience'])
  const [environment, setEnvironment] = useState<TrainingEnvironment>('suburb')
  const [rewardPreference, setRewardPreference] = useState<RewardPreference>('mixed')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSave = name.trim() && breed && birthdate

  async function handleSave() {
    if (!canSave || saving) return
    setSaving(true)
    setError(null)
    try {
      const { data: { user } } = await getSupabaseBrowser().auth.getUser()
      if (!user) throw new Error('Inte inloggad')

      const saved = await saveDogProfile({
        name: name.trim(),
        breed: breed as Breed,
        birthdate,
        trainingWeek: 1,
        onboarding: {
          goals,
          environment,
          rewardPreference,
          takesRewardsOutdoors: true,
        },
      }, user.id)

      await refreshDogs()
      if (saved.id) await switchDog(saved.id)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Något gick fel')
      setSaving(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <span className={styles.title}>Lägg till hund</span>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Stäng">✕</button>
        </div>

        <div className={styles.body}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="dog-name">Hundens namn</label>
            <input
              id="dog-name"
              className={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="T.ex. Bella"
              maxLength={40}
            />
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Ras</span>
            <div className={styles.optionList}>
              {BREEDS.map((b) => (
                <button
                  key={b.value}
                  type="button"
                  className={`${styles.optionBtn} ${breed === b.value ? styles.optionBtnSelected : ''}`}
                  onClick={() => setBreed(b.value)}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="dog-birthdate">Födelsedag</label>
            <input
              id="dog-birthdate"
              type="date"
              className={styles.input}
              value={birthdate}
              onChange={(e) => setBirthdate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Träningsmål</span>
            <div className={styles.optionList}>
              {GOALS.map((g) => {
                const selected = goals.includes(g.value)
                return (
                  <button
                    key={g.value}
                    type="button"
                    className={`${styles.optionBtn} ${selected ? styles.optionBtnSelected : ''}`}
                    onClick={() => setGoals((prev) =>
                      prev.includes(g.value)
                        ? prev.length > 1 ? prev.filter((x) => x !== g.value) : prev
                        : [...prev, g.value]
                    )}
                  >
                    {g.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Träningsmiljö</span>
            <div className={styles.optionList}>
              {ENVIRONMENTS.map((e) => (
                <button
                  key={e.value}
                  type="button"
                  className={`${styles.optionBtn} ${environment === e.value ? styles.optionBtnSelected : ''}`}
                  onClick={() => setEnvironment(e.value)}
                >
                  {e.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Belöning</span>
            <div className={styles.optionList}>
              {REWARDS.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  className={`${styles.optionBtn} ${rewardPreference === r.value ? styles.optionBtnSelected : ''}`}
                  onClick={() => setRewardPreference(r.value)}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button
            type="button"
            className={styles.saveBtn}
            onClick={handleSave}
            disabled={!canSave || saving}
          >
            {saving ? 'Sparar…' : 'Lägg till hund'}
          </button>
        </div>
      </div>
    </div>
  )
}
