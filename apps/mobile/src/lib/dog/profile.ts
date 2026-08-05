import type {
  DogProfile,
  HouseholdPet,
  OnboardingPrefs,
  RewardPreference,
  TrainingBackground,
  TrainingEnvironment,
  TrainingGoal,
} from '@dogvantage/core'
import { supabase } from '@/lib/supabase'

export const GOAL_OPTIONS: { value: TrainingGoal; label: string }[] = [
  { value: 'everyday_obedience', label: 'Vardagslydnad' },
  { value: 'sport', label: 'Sport / tävling' },
  { value: 'hunting', label: 'Jakt / bruk' },
  { value: 'herding', label: 'Vallning' },
  { value: 'impulse_control', label: 'Impulskontroll & lugn' },
  { value: 'nosework', label: 'Nosework / doftsök' },
  { value: 'problem_solving', label: 'Lösa problem (t.ex. koppel)' },
]

export const ENVIRONMENT_OPTIONS: { value: TrainingEnvironment; label: string }[] = [
  { value: 'city', label: 'Stad (mycket folk/hundar)' },
  { value: 'suburb', label: 'Förort / blandat' },
  { value: 'rural', label: 'Land / natur' },
]

export const REWARD_OPTIONS: { value: RewardPreference; label: string }[] = [
  { value: 'food', label: 'Mat' },
  { value: 'toy', label: 'Leksak' },
  { value: 'social', label: 'Socialt (beröm/lek)' },
  { value: 'mixed', label: 'Blandat' },
]

export const BACKGROUND_OPTIONS: { value: TrainingBackground; label: string }[] = [
  { value: 'beginner', label: 'Nybörjare / första hunden' },
  { value: 'some_training', label: 'Har tränat en del' },
  { value: 'experienced', label: 'Erfaren' },
]

export const PET_OPTIONS: { value: HouseholdPet; label: string }[] = [
  { value: 'cats_indoor', label: 'Katt (inne)' },
  { value: 'cats_outdoor', label: 'Katt (ute)' },
  { value: 'dogs', label: 'Andra hundar' },
  { value: 'small_animals', label: 'Smådjur' },
  { value: 'livestock', label: 'Boskap' },
]

export async function countUserDogs(): Promise<number> {
  const { count, error } = await supabase
    .from('dog_profiles')
    .select('id', { count: 'exact', head: true })
  if (error) throw error
  return count ?? 0
}

export async function saveNewDogProfile(input: {
  userId: string
  name: string
  breed: string
  birthdate: string
  sex?: DogProfile['sex']
  castrationStatus?: DogProfile['castrationStatus']
  onboarding: OnboardingPrefs
}): Promise<DogProfile> {
  const row = {
    user_id: input.userId,
    name: input.name.trim(),
    breed: input.breed,
    birthdate: input.birthdate,
    training_week: 1,
    sex: input.sex ?? null,
    castration_status: input.castrationStatus ?? null,
    onboarding: input.onboarding,
    assessment: { status: 'not_started' as const },
  }

  const { data, error } = await supabase
    .from('dog_profiles')
    .insert(row)
    .select('id')
    .single()

  if (error || !data) throw new Error(error?.message ?? 'Failed to save profile')

  await supabase.from('user_settings').upsert({
    user_id: input.userId,
    active_dog_id: data.id,
  })

  return {
    id: data.id,
    name: row.name,
    breed: row.breed,
    birthdate: row.birthdate,
    trainingWeek: 1,
    sex: input.sex,
    castrationStatus: input.castrationStatus,
    onboarding: input.onboarding,
    assessment: { status: 'not_started' },
  }
}

export async function ensureTrialForSession(accessToken: string): Promise<void> {
  const base =
    process.env.EXPO_PUBLIC_WEB_URL?.replace(/\/$/, '') ||
    process.env.EXPO_PUBLIC_APP_URL?.replace(/\/$/, '') ||
    ''
  if (!base) return
  try {
    await fetch(`${base}/api/billing/ensure-trial`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })
  } catch (e) {
    console.warn('[ensureTrialForSession]', e)
  }
}
