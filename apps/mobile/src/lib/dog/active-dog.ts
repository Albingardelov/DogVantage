import { supabase } from '@/lib/supabase'
import type { DogProfile, OnboardingPrefs } from '@dogvantage/core'
import { getAgeInWeeks } from '@dogvantage/core'

export type ActiveDog = DogProfile & {
  ageWeeks: number
}

function dbToProfile(row: {
  id: string
  name: string
  breed: string
  birthdate: string
  training_week: number | null
  sex: string | null
  castration_status: string | null
  onboarding: OnboardingPrefs | null
}): DogProfile {
  return {
    id: row.id,
    name: row.name,
    breed: row.breed,
    birthdate: row.birthdate,
    trainingWeek: row.training_week ?? 1,
    sex: (row.sex as DogProfile['sex']) ?? undefined,
    castrationStatus: (row.castration_status as DogProfile['castrationStatus']) ?? undefined,
    onboarding: row.onboarding ?? undefined,
  }
}

const DOG_SELECT =
  'id, name, breed, birthdate, training_week, sex, castration_status, onboarding' as const

export async function fetchActiveDog(): Promise<ActiveDog | null> {
  const { data: settings } = await supabase
    .from('user_settings')
    .select('active_dog_id')
    .maybeSingle()

  let dogId = settings?.active_dog_id as string | null | undefined

  if (!dogId) {
    const { data: first } = await supabase
      .from('dog_profiles')
      .select('id')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()
    dogId = first?.id ?? null
  }

  if (!dogId) return null

  const { data, error } = await supabase
    .from('dog_profiles')
    .select(DOG_SELECT)
    .eq('id', dogId)
    .single()

  if (error || !data) return null
  const profile = dbToProfile(data)
  return {
    ...profile,
    ageWeeks: getAgeInWeeks(profile.birthdate),
  }
}

export async function fetchAllDogs(): Promise<ActiveDog[]> {
  const { data, error } = await supabase
    .from('dog_profiles')
    .select(DOG_SELECT)
    .order('created_at', { ascending: true })

  if (error || !data) return []
  return data.map((row) => {
    const profile = dbToProfile(row)
    return { ...profile, ageWeeks: getAgeInWeeks(profile.birthdate) }
  })
}

export async function switchActiveDog(userId: string, dogId: string): Promise<void> {
  const { error } = await supabase.from('user_settings').upsert({
    user_id: userId,
    active_dog_id: dogId,
  })
  if (error) throw new Error(error.message)
}
