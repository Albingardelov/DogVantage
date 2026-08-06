import { useCallback, useEffect, useState } from 'react'
import type { OnboardingPrefs } from '@dogvantage/core'
import { useAuth } from '@/lib/auth/AuthContext'
import {
  fetchActiveDog,
  fetchAllDogs,
  switchActiveDog,
  type ActiveDog,
} from '@/lib/dog/active-dog'
import { updateDogProfile } from '@/lib/dog/profile'
import { useDogGate } from '@/lib/dog/DogGateContext'

export type ProfileDraft = {
  name: string
  birthdate: string
  trainingWeek: number
  sex?: ActiveDog['sex']
  castrationStatus?: ActiveDog['castrationStatus']
  onboarding: OnboardingPrefs
}

function draftFromDog(dog: ActiveDog): ProfileDraft {
  return {
    name: dog.name,
    birthdate: dog.birthdate,
    trainingWeek: dog.trainingWeek ?? 1,
    sex: dog.sex,
    castrationStatus: dog.castrationStatus,
    onboarding: {
      goals: dog.onboarding?.goals ?? ['everyday_obedience'],
      environment: dog.onboarding?.environment ?? 'suburb',
      rewardPreference: dog.onboarding?.rewardPreference ?? 'mixed',
      takesRewardsOutdoors: dog.onboarding?.takesRewardsOutdoors ?? true,
      householdPets: dog.onboarding?.householdPets,
      trainingBackground: dog.onboarding?.trainingBackground,
      ownerNotes: dog.onboarding?.ownerNotes,
    },
  }
}

export function useProfile() {
  const { user } = useAuth()
  const { refreshDogs } = useDogGate()
  const [dog, setDog] = useState<ActiveDog | null>(null)
  const [allDogs, setAllDogs] = useState<ActiveDog[]>([])
  const [draft, setDraft] = useState<ProfileDraft | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedFlash, setSavedFlash] = useState(false)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [active, dogs] = await Promise.all([fetchActiveDog(), fetchAllDogs()])
      setDog(active)
      setAllDogs(dogs)
      setDraft(active ? draftFromDog(active) : null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kunde inte ladda profil')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  const save = useCallback(async () => {
    if (!dog?.id || !draft) return
    setSaving(true)
    setError(null)
    setSavedFlash(false)
    try {
      await updateDogProfile({
        id: dog.id,
        name: draft.name.trim(),
        birthdate: draft.birthdate,
        trainingWeek: draft.trainingWeek,
        sex: draft.sex,
        castrationStatus: draft.castrationStatus,
        onboarding: draft.onboarding,
      })
      await reload()
      setSavedFlash(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kunde inte spara')
    } finally {
      setSaving(false)
    }
  }, [dog?.id, draft, reload])

  const switchDog = useCallback(
    async (dogId: string) => {
      if (!user?.id) return
      setError(null)
      try {
        await switchActiveDog(user.id, dogId)
        await refreshDogs()
        await reload()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Kunde inte byta hund')
      }
    },
    [user?.id, refreshDogs, reload],
  )

  return {
    dog,
    allDogs,
    draft,
    setDraft,
    loading,
    saving,
    error,
    savedFlash,
    reload,
    save,
    switchDog,
  }
}
